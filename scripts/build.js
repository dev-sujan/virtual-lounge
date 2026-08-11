import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

async function buildApp() {
  console.log('⚡ Building SyncLounge static application bundle...');

  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });

  // 1. Build Tailwind CSS
  try {
    console.log('🎨 Compiling Tailwind CSS...');
    execSync('npx @tailwindcss/cli -i src/index.css -o dist/assets/index.css --minify', { stdio: 'inherit' });
  } catch (err) {
    console.warn('Tailwind CLI fallback, building standard CSS...');
    fs.copyFileSync('src/index.css', 'dist/assets/index.css');
  }

  // 2. Build JavaScript Bundle
  await esbuild.build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    minify: true,
    sourcemap: true,
    outfile: 'dist/assets/index.js',
    loader: {
      '.png': 'file',
      '.svg': 'file',
      '.jpg': 'file',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  // 3. Process index.html
  let html = fs.readFileSync('index.html', 'utf-8');
  html = html.replace('/src/main.tsx', './assets/index.js');
  if (!html.includes('index.css')) {
    html = html.replace('</head>', '  <link rel="stylesheet" href="./assets/index.css">\n</head>');
  }
  fs.writeFileSync('dist/index.html', html);

  // 4. Copy public assets
  if (fs.existsSync('public')) {
    fs.cpSync('public', 'dist', { recursive: true });
  }

  console.log('🎉 Static build completed cleanly! Package in dist/ ready for GitHub Pages.');
}

buildApp().catch((err) => {
  console.error('Build error:', err);
  process.exit(1);
});
