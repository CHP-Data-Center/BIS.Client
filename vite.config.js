import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Tự động nhận diện tên repository khi build trên GitHub Pages Actions
const base = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/';

// Plugin tự động tạo 404.html từ index.html để hỗ trợ SPA Routing (tránh lỗi 404 khi F5)
const copy404Plugin = () => ({
  name: 'copy-404',
  closeBundle() {
    try {
      const distPath = path.resolve(__dirname, 'dist');
      const indexPath = path.join(distPath, 'index.html');
      const fourOhFourPath = path.join(distPath, '404.html');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fourOhFourPath);
        console.log(' Successfully generated 404.html for SPA routing fallback.');
      }
    } catch (e) {
      console.error(' Failed to copy 404.html:', e);
    }
  }
});

export default defineConfig({
  plugins: [react(), copy404Plugin()],
  base: base,
  server: {
    port: 3000,
    open: true
  }
})


