import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './server.js';
import { sendLogToClient } from './server.js';
import { zipFolder } from './crawl_zip_folder.js'
import { deleteFolder } from './crawl_delete.js'
import { sendZip } from './server.js';

// Xác định thư mục gốc của tệp hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const stopFlags = new Map();


// Hàm crawl và gộp các chương
export async function fetchChapterAndMerge(url_chapter, folder_name, outputZipPath, startChapter, clientId, maxChaptersPerFile) {
    let currentChapter = startChapter;
    let accumulatedContent = '';
    let missing_chapters = ''

    stopFlags.set(clientId, false);
    try {
        while (true) {

            if (stopFlags.get(clientId)) {
                // dung theo yc client
                const logMessage = `Đã dừng crawl theo yêu cầu của client ${clientId}`;
                logger.info(logMessage);
                sendLogToClient(clientId, 'info ', logMessage);
                // ket thuc cong viec
                postProcessing(clientId, folder_name, outputZipPath)
                break;
            }
            let response = ''
            try {
                response = await axios.get(url_chapter);
            } catch (error) {
                logger.error(error.message)
                // dung do loi ko content cua url
                // luu chuong da crawl truoc chuong ko content
                const fileName = `${folder_name}/chuong-${startChapter}-${currentChapter - 1}.txt`;
                fs.writeFileSync(fileName, accumulatedContent, 'utf8');
                const logMessage2 = `Đã lưu nội dung các chương từ ${startChapter} đến ${currentChapter - 1}`
                logger.info(logMessage2)
                sendLogToClient(clientId, 'info ', logMessage2);
                sendLogToClient(clientId, 'infor', 'Các chương cần kiểm tra lại số chữ: ' + missing_chapters)
                // ket thuc cong viec
                postProcessing(clientId, folder_name, outputZipPath)
            }
            const $ = cheerio.load(response.data);
            let content = $('div[data-x-bind="ChapterContent"]').html();
            if (!content) {
                // dung cho ko content cua url
                const logMessage = ('Nội dung không có tại chương ' + currentChapter);
                logger.error(logMessage)
                sendLogToClient(clientId, 'error', logMessage);
                // ket thuc cong viec
                postProcessing(clientId, folder_name, outputZipPath)
                break;
            }

            content = content.replace(/<br><br>/g, '\n')
                .replace(/·/g, '')
                .replace(/<div id="middle-content-two"><\/div>/g, '')
                .replace(/<div id="middle-content-one"><\/div>/g, '')
                .replace(/<div id="middle-content-three"><\/div>/g, '')
                .replace(/】/g, '】,');


            let content_length = content.length
            let loop_num = 1
            while (content_length < 2000 && loop_num < 16) {
                if (stopFlags.get(clientId)) {
                    const logMessage = `Đã dừng crawl theo yêu cầu của client ${clientId}`;
                    logger.info(logMessage);
                    sendLogToClient(clientId, 'info ', logMessage);
                    // ket thuc cong viec
                    postProcessing(clientId, folder_name, outputZipPath)
                    return;
                }
                // Thông báo thực hiện crawl lại
                const logMessage = `Lỗi crawl chương ${currentChapter}`;
                const logMessageAgain = `Đang thực hiện crawl lại. || ${loop_num}`
                logger.error(logMessage);
                sendLogToClient(clientId, 'error', logMessage);
                logger.error(logMessageAgain);
                sendLogToClient(clientId, 'error', logMessageAgain);

                // Thực hiện crawl lại chương
                response = await axios.get(url_chapter);
                const $ = cheerio.load(response.data);
                content = $('div[data-x-bind="ChapterContent"]').html();
                if (!content) {
                    const logMessage = `Nội dung không có tại chương ${currentChapter}`;
                    logger.error(logMessage);
                    sendLogToClient(clientId, 'error', logMessage);
                    postProcessing(clientId, folder_name, outputZipPath)
                    break;
                }

                content = content
                    .replace(/<br><br>/g, '\n')
                    .replace(/·/g, '')
                    .replace(/<div id="middle-content-two"><\/div>/g, '')
                    .replace(/<div id="middle-content-one"><\/div>/g, '')
                    .replace(/<div id="middle-content-three"><\/div>/g, '')
                    .replace(/】/g, ',');


                content_length = content.length; // Cập nhật content_length

                // Kiểm tra nếu loop_num đạt đến 15
                if (loop_num === 15) {
                    missing_chapters += ` || ${currentChapter}`;
                }

                // Đếm số lần crawl lại
                loop_num++;
            }
            accumulatedContent += content + '\n';
            const logMessage = `Đã crawl chương ${currentChapter} || ${content_length}`
            logger.info(logMessage)
            sendLogToClient(clientId, 'info ', logMessage);

            const nextChapterUrl = url_chapter.replace(/chuong-(\d+)/, (match, number) => {
                const nextChapterNumber = parseInt(number, 10) + 1;
                return `chuong-${nextChapterNumber}`;
            });

            url_chapter = nextChapterUrl;
            currentChapter++;

            if ((currentChapter - startChapter) >= maxChaptersPerFile) {
                const fileName = `${folder_name}/chuong-${startChapter}-${currentChapter - 1}.txt`;
                fs.writeFileSync(fileName, accumulatedContent, 'utf8');

                const logMessage = `Đã lưu nội dung các chương từ ${startChapter} đến ${currentChapter - 1}`
                logger.info(logMessage)
                sendLogToClient(clientId, 'info ', logMessage);

                accumulatedContent = '';
                startChapter = currentChapter;
            }
        }

        if (accumulatedContent) {
            const fileName = `${folder_name}/chuong-${startChapter}-${currentChapter - 1}.txt`;
            fs.writeFileSync(fileName, accumulatedContent, 'utf8');
            const logMessage = `Đã lưu nội dung các chương từ ${startChapter} đến ${currentChapter - 1} vào ${fileName}`
            logger.info(logMessage)
            sendLogToClient(clientId, 'info ', logMessage);
        }

    } catch (error) {
        logger.error(logMessage)
        // console.log(`Đã hoàn thành việc crawl đến chương ${currentChapter - 1}`);
    }
}

// Hàm bắt đầu crawl
export async function startCrawl(url, clientId, maxChaptersPerFile) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const title = $('a.font-semibold.text-lg.text-title').text();
        const folder_name = `metruyencv/${clientId}/${url.split('/').slice(-1)[0]}`;
        const outputZipPath = `metruyencv/${clientId}/${url.split('/').slice(-1)[0]}.zip`;
        const folderPath = path.join(__dirname, folder_name);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            const logMessage = 'Thư mục đã được tạo thành công!'
            logger.info(logMessage)
            sendLogToClient(clientId, 'info ', logMessage);
        } else {
            const logMessage = 'Thư mục đã tồn tại'
            logger.info(logMessage)
            sendLogToClient(clientId, 'error', logMessage);
        }

        const chapterLink = `${url}/chuong-1`;
        const url_chapter = chapterLink;
        await fetchChapterAndMerge(url_chapter, folder_name, outputZipPath, 1, clientId, maxChaptersPerFile);
    } catch (error) {
        const logMessage = `Có lỗi xảy ra trong startCrawl:${error.message}
        \n
        Kết thúc crawl lần này 
        \n =========================================`
        logger.error(logMessage)
        sendLogToClient(clientId, 'error', logMessage);
    }
}

export async function stopCrawling(clientId) {
    stopFlags.set(clientId, true);
}

// hau xu ly: zip folder, delete folder, send folder to client and send log
export async function postProcessing(clientId, folder_name, outputZipPath) {
    const logMessage1 = `Đang thực hiện nén...`;
    logger.info(logMessage1);
    sendLogToClient(clientId, 'info ', logMessage1);

    try {
        await zipFolder(folder_name, outputZipPath)
        const logMessage2 = `Nén thành công. Vui lòng kiểm tra trong danh sách`
        logger.info(logMessage2);
        sendLogToClient(clientId, 'info ', logMessage2);
    } catch (error) {
        const logMessage = `Lỗi khi nén folder.`;
        logger.error(logMessage);
        sendLogToClient(clientId, 'error', logMessage);
    }

    try {
        console.log('====================' + outputZipPath)
        await sendZip(clientId, outputZipPath)
        const logMessage3 = `Đã gửi thành công, đã tải xuống, vui lòng kiểm tra.`
        logger.info(logMessage3);
        sendLogToClient(clientId, 'info ', logMessage3);
    } catch (error) {
        const logMessage = `Lỗi gửi file.`;
        logger.error(logMessage);
        sendLogToClient(clientId, 'error', logMessage);
    }

    try {
        await deleteFolder(folder_name)
    } catch (error) {
        const logMessage = `Lỗi gửi xóa folder.`;
        logger.error(logMessage);
        // sendLogToClient(clientId, 'error', logMessage);
    }


}
// // Chạy chương trình với URL truyện
// const url = 'https://metruyencv.com/truyen/toan-dan-chuyen-chuc-hoan-my-nhan-vat-phan-dien-nhan-sinh';
// startCrawl(url);
