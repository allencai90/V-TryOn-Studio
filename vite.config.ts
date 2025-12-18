
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  // 关键：将环境变量注入到前端代码中
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
