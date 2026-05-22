export function triggerDownload(filename: string, content: string | Uint8Array, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    let url: string | undefined;
    const a = document.createElement("a");
    try {
        url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
    } finally {
        a.remove();
        if (url) {
            URL.revokeObjectURL(url);
        }
    }
}
