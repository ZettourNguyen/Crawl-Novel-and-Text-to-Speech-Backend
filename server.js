import express from 'express';
import cors from 'cors';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { startCrawl, stopCrawling } from './crawl_metruyencv.js'
import fs from 'fs-extra';
import { TextToSpeechAzure } from './testAzure.js';
import { TextToSpeechAws } from './aws-polly.js'; 
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Cấu hình Winston logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => new Date().toLocaleString() // Định dạng datetime
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ],
});

// CORS
app.use(cors());

// xử lý dữ liệu JSON
app.use(express.json());

const clients = new Map();


// Route SSE để gửi log tới client
app.get('/events/:clientId', (req, res) => {
  const clientId = req.params.clientId;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Gửi header tới client

  // Thêm client vào danh sách clients với clientId
  clients.set(clientId, res);
  console.log(`Client ${clientId} connected from SSE`);
  // Gui thong bao da connect
  sendLogToClient(clientId, 'Status', `${clientId} is Connected`)
  // Khi client ngắt kết nối, xóa khỏi danh sách clients


  req.on('close', () => {
    stopCrawling(clientId)
    clients.delete(clientId);
    console.log(`Client ${clientId} disconnected from SSE`);
  });
});

// Hàm gửi log tới client cụ thể
// Hàm gửi log tới client
export function sendLogToClient(clientId, level, message) {
  const client = clients.get(clientId);
  if (client) {
    const timestamp = new Date().toLocaleString();
    const formattedMessage = `${timestamp} [${level}]: ${message}`;
    client.write(`data: ${JSON.stringify({ type: 'log', level, message: formattedMessage })}\n\n`);
  }
}

// Hàm gửi file zip qua SSE
export async function sendZip(clientId, filePath) {
  const client = clients.get(clientId);

  if (client) {
    try {
      const fileStream = fs.createReadStream(filePath);
      let dataBuffer = '';

      fileStream.on('data', (chunk) => {
        // Chuyển chunk sang base64 và nối vào buffer
        dataBuffer += chunk.toString('base64');
      });

      fileStream.on('end', () => {
        // Gửi toàn bộ dữ liệu đã được mã hóa base64 khi kết thúc
        client.write(`data: ${JSON.stringify({ type: 'file', base64Data: dataBuffer })}\n\n`);
        client.write('data: END\n\n');
      });

      fileStream.on('error', (err) => {
        client.write('data: ERROR\n\n');
        console.error('Lỗi khi gửi file qua SSE:', err);
      });
    } catch (error) {
      client.write('data: ERROR\n\n');
      console.error('Lỗi khi gửi file qua SSE:', error);
    }
  } else {
    console.error('Client không tồn tại:', clientId);
  }
}


app.post('/stop/:clientId', async (req, res) => {
  const clientId = req.params.clientId; // Không cần optional chaining vì clientId luôn có
  stopCrawling(clientId); // Gọi hàm stopCrawling
  res.status(200).send({ message: `Crawl process for client ${clientId} is stopping.` });
});


// Route nhận URL
app.post('/texttospeech', async (req, res) => {
  const { service, language, voice, text, clientId } = req.body;
  
  const logMessage = `
  =================================
  Xác nhận đầu vào: ${service} - ${language} - ${voice} - ${text}
  =================================`;
  sendLogToClient(clientId, 'info', logMessage);
  logger.info(logMessage);

  let outputFilePath = '';
  try {
    if (service === 'azure') {
      const a  = await TextToSpeechAzure(clientId, text, language, voice);
      outputFilePath= a.path.toString()
    } else {
      outputFilePath = await TextToSpeechAws(clientId, text, voice);
    }
    console.log(outputFilePath)
    const data = fs.readFileSync(outputFilePath);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Content-Type', 'audio/mp3');
    res.send(data);
  } catch (error) {
    console.error('Lỗi khi xử lý yêu cầu:', error);
    res.status(500).send('Lỗi khi xử lý yêu cầu');
  }
});


app.post('/url', (req, res) => {

  const url = req.body?.url;
  const clientId = req.body?.clientId;
  const maxChaptersPerFile = req.body?.selectedNumChapter

  // Gửi thông tin log tới client cụ thể
  const logMessage = ` \n
  \n
  =================================\n
  Bắt đầu crawl truyện với URL: ${url} \n`;
  sendLogToClient(clientId, 'info ', logMessage); // Gửi log tới client cụ thể
  logger.info(url);
  startCrawl(url, clientId, maxChaptersPerFile);
});

// Lắng nghe tại cổng 3000
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
