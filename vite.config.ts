// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Set the base path to your repository name
  // Example: If your repo URL is github.com/abhiraj/PathFinder,
  // the base should be '/PathFinder/'
  base: '/your-repo-name/', // <-- IMPORTANT: Replace with your repo name!
  build: {
    outDir: 'dist', // Ensure output is to the dist folder
  },
});