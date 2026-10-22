const fs = require('fs');
let s = fs.readFileSync('src/utils/storage.ts', 'utf8');

const targetStart = "export const addJob = (job: Omit<Job, 'id' | 'job_number' | 'created_at' | 'updated_at' | 'status' | 'page_count' | 'total_prints' | 'order_amount'>) => {";
const targetEnd = "export const updateJobStatus = (id: string, status: JobStatus) => {";

const match = s.indexOf(targetStart);
const endMatch = s.indexOf(targetEnd);

const newAddJob = `export const addJob = async (job: Omit<Job, 'id' | 'job_number' | 'created_at' | 'updated_at' | 'status' | 'page_count' | 'total_prints' | 'order_amount'>) => {
  const token = localStorage.getItem('auth_token');
  const endpoint = token ? 'http://localhost:5000/api/jobs' : 'http://localhost:5000/api/jobs/public';
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = \`Bearer \${token}\`;
  
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(job)
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.job;
};

`;

s = s.substring(0, match) + newAddJob + s.substring(endMatch);
fs.writeFileSync('src/utils/storage.ts', s);
console.log('Fixed addJob');
