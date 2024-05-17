import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const ts = execSync(`git log -1 --format="%at" "${dir}" "${dir}/../tables/*.csv"`);
const date = new Date(ts.toString() * 1000);
const version = date.toISOString().replace('T', '.').replace(/:/g, '-').slice(0, -5);
console.log(`Version generated: ${version}`);

writeFileSync(`${dir}/.env.local`, `REACT_APP_VERSION=${version}`);
