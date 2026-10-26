import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three-vendor',
              test: /node_modules[\\/]three[\\/]/,
              priority: 20,
              maxSize: 380 * 1024,
            },
            {
              name: 'react-three-vendor',
              test: /node_modules[\\/]@react-three[\\/]fiber[\\/]/,
              priority: 10,
              maxSize: 240 * 1024,
            },
          ],
        },
      },
    },
  },
})
