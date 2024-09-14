import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Lấy đường dẫn thư mục hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function zipFolder(folderPath, outputZipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Đã nén ${archive.pointer()} bytes`);
            resolve(outputZipPath); // Trả về đường dẫn đến file ZIP
        });

        archive.on('error', (err) => {
            console.error('Lỗi khi nén thư mục:', err);
            reject(err); // Gửi lỗi nếu có
        });

        // Nén thư mục vào file ZIP
        archive.directory(folderPath, false);
        archive.pipe(output);
        archive.finalize();
        
    });
}

/**
 * Xóa một thư mục và tất cả nội dung bên trong nó.
 * @param {string} folderPath - Đường dẫn đến thư mục cần xóa.
 * @returns {Promise<void>} - Trả về một Promise khi quá trình xóa hoàn tất.
 */
