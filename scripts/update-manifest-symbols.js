const fs = require('fs');

if (process.argv.length < 3) {
    console.error("Invalid usage! usage: npm run manifest-symbols -- SYMBOL1=true [SYMBOL2=false]");
    exit(-1);
}

function argsToSymbolsObject(arr) {
    return arr.reduce(function (acc, value) {
        keyValue = value.split("=");
        acc[keyValue[0]] = keyValue[1];
        return acc;
    }, {});
}

const newSymbols = argsToSymbolsObject(process.argv.slice(2));

["playlet/src/manifest", "playlet-lib/src/manifest"].forEach(function (manifestPath) {
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
})
