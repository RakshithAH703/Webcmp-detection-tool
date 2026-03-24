import fs from 'fs';
import path from 'path';

const commit = '6532cace7f74572c1105e96c8bef688079cb4c44';
const repo = 'RakshithAH703/Webcmp-detection-tool';
const baseUrl = `https://raw.githubusercontent.com/${repo}/${commit}`;

const files = [
  'package.json',
  'src/App.tsx',
  'src/components/UrlAnalyzer.tsx',
  'api/detect-webmcp.ts',
  'vite.config.ts',
  'src/index.css',
  'src/main.tsx',
  'tsconfig.json',
  'index.html',
  '.env.example'
];

async function download() {
  for (const file of files) {
    const url = `${baseUrl}/${file}`;
    console.log(`Fetching ${url}`);
    const res = await fetch(url);
    const text = await res.text();
    const filePath = path.join(process.cwd(), file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, text);
    console.log(`Wrote ${file}`);
  }
}

download().catch(console.error);
