import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/orivisa';
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('MongoDB error:', err);
    process.exit(1); // Exit if critical connection fails in standalone mode
  }
};
