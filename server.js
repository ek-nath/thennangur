import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple In-Memory Database
const db = {
  transactions: [],
  bookings: [],
  donations: []
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Thennangur Ashram Backend is active (In-Memory Database)' });
});

// Get all records
app.get('/api/records', (req, res) => {
  res.json({
    transactions: db.transactions,
    bookings: db.bookings,
    donations: db.donations
  });
});

// Clear all records
app.post('/api/records/clear', (req, res) => {
  db.transactions = [];
  db.bookings = [];
  db.donations = [];
  res.json({ message: 'In-memory database cleared successfully' });
});

// Process checkout / transaction
app.post('/api/checkout', (req, res) => {
  const { items, totalPrice } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty or invalid' });
  }

  const randNum = Math.floor(10000 + Math.random() * 90000);
  const txnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const receiptNo = `GA-TXN-2026-${randNum}`;
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const receipt = {
    receiptNo,
    txnId,
    date,
    items,
    totalPrice
  };

  // Save transaction
  db.transactions.push(receipt);

  // Extract bookings and donations to separate tables for easier view
  items.forEach(item => {
    if (item.type === 'pooja') {
      db.bookings.push({
        id: item.id,
        txnId,
        date,
        poojaName: item.name,
        price: item.price,
        ...item.details
      });
    } else if (item.type === 'donation') {
      db.donations.push({
        id: item.id,
        txnId,
        date,
        cause: item.cause || item.details.cause,
        amount: item.price,
        ...item.details
      });
    }
  });

  res.status(201).json({
    message: 'Payment simulated successfully. Record saved to in-memory database.',
    receipt
  });
});

// Serve frontend in production (Vite builds into /dist)
app.use('/thennangur/', express.static(path.join(__dirname, 'dist')));

// Fallback for SPA routing under /thennangur/
app.get(/^\/thennangur\/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
