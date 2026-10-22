const fs = require('fs');
let s = fs.readFileSync('src/utils/storage.ts', 'utf8');

const target1 = `export const cancelJob = async (id: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    await fetch(\\http://localhost:5000/api/jobs/public/\\/cancel\\, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {}
};`;

const new1 = `export const cancelJob = async (id: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    await fetch(\`http://localhost:5000/api/jobs/public/\${id}/cancel\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {}
};`;

const target2 = `export const replaceJobFiles = async (id: string, files: any[]) => {
  try {
    await fetch(\\http://localhost:5000/api/jobs/public/\\/files\\, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
  } catch (err) {}
};`;

const new2 = `export const replaceJobFiles = async (id: string, files: any[]) => {
  try {
    await fetch(\`http://localhost:5000/api/jobs/public/\${id}/files\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files })
    });
  } catch (err) {}
};`;

s = s.replace(target1, new1);
s = s.replace(target2, new2);

fs.writeFileSync('src/utils/storage.ts', s);
console.log('Fixed syntax errors');
