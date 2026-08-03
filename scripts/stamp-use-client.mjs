import fs from 'fs';

for (const file of ['dist/index.js', 'dist/index.cjs']) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.startsWith('"use client"')) {
    fs.writeFileSync(file, `"use client";\n${content}`);
  }
}
