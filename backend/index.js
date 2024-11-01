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
                    text
                }
            ]
        })
    }
})



app.listen(port, () => {
    console.log(`Virtual Girlfriend listening on port ${port}`);
  });