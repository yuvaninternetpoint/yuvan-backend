// init_db.js - initialize lowdb JSON database file (db.json)
const fs = require('fs');
const { Low, JSONFile } = require('lowdb');
const path = require('path');
(async () => {
  const file = path.join(__dirname, 'db.json');
  const adapter = new JSONFile(file);
  const db = new Low(adapter);
  await db.read();
  db.data = db.data || { users: [], customers: [], products: [], bills: [], deals: [] };
  // create default admin user (email from your details)
  const adminEmail = (process.env.ADMIN_EMAIL || 'Yuvaninternetpoint@gmail.com').toLowerCase();
  const adminPass = process.env.ADMIN_PASS || '202212';
  db.data.users.push({ id: 'admin', name: 'Admin', email: adminEmail, pass: Buffer.from(adminPass).toString('base64'), role: 'admin' });
  await db.write();
  console.log('Initialized db.json with admin user:', adminEmail);
})().catch(e => { console.error(e); process.exit(1); });
