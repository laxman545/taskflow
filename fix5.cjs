const fs = require('fs');
let s = fs.readFileSync('src/utils/storage.ts', 'utf8');

const target1 = /await fetch\(\\http:\/\/localhost:5000\/api\/jobs\/public\/\\\/cancel\\, {/g;
s = s.replace(target1, 'await fetch(`http://localhost:5000/api/jobs/public/${id}/cancel`, {');

const target2 = /await fetch\(\\http:\/\/localhost:5000\/api\/jobs\/public\/\\\/files\\, {/g;
s = s.replace(target2, 'await fetch(`http://localhost:5000/api/jobs/public/${id}/files`, {');

fs.writeFileSync('src/utils/storage.ts', s);
console.log('Fixed storage.ts');
