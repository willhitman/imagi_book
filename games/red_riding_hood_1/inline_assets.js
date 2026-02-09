import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

console.log(`Processing ${indexPath}...`);

if (!fs.existsSync(indexPath)) {
    console.error("index.html not found!");
    process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

// Inline CSS
// Match <link rel="stylesheet" crossorigin href="./assets/index-ByY9nx2k.css">
// Note: Vite uses ./assets/ prefix with base: './'
const cssRegex = /<link rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+)"[^>]*>/;
const cssMatch = html.match(cssRegex);
if (cssMatch) {
    const cssRelPath = cssMatch[1];
    const cssPath = path.join(distDir, cssRelPath);
    console.log(`Found CSS: ${cssRelPath} -> ${cssPath}`);
    if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, 'utf-8');
        html = html.replace(cssMatch[0], `<style>${cssContent}</style>`);
        console.log(`Inlined CSS.`);
    } else {
        console.error(`CSS file not found: ${cssPath}`);
    }
} else {
    console.log("No CSS link found.");
}

// Inline JS
// Match <script type="module" crossorigin src="./assets/index-DEoSnF4T.js"></script>
const jsRegex = /<script type="module"[^>]*src="(\.\/assets\/[^"]+)"[^>]*><\/script>/;
const jsMatch = html.match(jsRegex);
if (jsMatch) {
    const jsRelPath = jsMatch[1];
    const jsPath = path.join(distDir, jsRelPath);
    console.log(`Found JS: ${jsRelPath} -> ${jsPath}`);
    if (fs.existsSync(jsPath)) {
        const jsContent = fs.readFileSync(jsPath, 'utf-8');
        // Keeping type="module"
        html = html.replace(jsMatch[0], `<script type="module">${jsContent}</script>`);
        console.log(`Inlined JS.`);
    } else {
        console.error(`JS file not found: ${jsPath}`);
    }
} else {
    console.log("No JS script found.");
}

fs.writeFileSync(indexPath, html);
console.log('Inline complete.');
