import db from './db';

export function setupDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shops (
      id TEXT PRIMARY KEY,
      shop_name TEXT NOT NULL,
      tagline TEXT,
      logo_url TEXT,
      phone TEXT,
      address TEXT,
      qr_slug TEXT,
      username TEXT,
      email TEXT,
      owner_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      staff_id TEXT,
      job_number TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      service_type TEXT DEFAULT 'print',
      status TEXT NOT NULL,
      copies INTEGER DEFAULT 1,
      is_color INTEGER DEFAULT 0,
      paper_size TEXT DEFAULT 'A4',
      is_double_sided INTEGER DEFAULT 0,
      page_count INTEGER DEFAULT 0,
      total_prints INTEGER DEFAULT 0,
      order_amount REAL DEFAULT 0,
      instructions TEXT,
      customer_phone TEXT,
      assigned_to TEXT,
      assigned_to_name TEXT,
      assigned_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(shop_id) REFERENCES shops(id),
      FOREIGN KEY(staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS job_files (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      data_url TEXT,
      page_count INTEGER DEFAULT 0,
      print_color TEXT,
      paper_size TEXT,
      copies INTEGER DEFAULT 1,
      sides TEXT,
      print_status TEXT DEFAULT 'file_received',
      last_printed_at DATETIME,
      last_printed_by TEXT,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      active INTEGER DEFAULT 1,
      FOREIGN KEY(shop_id) REFERENCES shops(id)
    );

    CREATE TABLE IF NOT EXISTS outgoing_transfers (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      raw_pin_for_shop TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      download_count INTEGER DEFAULT 0,
      max_downloads INTEGER DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      sent_by_staff_name TEXT,
      FOREIGN KEY(shop_id) REFERENCES shops(id)
    );

    CREATE TABLE IF NOT EXISTS outgoing_files (
      id TEXT PRIMARY KEY,
      transfer_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      data_url TEXT,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY(transfer_id) REFERENCES outgoing_transfers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      shop_id TEXT NOT NULL,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      paper_size TEXT,
      is_color INTEGER DEFAULT 0,
      unit_price REAL NOT NULL,
      unit_label TEXT DEFAULT 'per page',
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(shop_id) REFERENCES shops(id)
    );
  `);

  // Run dynamic schema migrations for any existing columns
  const tryAddColumn = (table: string, col: string, def: string) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    } catch {
      // Column already exists
    }
  };

  // shops columns
  tryAddColumn('shops', 'phone', 'TEXT');
  tryAddColumn('shops', 'address', 'TEXT');
  tryAddColumn('shops', 'qr_slug', 'TEXT');
  tryAddColumn('shops', 'username', 'TEXT');
  tryAddColumn('shops', 'email', 'TEXT');
  tryAddColumn('shops', 'owner_name', 'TEXT');

  // jobs columns
  tryAddColumn('jobs', 'service_type', "TEXT DEFAULT 'print'");
  tryAddColumn('jobs', 'copies', 'INTEGER DEFAULT 1');
  tryAddColumn('jobs', 'is_color', 'INTEGER DEFAULT 0');
  tryAddColumn('jobs', 'paper_size', "TEXT DEFAULT 'A4'");
  tryAddColumn('jobs', 'is_double_sided', 'INTEGER DEFAULT 0');
  tryAddColumn('jobs', 'instructions', 'TEXT');
  tryAddColumn('jobs', 'customer_phone', 'TEXT');
  tryAddColumn('jobs', 'assigned_to', 'TEXT');
  tryAddColumn('jobs', 'assigned_to_name', 'TEXT');
  tryAddColumn('jobs', 'assigned_at', 'DATETIME');
  tryAddColumn('jobs', 'completed_at', 'DATETIME');

  // job_files columns
  tryAddColumn('job_files', 'print_status', "TEXT DEFAULT 'file_received'");
  tryAddColumn('job_files', 'last_printed_at', 'DATETIME');
  tryAddColumn('job_files', 'last_printed_by', 'TEXT');

  // Insert or update default shop and admin
  db.exec(`
    INSERT OR IGNORE INTO shops (id, shop_name, tagline, phone, address, qr_slug)
    VALUES ('default_shop_1', 'Namaste Print', 'Nepal''s Smart QR Print & File Service', '9841234567', 'New Road, Kathmandu', 'namaste-print');

    UPDATE shops 
    SET phone = COALESCE(phone, '9841234567'),
        address = COALESCE(address, 'New Road, Kathmandu'),
        qr_slug = COALESCE(qr_slug, 'namaste-print'),
        tagline = COALESCE(tagline, 'Nepal''s Smart QR Print & File Service')
    WHERE id = 'default_shop_1';

    INSERT OR IGNORE INTO users (id, shop_id, name, email, username, password, role, active) 
    VALUES ('admin_user_1', 'default_shop_1', 'Admin', 'admin@example.com', 'admin', '$2b$10$Zl1.jRE3XgYhhAC1Yvcgc.JpjzHkInfsc6GIPP5RrZ2LXlen0drji', 'admin', 1);
  `);

  try {
    const servicesCount = db.prepare('SELECT COUNT(*) as cnt FROM services').get() as any;
    if (!servicesCount || servicesCount.cnt === 0) {
      const srvStmt = db.prepare(`
        INSERT INTO services (id, shop_id, name, service_type, paper_size, is_color, unit_price, unit_label, is_active, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const defaults = [
        ['srv_a4_bw', 'default_shop_1', 'A4 Black & White Print', 'print', 'A4', 0, 5, 'per page', 1, 'Standard monochrome document printing on 75/80 GSM paper'],
        ['srv_a4_color', 'default_shop_1', 'A4 Color Print', 'print', 'A4', 1, 15, 'per page', 1, 'High-resolution vibrant color print for assignments and reports'],
        ['srv_a3_bw', 'default_shop_1', 'A3 Black & White Print', 'print', 'A3', 0, 15, 'per page', 1, 'Engineering drawings, blueprints, and large format B&W prints'],
        ['srv_a3_color', 'default_shop_1', 'A3 Color Print', 'print', 'A3', 1, 40, 'per page', 1, 'Large format posters and architectural color presentations'],
        ['srv_photo_4x6', 'default_shop_1', 'Photo Print 4×6 (Glossy/Matte)', 'photo_print', 'A4', 1, 25, 'per photo', 1, 'Lab quality 4R glossy photo paper print'],
        ['srv_photo_5x7', 'default_shop_1', 'Photo Print 5×7 / Studio Portrait', 'photo_print', 'A4', 1, 35, 'per photo', 1, '5R photo print / Passport & auto-sized family photo prints'],
        ['srv_copy_bw', 'default_shop_1', 'A4 Photocopy / Xerox (B&W)', 'photocopy', 'A4', 0, 4, 'per page', 1, 'Fast high-volume laser photocopy Xerox'],
        ['srv_copy_color', 'default_shop_1', 'A4 Color Photocopy', 'photocopy', 'A4', 1, 12, 'per page', 1, 'Exact color reproduction photocopy'],
        ['srv_citizenship_a5_bw', 'default_shop_1', 'Citizenship Print (A5 Half Sheet B&W)', 'citizenship', 'A5', 0, 8, 'per sheet', 1, 'Citizenship front and back merged on A5 half paper (Photocopy)'],
        ['srv_citizenship_a5_color', 'default_shop_1', 'Citizenship Print (A5 Half Sheet Color)', 'citizenship', 'A5', 1, 15, 'per sheet', 1, 'Citizenship front and back merged on A5 half paper (Full Color)'],
        ['srv_citizenship_bw', 'default_shop_1', 'Citizenship Print (A4 2-in-1 B&W)', 'citizenship', 'A4', 0, 10, 'per sheet', 1, 'Citizenship front and back merged on single A4 sheet (Photocopy)'],
        ['srv_citizenship_color', 'default_shop_1', 'Citizenship Print (A4 2-in-1 Color)', 'citizenship', 'A4', 1, 25, 'per sheet', 1, 'Citizenship front and back merged on single A4 sheet (Full Color)'],
        ['srv_binding', 'default_shop_1', 'Spiral / Comb Document Binding', 'other', null, 0, 60, 'per document', 1, 'Plastic spiral ring binding with clear OHP cover front & back'],
        ['srv_lamination', 'default_shop_1', 'A4 Document / Certificate Lamination', 'other', 'A4', 0, 30, 'per piece', 1, '125 micron heat pouch lamination for certificates and cards']
      ];
      for (const s of defaults) {
        srvStmt.run(...s);
      }
    }
  } catch (err) {
    console.warn('Could not seed default services:', err);
  }
}
