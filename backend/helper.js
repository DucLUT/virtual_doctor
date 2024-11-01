const { exec } = require("child_process");
const { promises: fs } = require("fs");

const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout ? stdout : stderr);
            }
        });
    });
};

const convertMp3ToWav = async (inputPath, outputPath) => {
    try {
        await execCommand(`ffmpeg -y -i ${inputPath} ${outputPath}`);
        console.log(`Converted ${inputPath} to ${outputPath}`);
    } catch (error) {
        console.error(`Error converting ${inputPath} to ${outputPath}:`, error);
    }
};

const generateLipSyncJson = async (wavPath, jsonPath) => {
    try {
        await execCommand(`./bin/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb -f json -o ${jsonPath} ${wavPath} -r phonetic`);
        console.log(`Generated lip-sync JSON ${jsonPath} from ${wavPath}`);
    } catch (error) {
        console.error(`Error generating lip-sync JSON ${jsonPath} from ${wavPath}:`, error);
    }
};

const processAudio = async (message) => {
    const mp3Path = `audios/message_${message}.mp3`;
    const wavPath = `audios/message_${message}.wav`;
    const jsonPath = `audios/message_${message}.json`;

    await convertMp3ToWav(mp3Path, wavPath);
    await generateLipSyncJson(wavPath, jsonPath);
};

const processIntroFiles = async () => {
    await processAudio('intro_0');
    await processAudio('intro_1');
};

// Run the script to process intro files
processIntroFiles().catch(console.error);

module.exports = {
    convertMp3ToWav,
    generateLipSyncJson,
    processAudio,
    processIntroFiles
};