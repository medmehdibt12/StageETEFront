// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig({
  // serve at root on your server (http://91.134.242.89/)
  base: '/',

  define: { global: 'window' },

  // dev-only options are harmless but optional
  server: {
    open: true,
    port: 3000
  },

  css: {
    preprocessorOptions: {
      scss: { charset: false },
      less: { charset: false }
    },
    charset: false,
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') atRule.remove();
            }
          }
        }
      ]
    }
  },

  plugins: [react(), jsconfigPaths()]
});
