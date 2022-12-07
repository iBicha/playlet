import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "../src/www",
    emptyOutDir: true
  }
})
