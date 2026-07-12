import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Asset } from '../models/Asset.js';

dotenv.config();

const mockUsers = [
  { name: 'A. Rao', email: 'a.rao@example.com', role: 'asset_manager', department: 'Operations' },
  { name: 'S. Iqbal', email: 's.iqbal@example.com', role: 'admin', department: 'IT' },
  { name: 'John Doe', email: 'john@example.com', role: 'employee', department: 'Engineering' },
  { name: 'Jane Smith', email: 'jane@example.com', role: 'technician', department: 'Maintenance' },
];

const mockAssets = [
  { assetCode: 'AF-003', name: 'Dell laptop', category: 'Laptops', location: 'Desk E12', status: 'available' },
  { assetCode: 'AF-9921', name: 'Office chair', category: 'Furniture', location: 'Desk E14', status: 'available' },
  { assetCode: 'AF-9838', name: 'Monitor', category: 'Monitors', location: 'Desk E15', status: 'available' },
  { assetCode: 'AF-1002', name: 'MacBook Pro', category: 'Laptops', location: 'Desk E16', status: 'available' },
  { assetCode: 'AF-5501', name: 'Whiteboard', category: 'Office Supplies', location: 'Conference Room A', status: 'available' },
];

async function seed() {
  console.log('Seeding database...');
  await connectDb();

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.insertMany(mockUsers);
    console.log('Seed: Inserted mock users.');
  } else {
    console.log('Seed: Users already exist, skipping user seed.');
  }

  const assetCount = await Asset.countDocuments();
  if (assetCount === 0) {
    await Asset.insertMany(mockAssets);
    console.log('Seed: Inserted mock assets.');
  } else {
    console.log('Seed: Assets already exist, skipping asset seed.');
  }

  console.log('Database seeded successfully.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
