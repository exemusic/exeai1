import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'resolve-extensionless-code-editor',
        resolveId(source, importer) {
          if (source.includes('CodeEditorMode') && !source.endsWith('.tsx')) {
            if (importer) {
              const resolved = path.resolve(path.dirname(importer), source);
              return resolved.endsWith('.tsx') ? resolved : resolved + '.tsx';
            }
          }
          return null;
        },
        load(id) {
          if (id.includes('CodeEditorMode.tsx')) {
            if (fs.existsSync(id)) {
              return fs.readFileSync(id, 'utf-8');
            }
            const extensionlessPath = id.slice(0, -4);
            if (fs.existsSync(extensionlessPath)) {
              return fs.readFileSync(extensionlessPath, 'utf-8');
            }
          }
          return null;
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
