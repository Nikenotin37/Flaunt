require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const payments = require('./routes/payments');
const shipping = require('./routes/shipping');
const notifications = require('./routes/notifications');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
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

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX || 120),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again shortly.' },
});

const paymentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many payment requests. Please wait a moment.' },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'flaunt-backend' });
});

app.use('/api/payments', paymentLimiter, payments);
app.use('/api/shipping', apiLimiter, shipping);
app.use('/api/notifications', apiLimiter, notifications);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`FLAUNT backend listening on port ${port}`));
}

module.exports = app;
