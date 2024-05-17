import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function prepare(sourceFile, targetFile, filter = null) {
    const sourcePath = path.join(sourceDir, sourceFile);
    const originalData = fs.readFileSync(sourcePath, 'utf8').trim();
    const preparedData = [filter ? filter(originalData) : originalData];
    const preparedJson = JSON.stringify(preparedData);
    const targetPath = path.join(targetDir, targetFile);
    fs.writeFileSync(targetPath, preparedJson);
}

const sourceDir = [...fileURLToPath(import.meta.url).split(path.sep).slice(0, -4), 'tables'].join(path.sep);
const targetDir = path.dirname(fileURLToPath(import.meta.url));

prepare('rbm_part_relationships.csv', 'rels.json');
prepare('part_relationships_ex.csv', 'relsEx.json',
    data => data.split('\n').filter(l => l.trim().length > 0 && '#' != l[0]).join('\n'));
