const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts) {
  let res = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') res.push(...getAllFiles(full, exts));
    } else if (exts.some(e => f.endsWith(e))) {
      res.push(full);
    }
  });
  return res;
}

const componentFiles = getAllFiles('frontend/src/components', ['.tsx', '.ts']);
const allSrcFiles = getAllFiles('frontend/src', ['.tsx', '.ts']);

const unused = [];

componentFiles.forEach(comp => {
  const baseName = path.basename(comp).replace(/\.(tsx|ts)$/, '');
  let count = 0;
  allSrcFiles.forEach(src => {
    if (src === comp) return;
    const content = fs.readFileSync(src, 'utf8');
    if (content.includes(baseName)) {
      count++;
    }
  });
  if (count === 0) {
    unused.push(comp);
  }
});

console.log('Componentes sem import/referencia (' + unused.length + '):');
unused.forEach(u => console.log('  ' + u));
