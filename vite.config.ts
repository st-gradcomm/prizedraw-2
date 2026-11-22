import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [react()],
  base: '/prizedraw-2/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
