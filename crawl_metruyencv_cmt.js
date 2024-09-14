// Hàm crawl chương với điều kiện url chương liền nhau
// export async function fetchChapter(url_chapter, folder_name) {
//     try {
//         const response = await axios.get(url_chapter);
//         const $ = cheerio.load(response.data);
//         let content = $('div[data-x-bind="ChapterContent"]').html();
//         if (!content) {
//             console.log(`Nội dung không có tại ${url_chapter}`);
//             return;
//         }
//         content = content.replace(/<br><br>/g, '\n')
//             .replace(/·/g, '')
//             .replace(/<div id="middle-content-two"><\/div>/g, '')
//             .replace(/<div id="middle-content-one"><\/div>/g, '')
//             .replace(/<div id="middle-content-three"><\/div>/g, '');


//         const file_name = url_chapter.split('/').slice(-1)[0];
//         const content_length = content.length
//         fs.appendFileSync(`${folder_name}/${file_name}.txt`, content + '\n');

//         const nextChapterUrl = url_chapter.replace(/chuong-(\d+)/, (match, number) => {
//             const currentChapterNumber = parseInt(number, 10);
//             const nextChapterNumber = currentChapterNumber + 1;
//             return `chuong-${nextChapterNumber}`;
//         });
//         console.log(`URL của chương tiếp theo: ${nextChapterUrl}`);
//         await fetchChapter(nextChapterUrl, folder_name);
//     } catch (error) {
//         logger.error(`Có lỗi xảy ra: ${error.message}`);
//     }
// }