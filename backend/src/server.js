import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Root .env
dotenv.config({ path: path.join(__dirname, '../.env') }); // Backend .env

import app from './app.js';
import { connectDb } from './config/db.js';
const port = process.env.PORT || 5000;

async function start() {
  await connectDb();
  app.listen(port, () => {
    console.log(`AssetFlow API running on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});