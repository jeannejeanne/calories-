// Génère les icônes PWA (192, 512, apple-touch) à partir d'un SVG
import sharp from "sharp";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF0A54"/><stop offset="0.55" stop-color="#FF4600"/><stop offset="1" stop-color="#00BFFF"/></linearGradient></defs>
<rect width="512" height="512" fill="url(#g)"/>
<path d="M256 400 C120 300 110 210 170 170 C210 145 245 165 256 195 C267 165 302 145 342 170 C402 210 392 300 256 400Z" fill="#FFF8F5"/>
<path d="M390 90 l10 28 28 10 -28 10 -10 28 -10 -28 -28 -10 28 -10z" fill="#FAEE05"/></svg>`;
for (const [n, s] of [["icon-192.png",192],["icon-512.png",512],["apple-touch-icon.png",180]])
  await sharp(Buffer.from(svg)).resize(s,s).png().toFile(`public/icons/${n}`);
