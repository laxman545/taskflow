const fs = require('fs');
let c = fs.readFileSync('server/src/index.ts', 'utf8');

// Update GET /api/jobs
const targetGet = `
  if (role === 'admin') {
    jobs = db.prepare('SELECT * FROM jobs').all();
  } else if (role === 'owner' || role === 'manager') {
    jobs = db.prepare('SELECT * FROM jobs WHERE shop_id = ?').all(shopId);
  } else {
    // staff can only view their own printing details
    jobs = db.prepare('SELECT * FROM jobs WHERE shop_id = ? AND staff_id = ?').all(shopId, userId);
  }
  
  res.json({ success: true, jobs });
});`;

const newGet = `
  if (role === 'admin') {
    jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  } else if (role === 'owner' || role === 'manager') {
    jobs = db.prepare('SELECT * FROM jobs WHERE shop_id = ? ORDER BY created_at DESC').all(shopId);
  } else {
    jobs = db.prepare('SELECT * FROM jobs WHERE shop_id = ? AND staff_id = ? ORDER BY created_at DESC').all(shopId, userId);
  }
  
  for (const job of jobs) {
    job.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(job.id);
  }
  
  res.json({ success: true, jobs });
});`;
c = c.replace(targetGet, newGet);

// Update POST /api/jobs/public
const targetPostPub = `app.post('/api/jobs/public', (req: any, res) => {
  const { shop_id, customer_name, status } = req.body;
  const jobId = 'job_' + Date.now();
  const jobNumber = 'JOB-' + Math.floor(Math.random() * 10000);
  
  try {
    const stmt = db.prepare("INSERT INTO jobs (id, shop_id, job_number, customer_name, status) VALUES (?, ?, ?, ?, ?)");
    stmt.run(jobId, shop_id, jobNumber, customer_name || 'Walk-in', status || 'new');
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    res.json({ success: true, job: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});`;

const newPostPub = `app.post('/api/jobs/public', (req: any, res) => {
  const { shop_id, customer_name, status, page_count, total_prints, order_amount, files } = req.body;
  const jobId = 'job_' + Date.now();
  const jobNumber = 'JOB-' + Math.floor(Math.random() * 10000);
  
  try {
    const stmt = db.prepare("INSERT INTO jobs (id, shop_id, job_number, customer_name, status, page_count, total_prints, order_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run(jobId, shop_id, jobNumber, customer_name || 'Walk-in', status || 'new', page_count || 0, total_prints || 0, order_amount || 0);
    
    if (files && files.length > 0) {
      const fileStmt = db.prepare("INSERT INTO job_files (id, job_id, file_name, file_path, file_size, file_type, data_url, page_count, print_color, paper_size, copies, sides) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      const insertFiles = db.transaction((filesArr) => {
        for (const file of filesArr) {
          const fileId = 'jf_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          fileStmt.run(fileId, jobId, file.file_name, file.file_path, file.file_size, file.file_type, file.data_url, file.page_count, file.print_color, file.paper_size, file.copies, file.sides);
        }
      });
      insertFiles(files);
    }
    
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    newJob.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(jobId);
    res.json({ success: true, job: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});`;
c = c.replace(targetPostPub, newPostPub);

// Update POST /api/jobs
const targetPostPriv = `app.post('/api/jobs', authenticateToken, (req: any, res) => {
  const { customer_name, status } = req.body;
  const { id: userId, shop_id: shopId } = req.user;
  const jobId = 'job_' + Date.now();
  const jobNumber = 'JOB-' + Math.floor(Math.random() * 10000);
  
  try {
    const stmt = db.prepare(\`
      INSERT INTO jobs (id, shop_id, staff_id, job_number, customer_name, status)
      VALUES (?, ?, ?, ?, ?, ?)
    \`);
    stmt.run(jobId, shopId, userId, jobNumber, customer_name || 'Walk-in', status || 'new');
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    res.json({ success: true, job: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});`;

const newPostPriv = `app.post('/api/jobs', authenticateToken, (req: any, res) => {
  const { customer_name, status, page_count, total_prints, order_amount, files } = req.body;
  const { id: userId, shop_id: shopId } = req.user;
  const jobId = 'job_' + Date.now();
  const jobNumber = 'JOB-' + Math.floor(Math.random() * 10000);
  
  try {
    const stmt = db.prepare(\`
      INSERT INTO jobs (id, shop_id, staff_id, job_number, customer_name, status, page_count, total_prints, order_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`);
    stmt.run(jobId, shopId, userId, jobNumber, customer_name || 'Walk-in', status || 'new', page_count || 0, total_prints || 0, order_amount || 0);
    
    if (files && files.length > 0) {
      const fileStmt = db.prepare("INSERT INTO job_files (id, job_id, file_name, file_path, file_size, file_type, data_url, page_count, print_color, paper_size, copies, sides) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      const insertFiles = db.transaction((filesArr) => {
        for (const file of filesArr) {
          const fileId = 'jf_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          fileStmt.run(fileId, jobId, file.file_name, file.file_path, file.file_size, file.file_type, file.data_url, file.page_count, file.print_color, file.paper_size, file.copies, file.sides);
        }
      });
      insertFiles(files);
    }
    
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    newJob.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(jobId);
    res.json({ success: true, job: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});`;
c = c.replace(targetPostPriv, newPostPriv);

fs.writeFileSync('server/src/index.ts', c);
console.log('Done replacing jobs API');
