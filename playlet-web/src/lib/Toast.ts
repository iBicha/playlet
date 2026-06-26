import { writable } from "svelte/store";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: number;
    type: ToastType;
    message: string;
}

export const toastStore = writable<Toast[]>([]);

let nextId = 0;

export function addToast(message: string, type: ToastType = "info", durationMs = 5000) {
    const id = nextId++;
    toastStore.update((toasts) => [...toasts, { id, type, message }]);
    if (durationMs > 0) {
        setTimeout(() => removeToast(id), durationMs);
    }
}

export function removeToast(id: number) {
    toastStore.update((toasts) => toasts.filter((toast) => toast.id !== id));
}
