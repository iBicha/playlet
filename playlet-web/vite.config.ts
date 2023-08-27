import { defineConfig, UserConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import ip from 'ip';
import { existsSync, readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { parse as dotEnvParse } from 'dotenv'

const PORT = 5173

const config: UserConfig = {
  plugins: [svelte()],
  build: {
    outDir: "../playlet-lib/src/www",
    emptyOutDir: true
  }
}

// TODO:P2 refactor this with the same code in tools/get-env-vars.js
function getEnvVars() {
  const envFile = joinPath(__dirname, '../.env');

  let envVars = process.env;
  if (existsSync(envFile)) {
    const envConfig = dotEnvParse(readFileSync(envFile));
    envVars = { ...envVars, ...envConfig };
  }

  return envVars;
}

const envVars = getEnvVars();

if (envVars.ROKU_DEV_TARGET) {
  config.server = {
    host: true,
    port: PORT,
    open: `http://${ip.address()}:${PORT}/?host=${envVars.ROKU_DEV_TARGET}:8888`
  }
}

// https://vitejs.dev/config/
export default defineConfig(config)
