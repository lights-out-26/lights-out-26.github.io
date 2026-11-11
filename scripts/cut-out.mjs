// usage: node rmbg-all.mjs <rawDir> <maskDir> key1 key2 ...
import { segmentForeground } from '@imgly/background-removal-node';
import fs from 'node:fs';
const [,, rawDir, maskDir, ...keys] = process.argv;
for (const k of keys) {
  const out = `${maskDir}/${k}.png`;
  if (fs.existsSync(out)) continue;
  const t = Date.now();
  const blob = new Blob([fs.readFileSync(`${rawDir}/${k}.jpg`)], { type: 'image/jpeg' });
  const res = await segmentForeground(blob, { model: 'medium', output: { format: 'image/png', quality: 1 } });
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log(k, ((Date.now() - t) / 1000).toFixed(1) + 's');
}
