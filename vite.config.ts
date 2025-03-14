// import { defineConfig } from 'vite';
// import tailwindcss from '@tailwindcss/vite'
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   root: './',
//   build: {
//     outDir: 'dist'
//   },
//   resolve: {
//     extensions: ['.ts', '.tsx', '.js', '.jsx']
//   },
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
//   server: {
//     port: 3000
//   },
//   test: {
//     globals: true,
//     environment: 'node',
//     coverage: {
//       reporter: 'text'
//     }
//   }
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import tailwindcss from 'tailwindcss';
import tailwindcss from '@tailwindcss/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // css: {
  //   postcss: {
  //     plugins: [tailwindcss()],
  //   },
  // },

  // export default defineConfig({
  //   plugins: [react(), tailwindcss()],
  build: {
    // emptyOutDir: false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        //popup: 'public/index.html',    // Popup entry point (if used)
        content: 'src/content.tsx'       // Content script entry point
      },
      output: {
        entryFileNames: '[name].js',      // Output file names (popup.js and content.js)
        inlineDynamicImports: true,
      }
    }
  }
});
