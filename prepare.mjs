// Run once: node prepare.mjs
// Makes package.json ready for deployment (build tools in dependencies, start scripts).
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.dependencies = pkg.dependencies || {};

// the host builds the React app, so vite must be installed in production too
for (const name of ['vite', '@vitejs/plugin-react']) {
  if (pkg.devDependencies && pkg.devDependencies[name]) {
    pkg.dependencies[name] = pkg.devDependencies[name];
    delete pkg.devDependencies[name];
  }
}

pkg.scripts = {
  ...pkg.scripts,
  dev: 'vite',
  build: 'vite build',
  start: 'node server/server.js',
  server: 'node --watch server/server.js',
};
pkg.engines = { node: '>=20' };

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');
