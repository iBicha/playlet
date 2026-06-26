import { PoTokenMinter } from "lib/Api/PoTokenMinter";
import { addToast } from "lib/Toast";

// Mints for the current identity if needed, surfacing the outcome as a toast.
export async function ensureDevicePoTokenWithToast(force = false) {
    const result = await PoTokenMinter.ensureDevicePoToken(force);
    switch (result.status) {
        case "minted":
            addToast("PoToken minted on device", "success");
            break;
        case "current":
            addToast("PoToken already up to date on device", "info");
            break;
        case "no-session":
            addToast("No identity available to mint a PoToken yet", "warning");
            break;
        case "failed":
            addToast(`PoToken minting failed: ${result.error}`, "error");
            break;
    }
    return result;
}
