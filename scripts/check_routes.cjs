const fs = require('fs');
const path = require('path');

const routeFiles = [
  'backend/src/routes/api.routes.ts',
  'backend/src/routes/enterprise.routes.ts',
  'backend/src/routes/varejoAvancado.routes.ts',
  'backend/src/routes/campanha.routes.ts',
  'backend/src/routes/usuario.routes.ts'
];

const routes = [];
routeFiles.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const regex = /router\.(get|post|put|delete|patch)\((['"`])([^'"`]+)\2/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      routes.push({ method: match[1].toUpperCase(), path: match[3], file: f });
    }
  }
});

console.log('Total de rotas no backend:', routes.length);

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

const frontFiles = getAllFiles('frontend/src', ['.ts', '.tsx']);
const frontContent = frontFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const desconectadas = [];
routes.forEach(r => {
  const cleanPath = r.path.split('/:')[0];
  if (!frontContent.includes(cleanPath)) {
    desconectadas.push(r);
  }
});

console.log('Rotas backend sem referência no frontend (' + desconectadas.length + '):');
desconectadas.forEach(d => console.log('  [' + d.method + '] ' + d.path + ' (' + d.file + ')'));
