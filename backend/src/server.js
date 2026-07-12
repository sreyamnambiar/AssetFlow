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
  try {
    await connectDb();
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.warn('⚠️ WARNING: Failed to connect to MongoDB. The server will still start, but database-dependent features (like Authentication) will fail until you provide a valid MONGO_URI.');
    console.warn(`Error details: ${error.message}`);
  }

  // Start the server regardless of DB connection so mock features still work!
  app.listen(port, () => {
    console.log(`🚀 AssetFlow API running on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
});
