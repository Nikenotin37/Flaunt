require('dotenv').config();

const express = require('express');
const cors = require('cors');
const payments = require('./routes/payments');
const shipping = require('./routes/shipping');
const notifications = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'flaunt-backend' });
});

app.use('/api/payments', payments);
app.use('/api/shipping', shipping);
app.use('/api/notifications', notifications);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`FLAUNT backend listening on port ${port}`));
}

module.exports = app;
