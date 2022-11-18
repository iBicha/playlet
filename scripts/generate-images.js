const fs = require('fs')
const path = require('path')
const { convertFile } = require('convert-svg-to-png');

const logoInput = './src/images/vector/logo.svg';

logoOutput = {
    // Logo
    "splash-screen_fhd.jpg": {
        width: 1920,
        height: 1080
    },
    "splash-screen_hd.jpg": {
        width: 1280,
        height: 720
    },
    "splash-screen_sd.jpg": {
        width: 720,
        height: 480
    },
    "channel-poster_fhd.png": {
        width: 540,
        height: 405
    },
    "channel-poster_hd.png": {
        width: 290,
        height: 218
    },
    "channel-poster_sd.png": {
        width: 214,
        height: 144
    },
};

const iconsInput = './src/images/vector/icons';
const iconsOutput = './src/images/icons';

(async () => {

    for (var logo in logoOutput) {
        await convertFile(logoInput, {
            outputFilePath: './src/images/' + logo,
            background: "#242424",
            height: logoOutput[logo].height,
            width: logoOutput[logo].width,
        });

        console.log(`Generated ${logo}`)
    }

    const iconFiles = fs.readdirSync(iconsInput)
    for (var i in iconFiles) {
        const input = path.join(iconsInput, iconFiles[i])
        const output = path.join(iconsOutput, iconFiles[i].replace('.svg', '.png'))

        await convertFile(input, {
            outputFilePath: output,
            width: 64,
            height: 64,
        });

        console.log(`Generated ${output}`)
    }
})();
