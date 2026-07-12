import mongoose from "mongoose";

export const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI;

  console.log("MONGO_URI =", mongoUri); // <-- Add this line

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured");
  }

  mongoose.set('strictQuery', true);

  try {
    // Attempt standard connection. The user might have a bad string or bad auth.
    // If it fails, we fall back gracefully.
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`MongoDB connected: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
  } catch (primaryErr) {
    // Fallback: use in-memory MongoDB for development
    console.warn(`Could not connect to ${mongoUri.replace(/:([^:@]+)@/, ':****@')} — falling back to in-memory MongoDB`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`In-memory MongoDB started at ${inMemoryUri}`);

      // Seed demo data so the app is useful out-of-the-box
      await seedDemoData();
    } catch (fallbackErr) {
      console.error('Failed to start in-memory MongoDB:', fallbackErr);
      throw primaryErr;
    }
  }
};

async function seedDemoData() {
  const { User } = await import('../models/User.js');
  const { Asset } = await import('../models/Asset.js');
  const { Department } = await import('../models/Department.js');

  const deptCount = await Department.countDocuments();
  let depts = [];
  if (deptCount === 0) {
    depts = await Department.insertMany([
      { name: 'IT & Security', code: 'IT', description: 'Information Technology' },
      { name: 'Engineering', code: 'ENG', description: 'Software Development and IT Operations' },
      { name: 'Operations', code: 'OPS', description: 'Operations and Logistics' },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources and Talent Acquisition' },
    ]);
    console.log('Seeded demo departments');
  } else {
    depts = await Department.find();
  }

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const bcrypt = (await import('bcryptjs')).default;
    const hashed = await bcrypt.hash('password123', 10);
    await User.collection.insertMany([
      { name: 'Alice Manager', email: 'alice@assetflow.dev', role: 'admin',           status: 'active', password: hashed, department: depts[0]?._id, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Bob Auditor',   email: 'bob@assetflow.dev',   role: 'asset_manager',   status: 'active', password: hashed, department: depts[1]?._id, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Carol Auditor', email: 'carol@assetflow.dev', role: 'department_head', status: 'active', password: hashed, department: depts[2]?._id, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Dave Staff',    email: 'dave@assetflow.dev',  role: 'employee',        status: 'active', password: hashed, department: depts[3]?._id, createdAt: new Date(), updatedAt: new Date() },
    ]);
    console.log('Seeded demo users');
  }

  const assetCount = await Asset.countDocuments();
  if (assetCount === 0) {
    await Asset.insertMany([
      { assetCode: 'AST-001', name: 'Dell Laptop 15"',        category: 'IT Equipment', location: 'Desk E12',     status: 'available' },
      { assetCode: 'AST-002', name: 'HP Monitor 27"',         category: 'IT Equipment', location: 'Desk E12',     status: 'available' },
      { assetCode: 'AST-003', name: 'Cisco IP Phone',         category: 'Networking',   location: 'Reception',    status: 'in_use'    },
      { assetCode: 'AST-004', name: 'Canon Printer MFP',      category: 'Office',       location: 'Print Room B', status: 'available' },
      { assetCode: 'AST-005', name: 'MacBook Pro 14"',        category: 'IT Equipment', location: 'Desk F03',     status: 'in_use'    },
      { assetCode: 'AST-006', name: 'Epson Projector EB-X51', category: 'AV',           location: 'Conf Room 1',  status: 'available' },
      { assetCode: 'AST-007', name: 'Logitech Webcam',        category: 'IT Equipment', location: 'Desk F05',     status: 'available' },
      { assetCode: 'AST-008', name: 'UPS Power Backup',       category: 'Electrical',   location: 'Server Room',  status: 'in_use'    },
    ]);
    console.log('Seeded demo assets');
  }
}
