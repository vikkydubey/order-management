import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './database.js';
import { seedDatabase } from './seed.js';
import adminRoutes from './routes/admin.js';
import itemsRoutes from './routes/items.js';
import ordersRoutes from './routes/orders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
// In production the frontend is served from the same origin, so CORS is only needed in dev
if (!isProd) {
  app.use(cors());
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/orders', ordersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve built React app in production
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
// SPA fallback — any non-API route serves index.html so React Router / hash routing works
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
