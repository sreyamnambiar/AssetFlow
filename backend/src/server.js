import dotenv from 'dotenv';
import app from './app.js';
import { connectDb } from './config/db.js';

dotenv.config();

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