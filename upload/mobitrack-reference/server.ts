import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let pool: any = null;
let useLocalFallback = false;
const LOCAL_DB_DIR = path.join(process.cwd(), '.data');
const LOCAL_DB_FILE = path.join(LOCAL_DB_DIR, 'db.json');

// Ensure local directory and file exist
if (!fs.existsSync(LOCAL_DB_DIR)) {
  fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_DB_FILE)) {
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify({}), 'utf-8');
}

function readLocalDB() {
  try {
    const content = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
    return JSON.parse(content || '{}');
  } catch (e) {
    return {};
  }
}

function writeLocalDB(data: any) {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local JSON DB:', e);
  }
}

async function initDB() {
  const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_PORT = '3306'
  } = process.env;

  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
    console.warn('⚠️ MYSQL_HOST, MYSQL_USER, or MYSQL_DATABASE missing in .env. Falling back to local JSON database.');
    useLocalFallback = true;
    return;
  }

  try {
    pool = mysql.createPool({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      port: parseInt(MYSQL_PORT, 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log('✅ Connected to Hostinger MySQL Database successfully!');
    conn.release();

    const collections = [
      'users',
      'inventory',
      'vendors',
      'vendorContracts',
      'vendorInstallments',
      'vendorPayments',
      'customers',
      'contracts',
      'payments'
    ];

    for (const col of collections) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`${col}\` (
          id VARCHAR(255) PRIMARY KEY,
          data LONGTEXT,
          createdAt VARCHAR(255)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    }
    console.log('✅ All MySQL tables ready!');
  } catch (error) {
    console.error('❌ Failed to connect to Hostinger MySQL Database:', (error as Error).message);
    console.warn('⚠️ Falling back to local JSON database to prevent server crash.');
    useLocalFallback = true;
  }
}

// Data Helpers
async function listDocs(collectionName: string) {
  if (useLocalFallback) {
    const dbData = readLocalDB();
    const colData = dbData[collectionName] || {};
    return Object.values(colData);
  } else {
    const [rows]: any[] = await pool.query(`SELECT id, data FROM \`${collectionName}\``);
    return rows.map((r: any) => {
      try {
        const item = JSON.parse(r.data);
        item.id = r.id;
        return item;
      } catch (e) {
        return { id: r.id };
      }
    });
  }
}

async function getDocById(collectionName: string, id: string) {
  if (useLocalFallback) {
    const dbData = readLocalDB();
    return dbData[collectionName]?.[id] || null;
  } else {
    const [rows]: any[] = await pool.query(`SELECT data FROM \`${collectionName}\` WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    try {
      const item = JSON.parse(rows[0].data);
      item.id = id;
      return item;
    } catch (e) {
      return null;
    }
  }
}

async function addDoc(collectionName: string, id: string | null, data: any) {
  const finalId = id || 'doc_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const dataToSave = { ...data, id: finalId };

  if (useLocalFallback) {
    const dbData = readLocalDB();
    if (!dbData[collectionName]) dbData[collectionName] = {};
    dbData[collectionName][finalId] = dataToSave;
    writeLocalDB(dbData);
    return dataToSave;
  } else {
    const createdStr = String(dataToSave.createdAt || new Date().getTime());
    await pool.query(
      `INSERT INTO \`${collectionName}\` (id, data, createdAt) VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE data = ?, createdAt = ?`,
      [finalId, JSON.stringify(dataToSave), createdStr, JSON.stringify(dataToSave), createdStr]
    );
    return dataToSave;
  }
}

async function updateDoc(collectionName: string, id: string, payload: any) {
  const existing = await getDocById(collectionName, id) || {};
  
  // Merge payload with Support for Firestore-like increment operation
  const updatedData = { ...existing };
  for (const [key, value] of Object.entries(payload)) {
    if (value && typeof value === 'object' && (value as any)._type === 'increment') {
      const prev = Number(updatedData[key]) || 0;
      updatedData[key] = prev + Number((value as any).value);
    } else {
      updatedData[key] = value;
    }
  }
  updatedData.id = id;

  if (useLocalFallback) {
    const dbData = readLocalDB();
    if (!dbData[collectionName]) dbData[collectionName] = {};
    dbData[collectionName][id] = updatedData;
    writeLocalDB(dbData);
    return updatedData;
  } else {
    const createdStr = String(updatedData.createdAt || new Date().getTime());
    await pool.query(
      `INSERT INTO \`${collectionName}\` (id, data, createdAt) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE data = ?`,
      [id, JSON.stringify(updatedData), createdStr, JSON.stringify(updatedData)]
    );
    return updatedData;
  }
}

async function deleteDoc(collectionName: string, id: string) {
  if (useLocalFallback) {
    const dbData = readLocalDB();
    if (dbData[collectionName] && dbData[collectionName][id]) {
      delete dbData[collectionName][id];
      writeLocalDB(dbData);
    }
    return { success: true };
  } else {
    await pool.query(`DELETE FROM \`${collectionName}\` WHERE id = ?`, [id]);
    return { success: true };
  }
}

// REST API Endpoints
// Auth login root
app.post('/api/auth/login', async (req, res) => {
  const { email, displayName, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const users = await listDocs('users');
    let user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      const id = 'user_' + Math.random().toString(36).substr(2, 9);
      user = {
        uid: id,
        email: email,
        displayName: displayName || email.split('@')[0],
        role: role || 'admin',
        createdAt: String(new Date().getTime())
      };
      await addDoc('users', id, user);
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Database State API
app.get('/api/db/list', async (req, res) => {
  const { collection } = req.query;
  if (!collection) return res.status(400).json({ error: 'collection required' });
  try {
    const data = await listDocs(String(collection));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/db/get', async (req, res) => {
  const { collection, id } = req.query;
  if (!collection || !id) return res.status(400).json({ error: 'collection and id required' });
  try {
    const docMeta = await getDocById(String(collection), String(id));
    res.json(docMeta);
  } catch (err) {
    res.status(505).json({ error: (err as Error).message });
  }
});

app.post('/api/db/add', async (req, res) => {
  const { collection: col, id, data } = req.body;
  if (!col) return res.status(400).json({ error: 'collection required' });
  try {
    const saved = await addDoc(col, id || null, data);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/api/db/update', async (req, res) => {
  const { collection: col, id, data } = req.body;
  if (!col || !id) return res.status(400).json({ error: 'collection and id required' });
  try {
    const saved = await updateDoc(col, id, data);
    res.json(saved);
  } catch (err) {
    res.status(505).json({ error: (err as Error).message });
  }
});

app.post('/api/db/delete', async (req, res) => {
  const { collection: col, id } = req.body;
  if (!col || !id) return res.status(400).json({ error: 'collection and id required' });
  try {
    await deleteDoc(col, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/db/status', (req, res) => {
  res.json({
    mysqlConnected: !useLocalFallback,
    mode: useLocalFallback ? 'Local JSON Fallback File' : 'Hostinger Cloud MySQL (Active)'
  });
});

async function startServer() {
  await initDB();

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MobiTrack full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
