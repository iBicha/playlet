// Description: Generates images for the project.
// Converts SVGs to PNGs and resizes them to the correct dimensions. 

const fs = require('fs');
const path = require('path');
const { convertFile } = require('convert-svg-to-png');

const logoPoster = './playlet-app/src/images/vector/logo-light.svg';
const logoSplash = './playlet-app/src/images/vector/logo-dark.svg';

const logoOutput = {
    // Logo
    "splash-screen_fhd.jpg": {
        width: 1920,
        height: 1080,
        background: "#242424",
        from: logoSplash
    },
    "splash-screen_hd.jpg": {
        width: 1280,
        height: 720,
        background: "#242424",
        from: logoSplash
    },
    "splash-screen_sd.jpg": {
        width: 720,
        height: 480,
        background: "#242424",
        from: logoSplash
    },
    "channel-poster_fhd.png": {
        width: 540,
        height: 405,
        background: "#FFFFFF",
        from: logoPoster
    },
    "channel-poster_hd.png": {
        width: 290,
        height: 218,
        background: "#FFFFFF",
        from: logoPoster
    },
    "channel-poster_sd.png": {
        width: 246,
        height: 140,
        background: "#FFFFFF",
        from: logoPoster
    },
};

const iconsInput = './playlet-app/src/images/vector/icons';
const iconsOutput = './playlet-lib/src/images/icons';

(async () => {
    for (var logo in logoOutput) {
        await convertFile(logoOutput[logo].from, {
            outputFilePath: './playlet-app/src/images/' + logo,
            background: logoOutput[logo].background,
            height: logoOutput[logo].height,
            width: logoOutput[logo].width,
        });

        console.log(`Generated ${logo}`);
    }

    const iconFiles = fs.readdirSync(iconsInput);
    for (var i in iconFiles) {
        const input = path.join(iconsInput, iconFiles[i]);
        const output = path.join(iconsOutput, iconFiles[i].replace('.svg', '.png'));

        await convertFile(input, {
            outputFilePath: output,
            width: 64,
            height: 64,
        });

        console.log(`Generated ${output}`);
    }
})();
