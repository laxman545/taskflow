const fs = require('fs');
let lines = fs.readFileSync('src/utils/storage.ts', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  lines[i] = lines[i].replace(/ pc /g, ' "" ');
  lines[i] = lines[i].replace(/pc\]/g, '""]');
  lines[i] = lines[i].replace(/\[pc/g, '[""');
  lines[i] = lines[i].replace(/\(pc\)/g, '("")');
  lines[i] = lines[i].replace(/\(pc,/g, '("",');
  lines[i] = lines[i].replace(/,pc,/g, ',"",');
  lines[i] = lines[i].replace(/, pc,/g, ', "",');
  lines[i] = lines[i].replace(/:pc/g, ':""');
  lines[i] = lines[i].replace(/: pc/g, ': ""');
  lines[i] = lines[i].replace(/= pc/g, '= ""');
  lines[i] = lines[i].replace(/=pc/g, '=""');
  lines[i] = lines[i].replace(/pc;/g, '"";');
  lines[i] = lines[i].replace(/ pc;/g, ' "";');
  lines[i] = lines[i].replace(/, pc/g, ', ""');
  lines[i] = lines[i].replace(/\+ pc \+/g, '+ "" +');
  lines[i] = lines[i].replace(/=== pc/g, '=== ""');
  lines[i] = lines[i].replace(/!== pc/g, '!== ""');
}
fs.writeFileSync('src/utils/storage.ts', lines.join('\n'));
