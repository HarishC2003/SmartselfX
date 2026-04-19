import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import path from 'path';

import connectDB from './config/db.js';
import swaggerSpec from './config/swagger.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import declarationRoutes from './routes/declarationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

import { verifyToken, verifyRole } from './middleware/authMiddleware.js';
import './jobs/weeklyReportJob.js';

dotenv.config();
connectDB();

const app = express();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE ORDER (Strictly ordered)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Helmet (HTTP security headers)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// 2. CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: { error: 'Too many authentication attempts. Try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100000,
  message: { error: 'Export limit reached. Try again in an hour.' }
});
app.use('/api/analytics/export', exportLimiter);

// 4. Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. MongoDB query injection sanitization
app.use(mongoSanitize());

// 6. XSS protection
app.use(xss());

// 7. HTTP Parameter Pollution prevention
app.use(hpp({
  whitelist: ['status', 'type', 'role', 'sortBy']
}));

// 8. Cookie parser
app.use(cookieParser());

// 9. Morgan
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(compression());

// ─── API Documentation ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SmartShelfX API Docs'
}));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ─── Routes ─────────────────────────────────────────────────────
// Public / semi-public
app.use('/api/auth', authRoutes); // Auth limiter is applied specifically to inner routes
app.use('/api/health', healthRoutes);

// Authenticated routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', verifyToken, transactionRoutes);
app.use('/api/alerts', verifyToken, alertRoutes);
app.use('/api/forecast', verifyToken, forecastRoutes);
app.use('/api/purchase-orders', verifyToken, purchaseOrderRoutes);
app.use('/api/declarations', verifyToken, declarationRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/analytics', verifyToken, verifyRole('ADMIN', 'MANAGER'), analyticsRoutes);
app.use('/api/search', verifyToken, searchRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);
app.use('/api/audit', verifyToken, verifyRole('ADMIN'), auditRoutes);

// ─── Static Assets ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// ─── Serve React client in production ───────────────────────────
if (process.env.NODE_ENV === 'production') {
    const clientBuild = path.join(process.cwd(), '..', 'client', 'dist');
    app.use(express.static(clientBuild));
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientBuild, 'index.html'));
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL ERROR HANDLER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 404 handler (before error handler)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    return res.status(409).json({ error: `${field} already exists` });
  }
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  // Handle Cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  // Custom smartShelf transactions (preserve legacy handling internally)
  if (err.message && err.message.includes('Insufficient stock')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message && (err.message.includes('replica set') || err.message.includes('sessions are not supported'))) {
    return res.status(500).json({ error: 'MongoDB Transaction Error: Requires Replica Set.' });
  }

  // Generic server error
  console.error('Server Error:', err);
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong' 
    : err.message;
  res.status(err.status || 500).json({ error: message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`API Docs available at http://localhost:${PORT}/api-docs`);
});
