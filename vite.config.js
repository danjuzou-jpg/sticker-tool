import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
  build: {
    // 排除 WASM 相关的大文件，让 @imgly CDN 提供这些文件
    rollupOptions: {
      external: [],
    },
    // 提高 chunk 警告阈值（onnxruntime 文件确实很大，这是正常的）
    chunkSizeWarningLimit: 1000,
  },
  server: {
    headers: {
      // WASM SharedArrayBuffer 需要这些跨域隔离头（开发模式）
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})

