import { writable } from 'svelte/store';
import type { AppState, PlayletState } from './Types';

export const playletStateStore = writable({} as PlayletState);

export const appStateStore = writable({
    screen: 'home',
} as AppState);

export const appThemeStore = writable("dark" as "dark" | "light");

export const preferencesModelStore = writable([] as any);

export const userPreferencesStore = writable({} as any);
