import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const ts = execSync(`git log -1 --format="%at" "${dir}" "${dir}/../tables/*.csv"`);
const date = new Date(ts.toString() * 1000);
const version = date.toISOString().replace('T', '.').replace(/:/g, '-').slice(0, -5);
console.log(`Version generated: ${version}`);

const publicFiles = fs.readdirSync(`${dir}/public`).filter(f => f != 'index.html').join(',');
const publicRev = execSync(`git log -1 --format="%H" "${dir}/public"`);

fs.writeFileSync(`${dir}/.env.local`, `
REACT_APP_VERSION=${version}
REACT_APP_PUBLIC_FILES=${publicFiles}
REACT_APP_PUBLIC_REV=${publicRev}
`);
