import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tự động nhận diện tên repository khi build trên GitHub Pages Actions
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

export default defineConfig({
  plugins: [react()],
  base: base,
  server: {
    port: 3000,
    open: true
  }
})

