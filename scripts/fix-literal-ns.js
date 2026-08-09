/* Fixes literal `\n` text artifacts in keys/generate/page.tsx introduced by a
 * broken find/replace. Line 389 (`generatedKeys.join('\n')`) is a legit JS
 * string escape and is intentionally left untouched. */
const fs = require('fs');

const file = 'app/(panel)/keys/generate/page.tsx';
const text = fs.readFileSync(file, 'utf8');
const lines = text.split('\n');

const out = lines.map((line, i) => {
  // 0-indexed 388 === 1-indexed line 389 (the legit join('\n'))
  if (i === 388) return line;
  return line.replace(/\\n/g, '\n');
});

fs.writeFileSync(file, out.join('\n'));
console.log('replaced literal \\n artifacts; remaining count:',
  out.filter(l => l.includes('\\n')).length);
