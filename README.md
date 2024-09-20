# Crawl Novel & Text-to-Speech (TTS)

This project is designed to provide two key functionalities: web scraping of novel content and text-to-speech (TTS) conversion. Users can either crawl novel chapters from websites and convert them to audio or use the text-to-speech feature directly. The project supports multiple TTS services, including AWS and Azure, offering a wide variety of voices in both English and Vietnamese.

- **Video Demo**: (pending)
- **Website Demo**: (pending)
- **Preview Image**: 
<img src="https://raw.githubusercontent.com/ZettourNguyen/Crawl-Novel-and-Text-to-Speech-Frontend/main/src/assets/Crawl_ui.png">
<img src="https://raw.githubusercontent.com/ZettourNguyen/Crawl-Novel-and-Text-to-Speech-Frontend/main/src/assets/TextToSpeech_ui.png">

## Features

### Crawl Novel:
- Crawl novel content from specific websites.
- Use **Text-to-Speech** to convert the crawled text to MP3 audio files (for private use only, not publicly accessible).

### Text-to-Speech:
- Language: English, Vietnamese.
- Services: Azure AI Speech, Aws Polly
- Customize the voice (male, female, etc.) and language (English, Vietnamese).
- Utilizes modern TTS services to provide natural-sounding voices.

## Use Cases
- For users who wish to download and use the content offline.
- For users who prefer listening to novels rather than reading.
- Automating the process of converting long text content into audio files.

# How to run this project?
## With Docker:
#### On your terminal, type these commands to build a Docker Image:
```sh
docker compose up --build
```

### With the normal way (highly recommend):
I recommend this way because it will give you the results on your machine instead of downloading them on the client. For text-to-speech, retrieving the results from the server will always be accurate.

1. On your terminal, type these commands:
    ```sh
    git clone https://github.com/ZettourNguyen/Crawl-Novel-and-Text-to-Speech-Backend.git
    ```
    ```sh
    cd Crawl-Novel-and-Text-to-Speech-Backend
    ```

2. Install dependencies:
    ```sh
    npm install
    # or
    yarn install
    ```

3. Run server:
    ```sh
    npm run start
    # or
    yarn start
    ```

If you haven't set up the frontend yet, please visit [Crawl-Novel-and-Text-to-Speech-Frontend](https://github.com/ZettourNguyen/Crawl-Novel-and-Text-to-Speech-Frontend) for the setup instructions.

# Result
## Crawl novel

<img src="https://firebasestorage.googleapis.com/v0/b/tttn-ktc.appspot.com/o/assets%2Fimage.png?alt=media&token=e02bfce6-bf5b-47e1-ae5a-8d78914e506a" >

## Text to speech
###  Aws Polly:
##### English: `This is audio converted from text to speech.`
 
https://github.com/user-attachments/assets/bce9f55f-b98a-4468-9755-eae17cad8bb1

### Microsoft Azure AI Speech:
##### English: `This is audio converted from text to speech.`
 
https://github.com/user-attachments/assets/d7982ea8-f55a-43fe-b343-cef42285d7c3
    
##### Vietnamese: `Đây là âm thanh được chuyển đổi từ văn bản thành giọng nói.`
 
https://github.com/user-attachments/assets/73977c00-543d-4a8f-9dda-07a3896f17c6
    

