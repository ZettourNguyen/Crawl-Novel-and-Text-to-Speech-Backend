import fs from 'fs-extra';

export async function deleteFolder(folderPath) {
    try {
        // Sử dụng fs-extra để xóa thư mục và tất cả nội dung bên trong
        await fs.remove(folderPath);
        console.log(`Đã xóa thư mục ${folderPath}`);
    } catch (err) {
        console.error('Lỗi khi xóa thư mục:', err);
        throw err; // Gửi lỗi nếu có
    }
}
