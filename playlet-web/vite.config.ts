import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'fs'
import { parse as dotEnvParse } from 'dotenv'
import { internalIpV4Sync } from 'internal-ip';

const envVars = dotEnvParse(readFileSync('../.vscode/.env'))

const PORT = 5173

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: "../playlet-lib/src/www",
    emptyOutDir: true
  },
  server: {
    host: true,
    port: PORT,
    open: `http://${internalIpV4Sync()}:${PORT}/?host=${envVars.ROKU_DEV_TARGET}:8888`
  }
})
