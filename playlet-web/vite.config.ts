import { defineConfig, UserConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync, existsSync } from 'fs'
import { parse as dotEnvParse } from 'dotenv'
import ip from 'ip';

const PORT = 5173

const config: UserConfig = {
  plugins: [svelte()],
  build: {
    outDir: "../playlet-lib/src/www",
    emptyOutDir: true
  }
}

if (existsSync('../.vscode/.env')) {
  const envVars = dotEnvParse(readFileSync('../.vscode/.env'))
  config.server = {
    host: true,
    port: PORT,
    open: `http://${ip.address()}:${PORT}/?host=${envVars.ROKU_DEV_TARGET}:8888`
  }
}

// https://vitejs.dev/config/
export default defineConfig(config)
