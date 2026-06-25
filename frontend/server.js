import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true
}));

// Serve static assets from Vite build output directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for React Router SPA (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend production server running on port ${PORT}`);
  console.log(`Proxying API requests to: ${BACKEND_URL}`);
});
