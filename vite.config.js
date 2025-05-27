import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative paths for GitHub Pages compatibility
  base: process.env.NODE_ENV === 'production' 
    ? '/p2p-coin-flip/' 
    : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure proper asset handling
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  // Ensure proper MIME types
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
