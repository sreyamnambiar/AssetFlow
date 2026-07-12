import dotenv from 'dotenv';

dotenv.config();

import app from './app.js';
import { connectDb } from './config/db.js';

console.log("ENV CHECK:", process.env.MONGO_URI);

const port = process.env.PORT || 5000;

async function start() {
  try {
    await connectDb();

    app.listen(port, () => {
      console.log(`AssetFlow API running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

start();