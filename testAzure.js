import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PassThrough } from 'stream';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_KEY1, process.env.AZURE_REGION);
speechConfig.speechSynthesisOutputFormat = 5; // mp3 format

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
    // Set the selected voice
    const voiceName = voiceData[selectedLanguage]?.[selectedVoice];
    if (!voiceName) {
      return reject(new Error("Invalid voice or language selection"));
    }
    speechConfig.speechSynthesisVoiceName = voiceName;

    // Output directory and file name
    const outputDir = path.join(__dirname, `TextToSpeech/${clientId}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const filename = path.join(outputDir, `speech.mp3`);

    // Create audio configuration
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      text,
      result => {
        synthesizer.close();

        // Return stream from the generated audio file
        const audioFile = fs.createReadStream(filename);
        resolve(audioFile);
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}

// // Test call
// TextToSpeechAzure(123123, 'Hello world', 'English', 'Andrew')
//   .then((stream) => {
//     console.log('Audio file stream ready.');
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });
