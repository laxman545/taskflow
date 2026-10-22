const fs = require('fs');
let c = fs.readFileSync('src/utils/storage.ts', 'utf8');

const targetStart = 'export const createTransfer = async (transferData: any) => {';
const targetEnd = 'export const resetSampleData = () => [];';

const s = c.indexOf(targetStart);
const e = c.indexOf(targetEnd);

const replacement = `export const createTransfer = async (transferData: any) => {
  const token = localStorage.getItem('auth_token');
  const res = await fetch('http://localhost:5000/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
    body: JSON.stringify(transferData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.transfer;
};
export const getTransfers = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return [];
  const res = await fetch('http://localhost:5000/api/transfers', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
  const data = await res.json();
  return data.success ? data.transfers : [];
};
export const deleteTransfer = async (id: string) => {
  const token = localStorage.getItem('auth_token');
  await fetch(\`http://localhost:5000/api/transfers/\${id}\`, {
    method: 'DELETE',
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
};
export const updateTransferPin = async (id: string, pin: string) => {
  const token = localStorage.getItem('auth_token');
  await fetch(\`http://localhost:5000/api/transfers/\${id}/pin\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
    body: JSON.stringify({ pin })
  });
};
`;

c = c.substring(0, s) + replacement + c.substring(e);
fs.writeFileSync('src/utils/storage.ts', c);
console.log('Fixed storage.ts');
