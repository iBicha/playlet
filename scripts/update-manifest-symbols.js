// Can safely get rid of this script after this is fixed https://github.com/rokucommunity/vscode-brightscript-language/issues/461
const fs = require('fs');

if (process.argv.length < 4) {
    console.error("Invalid usage! usage: npm run manifest-symbols -- MANIFEST_PATH SYMBOL1=true [SYMBOL2=false]");
    exit(-1);
}

function argsToSymbolsObject(arr) {
    return arr.reduce(function (acc, value) {
        keyValue = value.split("=");
        acc[keyValue[0]] = keyValue[1];
        return acc;
    }, {});
}

const manifestPath = process.argv[2];
const newSymbols = argsToSymbolsObject(process.argv.slice(3));

let currentSymbols = {}

const appManifestLines = fs.readFileSync(manifestPath, { encoding: 'utf8', flag: 'r' }).split('\n');
const bsConstIndex = appManifestLines.findIndex(line => line.startsWith("bs_const="));
if (bsConstIndex !== -1) {
    let bsConst = appManifestLines[bsConstIndex];
    bsConst = bsConst.substring("bs_const=".length);
    currentSymbols = argsToSymbolsObject(bsConst.split(";"))
}

mergedSymbols = { ...currentSymbols, ...newSymbols };

bsConst = "bs_const=" + Object.keys(mergedSymbols).map(key => `${key}=${mergedSymbols[key]}`).join(";");

appManifestLines[bsConstIndex] = bsConst;

fs.writeFileSync(manifestPath, appManifestLines.join("\n"));