import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_KEY1, process.env.AZURE_REGION);

const voiceData = {
  English: {
    Andrew: 'en-US-AndrewMultilingualNeural',
    Emma: 'en-US-EmmaMultilingualNeural',
    Brian: 'en-US-BrianMultilingualNeural',
  },
  Vietnamese: {
    HoaiMy: 'vi-VN-HoaiMyNeural',
    NamMinh: 'vi-VN-NamMinhNeural',
  },
};
export async function TextToSpeechAzure(clientId, text, selectedLanguage, selectedVoice) {
  return new Promise((resolve, reject) => {

    const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_KEY1, process.env.AZURE_REGION);

    speechConfig.speechSynthesisOutputFormat = 5; // mp3
    const voiceName = voiceData[selectedLanguage]?.[selectedVoice];
    speechConfig.speechSynthesisVoiceName = voiceName;
    let audioConfig = null;
    const outputDir = path.join(__dirname, `TextToSpeech/${clientId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = path.join(outputDir, `speech.mp3`);
    if (filename) {
      audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
    }

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      text,
      result => {

        const { audioData } = result;

        synthesizer.close();

        if (filename) {

          // return stream from file
          const audioFile = fs.createReadStream(filename);
          resolve(audioFile);

        } else {

          // return stream from memory
          const bufferStream = new PassThrough();
          bufferStream.end(Buffer.from(audioData));
          resolve(bufferStream);
        }
      },
      error => {
        synthesizer.close();
        reject(error);
      });
  });
}

TextToSpeechAzure(123123, 'Hello world', 'English', 'Andrew');

// export async function TextToSpeechAzure(clientId, text, selectedLanguage, selectedVoice) {
//   try {
//     const outputDir = path.join(__dirname, `TextToSpeech/${clientId}`);
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const audioFile = path.join(outputDir, `speech.mp3`);
//     const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

//     // Kiểm tra và thiết lập giọng đọc dựa trên ngôn ngữ và giọng đã chọn
//     const voiceName = voiceData[selectedLanguage]?.[selectedVoice];
//     if (!voiceName) {
//       console.error('Giọng đọc không hợp lệ hoặc không tồn tại');
//       throw new Error('Invalid voice or language');
//     }

//     speechConfig.speechSynthesisVoiceName = voiceName;

//     const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

//     return new Promise((resolve, reject) => {
//       synthesizer.speakTextAsync(text,
//         (result) => {
//           if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
//             console.log("Quá trình tổng hợp đã hoàn tất.");
//             resolve(audioFile);
//           } else {
//             console.error(result.errorDetails)
//             reject(new Error(result.errorDetails));
//           }
//           synthesizer.close();
//         },
//         (err) => {
//           console.trace("Lỗi - " + err);
//           synthesizer.close();
//           reject(err);
//         }
//       );
//     });
//   } catch (err) {
//     console.error("Lỗi khi tạo giọng nói:", err);
//     throw err;
//   }
// }
