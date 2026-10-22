const fs = require('fs');
let s = fs.readFileSync('src/utils/storage.ts', 'utf8');

const lines = s.split('\n');

// Find the line index where the SECOND 'import { v4 as uuidv4 }' appears, or just drop the first 58 lines (0 to 57).
// Let's drop lines 0 to 57 since we know it.
const fixedLines = lines.slice(58);

let newS = fixedLines.join('\n');

// Now replace addJob properly
const targetAddJob = `export const addJob = (job: Omit<Job, 'id' | 'job_number' | 'created_at' | 'updated_at' | 'status' | 'page_count' | 'total_prints' | 'order_amount'>) => {
  const jobs = getJobs();
  const newJob: Job = {
    ...job,
    id: uuidv4(),
    job_number: 'JOB-' + Math.floor(Math.random() * 10000),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'new',
    page_count: 0,
    total_prints: 0,
    order_amount: 0
  };
  jobs.push(newJob);
  setJobs(jobs);
  
  if (job.files && job.files.length > 0) {
    const jobFiles = getJobFiles();
    job.files.forEach(file => {
      jobFiles.push({
        ...file,
        id: uuidv4(),
        job_id: newJob.id,
        page_count: file.page_count || 0
      });
    });
    setJobFiles(jobFiles);
  }
  
  return newJob;
};`;

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
};`;

newS = newS.replace(targetAddJob, newAddJob);

fs.writeFileSync('src/utils/storage.ts', newS);
console.log('Fixed storage.ts duplicate issue');
