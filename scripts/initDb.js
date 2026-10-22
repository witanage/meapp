// One-off setup script: creates tables (idempotent) and seeds CV data
// only if the profile table is currently empty.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runSqlFile(connection, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql
    .split(/;\s*[\r\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function main() {
  const connection = await pool.getConnection();
  try {
    console.log('Applying schema...');
    await runSqlFile(connection, path.join(__dirname, '..', 'db', 'schema.sql'));

    const [col] = await connection.query(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'admins' AND column_name = 'totp_secret'"
    );
    if (!col.length) await connection.query('ALTER TABLE admins ADD COLUMN totp_secret VARCHAR(64) NULL');

    const [adminRows] = await connection.query('SELECT COUNT(*) AS count FROM admins');
    if (adminRows[0].count > 0) {
      console.log('Admin user already exists — skipping bootstrap.');
    } else if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
      console.warn('ADMIN_USERNAME / ADMIN_PASSWORD_HASH not set — skipping admin bootstrap.');
    } else {
      console.log('Bootstrapping admin user from environment variables...');
      await connection.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [
        process.env.ADMIN_USERNAME,
        process.env.ADMIN_PASSWORD_HASH,
      ]);
    }

    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM profile');
    if (rows[0].count > 0) {
      console.log('Data already present — skipping seed.');
    } else {
      console.log('Seeding initial CV data...');
      await runSqlFile(connection, path.join(__dirname, '..', 'db', 'seed.sql'));
    }

    console.log('Database initialization complete.');
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
