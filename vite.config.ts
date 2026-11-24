// created: 2026-11-23T12:04:00-08:00
// updated: 2026-11-23T19:02:00-08:00 — GitHub Pages base path (school allows *.github.io)
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // updated: 2026-11-23T19:14:00-08:00 — VITE_BASE from CI (repo name path)
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    // updated: 2026-11-23T12:09:00-08:00
    // allow alias webname and sslip.io helper names from phones
    allowedHosts: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
  },
})
