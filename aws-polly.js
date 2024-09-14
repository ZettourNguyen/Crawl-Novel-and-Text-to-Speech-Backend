import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new PollyClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const TextToSpeechAws = async (clientId, text, voiceId) => {
    try {
        const outputDir = path.join(__dirname, `TextToSpeech/${clientId}`);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const params = {
            OutputFormat: "mp3",
            Text: text,
            VoiceId: voiceId,
            LanguageCode: "en-US"
        };
        const data = await client.send(new SynthesizeSpeechCommand(params));
        const audioStream = data.AudioStream;

        const fileName = path.join(outputDir, `speech.mp3`);
        const writeStream = fs.createWriteStream(fileName);

        await new Promise((resolve, reject) => {
            audioStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        console.log("Tệp MP3 đã được tạo.", fileName);
        return fileName;

    } catch (err) {
        console.error("Lỗi khi tạo giọng nói:", err);
        throw err;
    }
};
