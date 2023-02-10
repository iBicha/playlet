const fs = require('fs');
const path = require('path');

if (process.argv.length !== 3) {
    console.error("Invalid usage! usage: npm run generate-sponsorblock-config -- sponsorblock_root");
    exit(-1);
}

const PLAYLEY_CONFIG_PATH = "./playlet-lib/src/config/sponsorblock_config.json"

const sponsorblockRoot = process.argv[2];

const configExamplePath = path.join(sponsorblockRoot, "config.json.example")
const englishLocalePath = path.join(sponsorblockRoot, "public/_locales/en/messages.json")

let configExample = JSON.parse(fs.readFileSync(configExamplePath, { encoding: 'utf8', flag: 'r' }))
let englishLocale = JSON.parse(fs.readFileSync(englishLocalePath, { encoding: 'utf8', flag: 'r' }))

// https://github.com/ajayyy/SponsorBlock/blob/f4d80d88438ff31bc067ff480fd94112d972718d/src/config.ts#L251
const barTypes = {
    "preview-chooseACategory": {
        color: "#ffffff",
        opacity: "0.7"
    },
    "sponsor": {
        color: "#00d400",
        opacity: "0.7"
    },
    "preview-sponsor": {
        color: "#007800",
        opacity: "0.7"
    },
    "selfpromo": {
        color: "#ffff00",
        opacity: "0.7"
    },
    "preview-selfpromo": {
        color: "#bfbf35",
        opacity: "0.7"
    },
    "exclusive_access": {
        color: "#008a5c",
        opacity: "0.7"
    },
    "interaction": {
        color: "#cc00ff",
        opacity: "0.7"
    },
    "preview-interaction": {
        color: "#6c0087",
        opacity: "0.7"
    },
    "intro": {
        color: "#00ffff",
        opacity: "0.7"
    },
    "preview-intro": {
        color: "#008080",
        opacity: "0.7"
    },
    "outro": {
        color: "#0202ed",
        opacity: "0.7"
    },
    "preview-outro": {
        color: "#000070",
        opacity: "0.7"
    },
    "preview": {
        color: "#008fd6",
        opacity: "0.7"
    },
    "preview-preview": {
        color: "#005799",
        opacity: "0.7"
    },
    "music_offtopic": {
        color: "#ff9900",
        opacity: "0.7"
    },
    "preview-music_offtopic": {
        color: "#a6634a",
        opacity: "0.7"
    },
    "poi_highlight": {
        color: "#ff1684",
        opacity: "0.7"
    },
    "preview-poi_highlight": {
        color: "#9b044c",
        opacity: "0.7"
    },
    "filler": {
        color: "#7300FF",
        opacity: "0.9"
    },
    "preview-filler": {
        color: "#2E0066",
        opacity: "0.7"
    }
}

function getColor(obj) {
    if (!obj) {
        return "#FFFFFFC8"
    }

    const opacity = (Math.round(parseFloat(obj.opacity) * 255)).toString(16).toUpperCase().padStart(2, "0")
    return obj.color + opacity;
}

let playletConfig = {
    serverAddress: configExample.serverAddress,
    categoryList: configExample.categoryList,
    categories: {}
}

playletConfig.categoryList.forEach(categoryId => {
    const category = {}

    category.title = englishLocale[`category_${categoryId}`].message
    category.short_title = englishLocale[`category_${categoryId}_short`]?.message ?? category.title;
    category.categorySupport = configExample.categorySupport[categoryId];
    category.color = getColor(barTypes[categoryId]);

    playletConfig.categories[categoryId] = category;
});

fs.writeFileSync(PLAYLEY_CONFIG_PATH, JSON.stringify(playletConfig, null, 4));
