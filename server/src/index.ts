import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setupDatabase } from './db/schema';
import db from './db/db';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize SQLite Schema
setupDatabase();

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const identifier = req.body.identifier || req.body.username || req.body.email;
  const { password } = req.body;
  
  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  // Find user by email or username
  const stmt = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?');
  const user = stmt.get(identifier, identifier) as any;

  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  if (!user.active) {
    return res.status(403).json({ success: false, message: 'Account is deactivated' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(user.shop_id);

  const token = jwt.sign({ id: user.id, role: user.role, shop_id: user.shop_id }, JWT_SECRET, { expiresIn: '7d' });

  // Exclude password from response
  const { password: _, ...safeUser } = user;
  
  res.json({
    success: true,
    token,
    user: safeUser,
    shop
  });
});

app.post('/api/auth/setup', (req, res) => {
  res.status(400).json({ success: false, message: 'Setup is handled by default admin account now.' });
});

app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }

  // Check if username exists
  const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username already taken' });
  }

  const shopId = 'shop_' + Date.now();
  const userId = 'user_' + Date.now();
  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    // Create new shop
    db.prepare('INSERT INTO shops (id, shop_name, created_at) VALUES (?, ?, ?)').run(
      shopId, 
      username + '\\\'s Shop', 
      new Date().toISOString()
    );

    // Create owner user
    db.prepare(`
      INSERT INTO users (id, shop_id, name, email, username, password, role, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(userId, shopId, username, username + '@shop.com', username, hashedPassword, 'owner');

    const token = jwt.sign({ id: userId, role: 'owner', shop_id: shopId }, JWT_SECRET, { expiresIn: '7d' });
    const shop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
    const user = db.prepare('SELECT id, shop_id, name, email, username, role, active FROM users WHERE id = ?').get(userId);

    res.json({
      success: true,
      token,
      user,
      shop
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- USER MANAGEMENT ---
// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/api/users', authenticateToken, (req: any, res) => {
  const shopId = req.user.shop_id;
  const users = db.prepare('SELECT id, shop_id, name, email, username, role, active FROM users WHERE shop_id = ?').all(shopId);
  res.json({ success: true, users });
});

app.post('/api/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { name, email, username, password, role } = req.body;
  const shopId = req.user.shop_id;
  
  // Check if username exists
  const existing = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username or email already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password || 'print123', 10);
  const userId = 'user_' + Date.now();

  try {
    const stmt = db.prepare(`
      INSERT INTO users (id, shop_id, name, email, username, password, role, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(userId, shopId, name, email, username, hashedPassword, role || 'staff');
    res.json({ success: true, message: 'User created' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { role, active } = req.body;
  const targetId = req.params.id;

  try {
    const stmt = db.prepare('UPDATE users SET role = COALESCE(?, role), active = COALESCE(?, active) WHERE id = ?');
    stmt.run(role, active !== undefined ? (active ? 1 : 0) : null, targetId);
    res.json({ success: true, message: 'User updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  
  const targetId = req.params.id;
  if (targetId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
  }

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- JOBS MANAGEMENT ---
app.get('/api/jobs', authenticateToken, (req: any, res) => {
  const { role, shop_id: shopId } = req.user;
  let jobs: any[] = [];
  
  if (role === 'admin') {
    jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
  } else {
    // Both owner and staff need to see the shop's incoming and active jobs
    jobs = db.prepare('SELECT * FROM jobs WHERE shop_id = ? ORDER BY created_at DESC').all(shopId);
  }
  
  for (const job of jobs) {
    job.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(job.id);
  }
  
  res.json({ success: true, jobs });
});

app.get('/api/shops/public', (req: any, res) => {
  try {
    const shops = db.prepare('SELECT id, shop_name, tagline, logo_url, phone, address, qr_slug, username, email FROM shops').all();
    res.json({ success: true, shops });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/shops/public/:slugOrId', (req: any, res) => {
  const { slugOrId } = req.params;
  try {
    const shop = db.prepare('SELECT id, shop_name, tagline, logo_url, phone, address, qr_slug, username, email FROM shops WHERE qr_slug = ? OR id = ? OR username = ?').get(slugOrId, slugOrId, slugOrId);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop not found' });
    res.json({ success: true, shop });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/shops/:shopId/services', (req: any, res) => {
  const { shopId } = req.params;
  try {
    let services = db.prepare('SELECT * FROM services WHERE shop_id = ? ORDER BY created_at ASC').all(shopId) as any[];
    if (services.length === 0) {
      services = db.prepare('SELECT * FROM services WHERE shop_id = ? ORDER BY created_at ASC').all('default_shop_1') as any[];
    }
    const formatted = services.map(s => ({
      ...s,
      is_color: Boolean(s.is_color),
      is_active: Boolean(s.is_active)
    }));
    res.json({ success: true, services: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/shops/:shopId/services', (req: any, res) => {
  const { shopId } = req.params;
  const { services } = req.body;
  if (!Array.isArray(services)) {
    return res.status(400).json({ success: false, message: 'Invalid services array' });
  }
  try {
    const delStmt = db.prepare('DELETE FROM services WHERE shop_id = ?');
    const insStmt = db.prepare(`
      INSERT INTO services (id, shop_id, name, service_type, paper_size, is_color, unit_price, unit_label, is_active, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const runTransaction = db.transaction((list: any[]) => {
      delStmt.run(shopId);
      for (const s of list) {
        const srvId = s.id || ('srv_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
        insStmt.run(
          srvId,
          shopId,
          s.name,
          s.service_type || 'print',
          s.paper_size || null,
          s.is_color ? 1 : 0,
          s.unit_price || 5,
          s.unit_label || 'per page',
          s.is_active !== false ? 1 : 0,
          s.description || null
        );
      }
    });
    runTransaction(services);
    const updated = db.prepare('SELECT * FROM services WHERE shop_id = ?').all(shopId).map((s: any) => ({
      ...s,
      is_color: Boolean(s.is_color),
      is_active: Boolean(s.is_active)
    }));
    res.json({ success: true, services: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/jobs/public/:jobNumber', (req: any, res) => {
  const { jobNumber } = req.params;
  try {
    const raw = (jobNumber || '').trim();
    if (!raw) return res.status(400).json({ success: false, message: 'Missing tracking token' });

    const stripped = raw.replace(/^[#\s]+/, '').trim();
    let withPrefix = stripped.toUpperCase();
    const matchJob = stripped.match(/^JOB[\s\-_]*(\d+)$/i);
    if (matchJob) {
      withPrefix = `JOB-${matchJob[1]}`;
    } else if (/^\d+$/.test(stripped)) {
      withPrefix = `JOB-${stripped}`;
    }

    const clean = stripped.toUpperCase();

    const job = db.prepare(`
      SELECT j.*, 
             s.shop_name, s.tagline as shop_tagline, s.phone as shop_phone, s.address as shop_address
      FROM jobs j
      LEFT JOIN shops s ON j.shop_id = s.id
      WHERE UPPER(j.job_number) = ? 
         OR UPPER(j.job_number) = ? 
         OR j.id = ? 
         OR UPPER(j.id) = ? 
         OR j.job_number LIKE ?
      ORDER BY j.created_at DESC 
      LIMIT 1
    `).get(clean, withPrefix, raw, clean, `%${clean}%`) as any;

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    job.is_color = Boolean(job.is_color);
    job.is_double_sided = Boolean(job.is_double_sided);
    job.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(job.id);
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/jobs/public/:id/cancel', (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('cancelled', id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/jobs/public/:id/files', (req: any, res) => {
  const { id } = req.params;
  const { files } = req.body;
  try {
    db.prepare('DELETE FROM job_files WHERE job_id = ?').run(id);
    if (files && files.length > 0) {
      const fileStmt = db.prepare(`
        INSERT INTO job_files (id, job_id, file_name, file_path, file_size, file_type, data_url, print_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'file_received')
      `);
      for (const file of files) {
        const fileId = file.id || ('jf_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
        fileStmt.run(fileId, id, file.file_name, file.file_path || `/uploads/${file.file_name}`, file.file_size || 0, file.file_type || 'application/octet-stream', file.data_url || '');
      }
    }
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    if (job) {
      job.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(id);
    }
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/jobs/public', (req: any, res) => {
  const {
    shop_id,
    customer_name,
    service_type,
    status,
    copies,
    is_color,
    paper_size,
    is_double_sided,
    page_count,
    total_prints,
    order_amount,
    instructions,
    customer_phone,
    files
  } = req.body;
  
  const jobId = 'job_' + Date.now();
  const jobNumber = 'JOB-' + Math.floor(1000 + Math.random() * 9000);
  const numCopies = typeof copies === 'number' ? copies : 1;
  const colorInt = is_color ? 1 : 0;
  const doubleSidedInt = is_double_sided ? 1 : 0;
  const numPages = typeof page_count === 'number' ? page_count : (files ? files.length : 1);
  const totalP = typeof total_prints === 'number' ? total_prints : (numPages * numCopies);

  let effectiveShopId = shop_id || 'default_shop_1';
  try {
    const existingShop = db.prepare('SELECT id FROM shops WHERE id = ?').get(effectiveShopId);
    if (!existingShop) {
      const anyShop = db.prepare('SELECT id FROM shops LIMIT 1').get() as any;
      if (anyShop) {
        effectiveShopId = anyShop.id;
      } else {
        db.prepare('INSERT OR IGNORE INTO shops (id, shop_name) VALUES (?, ?)').run(effectiveShopId, 'Namaste Print');
      }
    }
  } catch {
    // fallback
  }

  try {
    let calculatedAmount = typeof order_amount === 'number' && order_amount > 0 ? order_amount : 0;
    if (!calculatedAmount) {
      try {
        const activeServices = db.prepare('SELECT * FROM services WHERE (shop_id = ? OR shop_id = ?) AND is_active = 1').all(effectiveShopId, 'default_shop_1') as any[];
        let matched = activeServices.find((s) => {
          if (s.service_type !== (service_type || 'print')) return false;
          if (service_type === 'photo_print') return true;
          const sizeMatch = !s.paper_size || s.paper_size === (paper_size || 'A4');
          const colorMatch = s.is_color === colorInt;
          return sizeMatch && colorMatch;
        });
        if (!matched) {
          matched = activeServices.find((s) => s.service_type === (service_type || 'print'));
        }
        if (matched && matched.unit_price) {
          calculatedAmount = matched.unit_price * totalP;
        } else {
          const rate = is_color ? 15 : 5;
          calculatedAmount = rate * totalP;
        }
      } catch {
        calculatedAmount = (is_color ? 15 : 5) * totalP;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, shop_id, job_number, customer_name, service_type, status,
        copies, is_color, paper_size, is_double_sided, page_count,
        total_prints, order_amount, instructions, customer_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      jobId,
      effectiveShopId,
      jobNumber,
      customer_name || 'Walk-in Customer',
      service_type || 'print',
      status || 'new',
      numCopies,
      colorInt,
      paper_size || 'A4',
      doubleSidedInt,
      numPages,
      totalP,
      calculatedAmount,
      instructions || '',
      customer_phone || ''
    );
    
    if (files && files.length > 0) {
      const fileStmt = db.prepare(`
        INSERT INTO job_files (
          id, job_id, file_name, file_path, file_size, file_type,
          data_url, page_count, print_color, paper_size, copies, sides, print_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertFiles = db.transaction((filesArr: any[]) => {
        for (const file of filesArr) {
          const fileId = file.id || ('jf_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
          fileStmt.run(
            fileId,
            jobId,
            file.file_name,
            file.file_path || `/uploads/${file.file_name}`,
            file.file_size || 0,
            file.file_type || 'application/octet-stream',
            file.data_url || '',
            file.page_count || 1,
            file.print_color || (is_color ? 'color' : 'bw'),
            file.paper_size || paper_size || 'A4',
            file.copies || numCopies,
            file.sides || (is_double_sided ? 'double' : 'single'),
            file.print_status || 'file_received'
          );
        }
      });
      insertFiles(files);
    }
    
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    newJob.is_color = Boolean(newJob.is_color);
    newJob.is_double_sided = Boolean(newJob.is_double_sided);
    newJob.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(jobId);
    res.json({ success: true, job: newJob });
  } catch (err: any) {
    console.error('Job creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/jobs', authenticateToken, (req: any, res) => {
  const { customer_name, status, service_type, copies, is_color, paper_size, is_double_sided, instructions, page_count, total_prints, order_amount, files } = req.body;
  const { id: userId, shop_id: shopId, name: userName } = req.user;
  const jobId = 'job_' + Date.now();
  const jobNumber = 'JOB-' + Math.floor(1000 + Math.random() * 9000);
  const numCopies = typeof copies === 'number' ? copies : 1;
  const colorInt = is_color ? 1 : 0;
  const doubleSidedInt = is_double_sided ? 1 : 0;
  const numPages = typeof page_count === 'number' ? page_count : (files ? files.length : 1);
  const totalP = typeof total_prints === 'number' ? total_prints : (numPages * numCopies);
  
  let calculatedAmount = typeof order_amount === 'number' && order_amount > 0 ? order_amount : 0;
  if (!calculatedAmount) {
    try {
      const activeServices = db.prepare('SELECT * FROM services WHERE (shop_id = ? OR shop_id = ?) AND is_active = 1').all(shopId, 'default_shop_1') as any[];
      let matched = activeServices.find((s) => {
        if (s.service_type !== (service_type || 'print')) return false;
        if (service_type === 'photo_print') return true;
        const sizeMatch = !s.paper_size || s.paper_size === (paper_size || 'A4');
        const colorMatch = s.is_color === colorInt;
        return sizeMatch && colorMatch;
      });
      if (!matched) {
        matched = activeServices.find((s) => s.service_type === (service_type || 'print'));
      }
      if (matched && matched.unit_price) {
        calculatedAmount = matched.unit_price * totalP;
      } else {
        const rate = is_color ? 15 : 5;
        calculatedAmount = rate * totalP;
      }
    } catch {
      calculatedAmount = (is_color ? 15 : 5) * totalP;
    }
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, shop_id, staff_id, assigned_to, assigned_to_name, job_number, customer_name,
        service_type, status, copies, is_color, paper_size, is_double_sided,
        page_count, total_prints, order_amount, instructions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      jobId, shopId, userId, userId, userName, jobNumber, customer_name || 'Walk-in',
      service_type || 'print', status || 'new', numCopies, colorInt, paper_size || 'A4',
      doubleSidedInt, numPages, totalP, calculatedAmount, instructions || ''
    );
    
    if (files && files.length > 0) {
      const fileStmt = db.prepare(`
        INSERT INTO job_files (id, job_id, file_name, file_path, file_size, file_type, data_url, page_count, print_color, paper_size, copies, sides, print_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertFiles = db.transaction((filesArr: any[]) => {
        for (const file of filesArr) {
          const fileId = file.id || ('jf_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
          fileStmt.run(
            fileId, jobId, file.file_name, file.file_path || `/uploads/${file.file_name}`,
            file.file_size || 0, file.file_type || 'application/octet-stream', file.data_url || '',
            file.page_count || 1, file.print_color || (is_color ? 'color' : 'bw'),
            file.paper_size || paper_size || 'A4', file.copies || numCopies,
            file.sides || (is_double_sided ? 'double' : 'single'), file.print_status || 'file_received'
          );
        }
      });
      insertFiles(files);
    }
    
    const newJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    newJob.is_color = Boolean(newJob.is_color);
    newJob.is_double_sided = Boolean(newJob.is_double_sided);
    newJob.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(jobId);
    res.json({ success: true, job: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/jobs/:id/status', authenticateToken, (req: any, res) => {
  const { status } = req.body;
  const jobId = req.params.id;
  const { role, id: userId, shop_id: shopId, name: userName } = req.user;
  
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    
    if (role !== 'admin' && job.shop_id !== shopId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    // If job was unassigned and staff changes status, assign it to them
    if (!job.staff_id) {
      db.prepare(`
        UPDATE jobs
        SET status = ?, staff_id = ?, assigned_to = ?, assigned_to_name = ?, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, userId, userId, userName, jobId);
    } else {
      db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, jobId);
    }

    res.json({ success: true, message: 'Status updated' });
  } catch(err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/jobs/:id/claim', authenticateToken, (req: any, res) => {
  const jobId = req.params.id;
  const { id: userId, shop_id: shopId, name: userName } = req.user;
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.shop_id !== shopId) return res.status(403).json({ success: false, message: 'Unauthorized' });

    db.prepare(`
      UPDATE jobs 
      SET staff_id = ?, assigned_to = ?, assigned_to_name = ?, assigned_at = CURRENT_TIMESTAMP, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(userId, userId, userName, jobId);

    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;
    updated.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(jobId);
    res.json({ success: true, job: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/jobs/:id/files/:fileId/print', authenticateToken, (req: any, res) => {
  const { id, fileId } = req.params;
  const { staffName } = req.body;
  const staff_name = staffName || req.user.name || 'Staff Member';
  const now = new Date().toISOString();
  try {
    db.prepare(`
      UPDATE job_files
      SET print_status = 'printed', last_printed_at = ?, last_printed_by = ?
      WHERE id = ? AND job_id = ?
    `).run(now, staff_name, fileId, id);

    db.prepare(`
      UPDATE jobs
      SET status = CASE WHEN status = 'new' OR status = 'unassigned' THEN 'printing' ELSE status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    res.json({ success: true, printed_at: now, printed_by: staff_name });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ADMIN MANAGEMENT SUITE ---

app.get('/api/admin/stats', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  try {
    const totalShops = (db.prepare('SELECT COUNT(*) as count FROM shops').get() as any)?.count || 0;
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
    const totalJobs = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any)?.count || 0;
    const revRow = db.prepare("SELECT SUM(order_amount) as total FROM jobs WHERE status != 'cancelled'").get() as any;
    const totalRevenue = revRow?.total || 0;
    const activeJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status IN ('new', 'unassigned', 'assigned', 'in_progress', 'processing', 'printing', 'ready')").get() as any)?.count || 0;
    const completedJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'").get() as any)?.count || 0;
    const cancelledJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'cancelled'").get() as any)?.count || 0;
    
    const todayJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE DATE(created_at) = DATE('now')").get() as any)?.count || 0;
    const todayRev = (db.prepare("SELECT SUM(order_amount) as total FROM jobs WHERE DATE(created_at) = DATE('now') AND status != 'cancelled'").get() as any)?.total || 0;

    res.json({
      success: true,
      stats: {
        totalShops,
        totalUsers,
        totalJobs,
        totalRevenue,
        activeJobs,
        completedJobs,
        cancelledJobs,
        todayJobs,
        todayRevenue: todayRev,
        serverUptime: Math.floor(process.uptime()),
        systemHealth: 'healthy'
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  try {
    const users = db.prepare(`
      SELECT u.id, u.shop_id, u.name, u.email, u.username, u.role, u.active, s.shop_name
      FROM users u
      LEFT JOIN shops s ON u.shop_id = s.id
      ORDER BY u.role = 'admin' DESC, u.username ASC
    `).all();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/users', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  const { shop_id, name, email, username, password, role } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR (email = ? AND email != "")').get(username, email || '');
  if (existing) {
    return res.status(400).json({ success: false, message: 'Username or email already exists' });
  }

  const userId = 'user_' + Date.now();
  const hashed = bcrypt.hashSync(password, 10);
  try {
    db.prepare(`
      INSERT INTO users (id, shop_id, name, email, username, password, role, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(userId, shop_id || 'default_shop_1', name || username, email || `${username}@print.np`, username, hashed, role || 'staff');

    const created = db.prepare('SELECT id, shop_id, name, email, username, role, active FROM users WHERE id = ?').get(userId);
    res.json({ success: true, user: created });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  const { role, active, password, shop_id, name, email } = req.body;
  const { id } = req.params;

  try {
    let hashedPassword = null;
    if (password && password.trim()) {
      hashedPassword = bcrypt.hashSync(password.trim(), 10);
    }

    db.prepare(`
      UPDATE users
      SET role = COALESCE(?, role),
          active = COALESCE(?, active),
          password = COALESCE(?, password),
          shop_id = COALESCE(?, shop_id),
          name = COALESCE(?, name),
          email = COALESCE(?, email)
      WHERE id = ?
    `).run(
      role || null,
      active !== undefined ? (active ? 1 : 0) : null,
      hashedPassword,
      shop_id || null,
      name || null,
      email || null,
      id
    );

    const updated = db.prepare('SELECT id, shop_id, name, email, username, role, active FROM users WHERE id = ?').get(id);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  if (req.params.id === req.user.id || req.params.id === 'admin_user_1') {
    return res.status(400).json({ success: false, message: 'Cannot delete primary admin account' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

app.get('/api/admin/shops', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  try {
    const shops = db.prepare(`
      SELECT s.*, 
             COUNT(j.id) as total_jobs,
             COALESCE(SUM(CASE WHEN j.status != 'cancelled' THEN j.order_amount ELSE 0 END), 0) as total_revenue,
             (SELECT COUNT(*) FROM users u WHERE u.shop_id = s.id) as staff_count
      FROM shops s
      LEFT JOIN jobs j ON s.id = j.shop_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `).all();
    res.json({ success: true, shops });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/shops', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  const { shop_name, tagline, phone, address, qr_slug, username, email, owner_name, owner_username, owner_password } = req.body;
  if (!shop_name) return res.status(400).json({ success: false, message: 'Shop name is required' });

  const shopId = 'shop_' + Date.now();
  const slug = (qr_slug || username || shop_name.toLowerCase().replace(/[^a-z0-9]/g, '-')).replace(/--+/g, '-');
  
  try {
    db.prepare(`
      INSERT INTO shops (id, shop_name, tagline, phone, address, qr_slug, username, email, owner_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      shopId,
      shop_name,
      tagline || "Nepal's Smart QR Print & File Service",
      phone || '',
      address || '',
      slug,
      username || slug,
      email || '',
      owner_name || ''
    );

    if (owner_username && owner_password) {
      const ownerUserId = 'user_' + Date.now();
      const hashed = bcrypt.hashSync(owner_password, 10);
      db.prepare(`
        INSERT INTO users (id, shop_id, name, email, username, password, role, active)
        VALUES (?, ?, ?, ?, ?, ?, 'owner', 1)
      `).run(ownerUserId, shopId, owner_name || owner_username, email || (owner_username + '@shop.com'), owner_username, hashed);
    }

    const createdShop = db.prepare('SELECT * FROM shops WHERE id = ?').get(shopId);
    res.json({ success: true, shop: createdShop });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/shops/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  const { shop_name, tagline, phone, address, qr_slug, username, email, owner_name } = req.body;
  const { id } = req.params;

  try {
    db.prepare(`
      UPDATE shops 
      SET shop_name = COALESCE(?, shop_name),
          tagline = COALESCE(?, tagline),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          qr_slug = COALESCE(?, qr_slug),
          username = COALESCE(?, username),
          email = COALESCE(?, email),
          owner_name = COALESCE(?, owner_name)
      WHERE id = ?
    `).run(shop_name, tagline, phone, address, qr_slug, username, email, owner_name, id);

    const updated = db.prepare('SELECT * FROM shops WHERE id = ?').get(id);
    res.json({ success: true, shop: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/shops/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  try {
    db.prepare('DELETE FROM services WHERE shop_id = ?').run(req.params.id);
    db.prepare('DELETE FROM job_files WHERE job_id IN (SELECT id FROM jobs WHERE shop_id = ?)').run(req.params.id);
    db.prepare('DELETE FROM jobs WHERE shop_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE shop_id = ?').run(req.params.id);
    db.prepare('DELETE FROM shops WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Shop and related data deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/jobs', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  try {
    const jobs = db.prepare(`
      SELECT j.*, s.shop_name
      FROM jobs j
      LEFT JOIN shops s ON j.shop_id = s.id
      ORDER BY j.created_at DESC
    `).all() as any[];

    for (const job of jobs) {
      job.is_color = Boolean(job.is_color);
      job.is_double_sided = Boolean(job.is_double_sided);
      job.files = db.prepare('SELECT * FROM job_files WHERE job_id = ?').all(job.id);
    }

    res.json({ success: true, jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/admin/jobs/:id/status', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  const { status } = req.body;
  const { id } = req.params;
  try {
    db.prepare('UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/jobs/:id', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM job_files WHERE job_id = ?').run(id);
    db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/services', authenticateToken, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });
  try {
    const services = db.prepare(`
      SELECT s.*, sh.shop_name
      FROM services s
      LEFT JOIN shops sh ON s.shop_id = sh.id
      ORDER BY s.shop_id ASC, s.created_at ASC
    `).all() as any[];
    res.json({
      success: true,
      services: services.map(s => ({
        ...s,
        is_color: Boolean(s.is_color),
        is_active: Boolean(s.is_active)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Transfers API ---

app.post('/api/transfers', authenticateToken, (req: any, res) => {
  const { customer_name, pin, files } = req.body;
  const { id: userId, shop_id: shopId, name: userName } = req.user;
  
  const transferId = 'transfer_' + Date.now();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  try {
    const stmt = db.prepare("INSERT INTO outgoing_transfers (id, shop_id, customer_name, pin_hash, raw_pin_for_shop, expires_at, sent_by_staff_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(transferId, shopId, customer_name, pin, pin, expiresAt, userName);
    
    const fileStmt = db.prepare("INSERT INTO outgoing_files (id, transfer_id, file_name, file_path, file_size, file_type, data_url, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    const insertFiles = db.transaction((filesArr) => {
      for (const file of filesArr) {
        const fileId = 'file_' + Date.now() + '_' + Math.floor(Math.random()*1000);
        fileStmt.run(fileId, transferId, file.file_name, file.file_path, file.file_size, file.file_type, file.data_url, expiresAt);
      }
    });
    insertFiles(files);
    
    const newTransfer = db.prepare('SELECT * FROM outgoing_transfers WHERE id = ?').get(transferId) as any;
    newTransfer.files = db.prepare('SELECT * FROM outgoing_files WHERE transfer_id = ?').all(transferId);
    
    res.json({ success: true, transfer: newTransfer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/transfers', authenticateToken, (req: any, res) => {
  const { shop_id: shopId } = req.user;
  try {
    const transfers = db.prepare('SELECT * FROM outgoing_transfers WHERE shop_id = ? ORDER BY created_at DESC').all(shopId) as any[];
    for (const t of transfers) {
      t.files = db.prepare('SELECT * FROM outgoing_files WHERE transfer_id = ?').all(t.id);
    }
    res.json({ success: true, transfers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/transfers/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM outgoing_files WHERE transfer_id = ?').run(id);
    db.prepare('DELETE FROM outgoing_transfers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch('/api/transfers/:id/pin', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { pin } = req.body;
  try {
    db.prepare('UPDATE outgoing_transfers SET pin_hash = ?, raw_pin_for_shop = ? WHERE id = ?').run(pin, pin, id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/transfers/verify', (req: any, res) => {
  const { customer_name, pin } = req.body;
  try {
    // Basic verification without tracking failed attempts for simplicity
    const transfer = db.prepare('SELECT * FROM outgoing_transfers WHERE customer_name = ? AND pin_hash = ?').get(customer_name, pin) as any;
    if (!transfer) {
      return res.json({ success: false, message: 'Invalid customer name or PIN' });
    }
    
    db.prepare('UPDATE outgoing_transfers SET status = ? WHERE id = ?').run('downloaded', transfer.id);
    transfer.status = 'downloaded';
    transfer.files = db.prepare('SELECT * FROM outgoing_files WHERE transfer_id = ?').all(transfer.id);
    
    res.json({ success: true, transfer });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
