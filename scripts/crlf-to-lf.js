/* Normalizes CRLF line endings to LF so str_replace matching works cleanly. */
const fs = require('fs');

const files = process.argv.slice(2);
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('\r')) {
    fs.writeFileSync(file, text.replace(/\r\n/g, '\n'));
    console.log('converted to LF:', file);
  } else {
    console.log('already LF:', file);
  }
}
