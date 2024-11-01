const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const { exec } = require("child_process");
const { promises: fs } = require("fs");
const voice = require("elevenlabs-node");
const cors = require("cors");
const OpenAI = require("openai");

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "kgG7dCoKCfLehAPWkJOE";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
  });

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const lipSyncMessage = async (message) => {
    const time = new Date().getTime();
    console.log(`Starting conversion for message ${message}`);
    await execCommand(
      `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
      // -y to overwrite the file
    );
    console.log(`Conversion done in ${new Date().getTime() - time}ms`);
    await execCommand(
      `./bin/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
    );
    // -r phonetic is faster but less accurate
    console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
  };

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;
    if(!userMessage){
        res.send({
            messages: [
                {
                    text: "Hello, How can I help you?",
                    audio: await audioFileToBase64(""),
                    lipsync: await readJsonTranscript(""),
                    facialExpression: "smile",
                    animition: "Talking_1",
                },
                {
                    text:"Ask me anything related to Software",
                    audio: await audioFileToBase64(""),
                    libsync: await readJsonTranscript(""),
                    facialExpression: "default",
                    animation: "Talking_1",
                }
            ]
        })
        return;
    }
    if (!elevenLabsApiKey || openai.apiKey === "-") {
        res.send({
          messages: [
            {
              text: "Please my dear, don't forget to add your API keys!",
              audio: await audioFileToBase64("audios/api_0.wav"),
              lipsync: await readJsonTranscript("audios/api_0.json"),
              facialExpression: "angry",
              animation: "Angry",
            },
            {
              text: "You don't want to ruin Wawa Sensei with a crazy ChatGPT and ElevenLabs bill, right?",
              audio: await audioFileToBase64("audios/api_1.wav"),
              lipsync: await readJsonTranscript("audios/api_1.json"),
              facialExpression: "smile",
              animation: "Laughing",
            },
          ],
        });
        return;
      }
    const completion = await openai.chat.completion.create({
        model: "gpt-3.5-turbo",
        max_tokens: 0.6,
        response_format: {
            type: "json_object",
        },
        messages: [
            {
                role: "system",
                content: `
                You are a software developer helper.
                You will always reply with a JSON array of messages. With a maximum of 2 messages.
                Each message has a text, facicalExpression, and animation property.
                The different facial expressions are: smile, sad, angry, suprised, funnyFace, and default.
                The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.
                `
            },
            {
                role: "user",
                content: userMessage || "Hello",
            },
        ],

    })
    let messages = JSON.parse(completion.choices[0].message.content);
    if (messages.messages) {
      messages = messages.messages;
    }
    for (let i = 0; i < messages.length; i++){
        const message = messages[i]
        const fileName = `audios/message_${i}.mp3`;
        const textInput = message.text;
        await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput)
        await lipSyncMessage(i);
        message.audio = await audioFileToBase64(fileName)
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
    }
    res.send({messages})
    
})
const readJsonTranscript = async (file) => {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  };
  
  const audioFileToBase64 = async (file) => {
    const data = await fs.readFile(file);
    return data.toString("base64");
  };



app.listen(port, () => {
    console.log(`Virtual Dev listening on port ${port}`);
  });