const fs = require('fs');
const path = require('path');
const root = path.join('c:','Users','code','Desktop','AAM P.A','Asshrabha');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(ent => {
  const p = path.join(dir, ent.name);
  return ent.isDirectory() ? walk(p) : p;
});
const files = walk(path.join(root, 'src', 'components')).filter(f => f.endsWith('.tsx'));
const changed = [];
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('import React') && !text.includes('React.use')) continue;
  const original = text;
  text = text.replace(/^import React, \{([^}]+)\} from ["']react["'];?\r?$/mg, 'import {$1} from \'react\';');
  text = text.replace(/^import React from ["']react["'];?\r?$/mg, '');
  text = text.replace(/React\.useState/g, 'useState');
  text = text.replace(/React\.useEffect/g, 'useEffect');
  text = text.replace(/React\.useRef/g, 'useRef');
  text = text.replace(/React\.useCallback/g, 'useCallback');
  if (text !== original) {
    text = text.replace(/\n{3,}/g, '\n\n');
    fs.writeFileSync(file, text, 'utf8');
    changed.push(path.relative(root, file));
  }
}
console.log('changed', changed.length);
for (const f of changed) console.log(f);
