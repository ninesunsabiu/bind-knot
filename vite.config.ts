import path from "node:path";
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    solidPlugin(),
    monkey({
      entry: 'src/monkey-client/index.tsx',
      userscript: {
        name: "知微助手",
        namespace: 'http://tkb.agilean.cn:9000/',
        match: ['https://tkb.agilean.cn/*'],
        version: "1.0.0",
        description: "知微实验性外挂",
        downloadURL: "https://update.greasyfork.org/scripts/407797/%E7%9F%A5%E5%BE%AE%E6%97%A5%E6%8A%A5%E5%A1%AB%E5%86%99.user.js",
        updateURL: "https://update.greasyfork.org/scripts/407797/%E7%9F%A5%E5%BE%AE%E6%97%A5%E6%8A%A5%E5%A1%AB%E5%86%99.meta.js"
      },
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "./src/monkey-client"),
    }
  }
});
