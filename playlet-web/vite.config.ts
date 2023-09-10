import { defineConfig, UserConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tsconfigPaths from 'vite-tsconfig-paths'
import ip from 'ip';
import { existsSync, readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { parse as dotEnvParse } from 'dotenv'

const PORT = 5173

const config: UserConfig = {
  plugins: [tsconfigPaths(), svelte()],
  build: {
    outDir: "../playlet-lib/src/www",
    emptyOutDir: true
  }
}

// TODO:P2 refactor this with the same code in tools/get-env-vars.js
// The issue here is that the playlet-web is an ES module (as it should be)
// But the tools are not (because brighterscript is expecting CommonJs)
// so we can't import the function from the tools/get-env-vars.js.
function getEnvVars(requiredVars = undefined) {
  const envFile = joinPath(__dirname, '../.env');

  let envVars = process.env;
  if (existsSync(envFile)) {
    const envConfig = dotEnvParse(readFileSync(envFile));
    envVars = { ...envVars, ...envConfig };
  }
  if (requiredVars) {
    const missingVars = requiredVars.filter((key) => !envVars[key]);
    if (missingVars.length) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
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
