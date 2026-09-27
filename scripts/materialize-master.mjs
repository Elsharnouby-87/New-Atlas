import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const filename = 'Fired_Heater_Atlas_Web_V13_6.glb';
const target = `public/models/v13.6/${filename}`;
const expected = '1a03338a51f4c9d7924388c0e6b12961e3639af6411879189852ca63b8a9b394';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (fs.existsSync(target)) {
  if (hash(fs.readFileSync(target)) !== expected) throw new Error('V13.6 master differs from the supplied original. Refusing to overwrite it.');
} else {
  const original = gunzipSync(fs.readFileSync(`source-assets/v13.6/${filename}.gz`));
  if (hash(original) !== expected) throw new Error('V13.6 source archive checksum mismatch.');
  fs.mkdirSync('public/models/v13.6', { recursive: true });
  fs.writeFileSync(target, original);
}
console.log('[source] Original V13.6 GLB verified (29,100,864 bytes; no geometry changes).');
