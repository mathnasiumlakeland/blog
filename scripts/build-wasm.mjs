import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import wabtFactory from 'wabt';

const input = resolve('src/lib/wasm/polynomial.wat');
const output = resolve('static/wasm/polynomial.wasm');

const wabt = await wabtFactory();
const watSource = await readFile(input, 'utf8');
const parsed = wabt.parseWat(input, watSource);
const binary = parsed.toBinary({ log: false, write_debug_names: false });

await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.from(binary.buffer));

parsed.destroy();
console.log(`WASM built: ${output}`);
