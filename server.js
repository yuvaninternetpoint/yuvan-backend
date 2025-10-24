// server.js - Express backend using lowdb for simple persistent JSON storage
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');
const shortid = require('shortid');
const path = require('path');
require('dotenv').config();

const DB_FILE = path.join(__dirname, 'db.json');
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const UPI_ID = process.env.UPI_ID || 'BHARATPE.8G0N0Y9O9W84110@fbpe';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Yuvaninternetpoint@gmail.com').toLowerCase();
const ADMIN_PASS = process.env.ADMIN_PASS || '202212';

async function ensureDB(){ await db.read(); db.data = db.data || { users: [], customers: [], products: [], bills: [], deals: [] }; }

// simple helpers
function encodePass(p){ return Buffer.from(p).toString('base64'); }
function decodePass(s){ return Buffer.from(s, 'base64').toString(); }

// --- Auth
app.post('/api/signup', async (req,res)=>{
  await ensureDB();
  const { name, email, pass } = req.body;
  if(!name || !email || !pass) return res.status(400).json({ error: 'missing' });
  const em = email.toLowerCase();
  if(db.data.users.find(u=>u.email===em)) return res.status(400).json({ error:'exists' });
  const user = { id: shortid.generate(), name, email: em, pass: encodePass(pass), role: 'customer' };
  db.data.users.push(user);
  // add to customers table for ledger
  db.data.customers.push({ id: shortid.generate(), name, email: em, phone: '', balance: 0 });
  await db.write();
  return res.json({ ok:true });
});

app.post('/api/login', async (req,res)=>{
  await ensureDB();
  const { email, pass } = req.body;
  if(!email || !pass) return res.status(400).json({ error:'missing' });
  const em = email.toLowerCase();
  if(em === ADMIN_EMAIL && pass === ADMIN_PASS){
    return res.json({ session: { role:'admin', email: em } });
  }
  const user = db.data.users.find(u => u.email === em);
  if(!user) return res.status(401).json({ error:'invalid' });
  if(decodePass(user.pass) !== pass) return res.status(401).json({ error:'invalid' });
  return res.json({ session: { role: 'customer', email: em } });
});

// --- Products & Deals
app.get('/api/products', async (req,res)=>{ await ensureDB(); res.json(db.data.products || []); });
app.post('/api/products', async (req,res)=>{ await ensureDB(); const { name, qty, cost } = req.body; if(!name) return res.status(400).json({ error:'name' }); const p = db.data.products.find(x=>x.name.toLowerCase()===name.toLowerCase()); if(p){ p.qty = (p.qty||0) + (qty||0); p.cost = cost || p.cost; } else { db.data.products.push({ id: shortid.generate(), name, qty: qty||0, cost: cost||0 }); } await db.write(); res.json({ ok:true }); });

app.get('/api/deals', async (req,res)=>{ await ensureDB(); res.json(db.data.deals || []); });
app.post('/api/deals', async (req,res)=>{ await ensureDB(); const { title, desc, price, img } = req.body; const d = { id: shortid.generate(), title, desc, price, img, created: new Date().toISOString() }; db.data.deals.push(d); await db.write(); res.json(d); });

// --- Customers & Bills
app.get('/api/customers', async (req,res)=>{ await ensureDB(); res.json(db.data.customers || []); });

app.post('/api/bills', async (req,res)=>{
  await ensureDB();
  const { type, customer, items, paid } = req.body;
  if(!type || !items) return res.status(400).json({ error:'missing' });
  const total = items.reduce((s,it)=> s + ((+it.qty||0) * (+it.rate||0)), 0);
  const balance = +(total - (+paid||0)).toFixed(2);
  const id = shortid.generate().toUpperCase();
  const date = new Date().toISOString();
  const status = (type==='Service'||type==='Repair') ? 'Received' : (type==='Purchase'?'Completed':'Paid');
  const bill = { id, type, date, customer: customer||'walk-in', items, total, paid: paid||0, balance, status, statusHistory: [{ status, at: date }] };
  db.data.bills.unshift(bill);
  // update customer balance
  if(customer){
    const c = db.data.customers.find(x => x.email === customer.toLowerCase());
    if(c){ c.balance = +( (c.balance||0) + balance ).toFixed(2); }
    else { db.data.customers.push({ id: shortid.generate(), name: customer, email: customer.toLowerCase(), phone: '', balance }); }
  }
  await db.write();
  res.json({ ok:true, id });
});

app.get('/api/bills', async (req,res)=>{
  await ensureDB();
  const customer = req.query.customer;
  let rows = db.data.bills || [];
  if(customer) rows = rows.filter(r => (r.customer||'').toLowerCase() === (customer||'').toLowerCase());
  res.json(rows);
});

app.get('/api/bills/:id', async (req,res)=>{
  await ensureDB();
  const id = req.params.id;
  const row = (db.data.bills || []).find(b => b.id === id);
  if(!row) return res.status(404).json({ error:'not found' });
  res.json(row);
});

app.post('/api/bills/:id/status', async (req,res)=>{ await ensureDB(); const id = req.params.id; const { status, note } = req.body; const row = (db.data.bills||[]).find(b=>b.id===id); if(!row) return res.status(404).json({ error:'not found' }); row.status = status; row.statusHistory = row.statusHistory || []; row.statusHistory.unshift({ status, at: new Date().toISOString(), note: note||'' }); await db.write(); res.json({ ok:true }); });

// --- Payments (UPI fallback)
app.post('/api/pay', async (req,res)=>{
  await ensureDB();
  const { billId, amount, customer } = req.body;
  if(!billId || !amount) return res.status(400).json({ error:'missing' });
  // We will return a UPI intent link fallback and a placeholder checkoutUrl
  const upi = process.env.UPI_ID || 'BHARATPE.8G0N0Y9O9W84110@fbpe';
  const pa = encodeURIComponent(upi);
  const am = (Math.round(amount*100)/100).toFixed(2);
  const upiUri = `upi://pay?pa=${pa}&pn=${encodeURIComponent('Yuvan Internet Point')}&am=${am}&cu=INR`;
  // Also prepare a web fallback (Google Pay web)
  const webFallback = `https://pay.google.com/gp/p/ui/pay?pa=${pa}&am=${am}`;
  res.json({ ok:true, checkoutUrl: webFallback, upiUri });
});

// --- Serve static (optional) if you place frontend in /frontend folder
const frontendPath = path.join(__dirname, 'frontend');
app.use('/', express.static(frontendPath));

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Server running on', port));
