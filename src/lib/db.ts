import mongoose, { Mongoose } from "mongoose";

const MONGOOSE_URI: string | undefined = process.env.MONGOOSE_URI;

// Use a global variable to preserve the connection across hot reloads in development
// and prevent multiple connections in serverless environments.
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGOOSE_URI) {
    throw new Error("Mongoose URI is not defined. Please check your .env file.");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGOOSE_URI, opts).then((mongoose) => {
      console.log("MongoDB Connected Successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Export the connection promise. 
// Existing routes doing `await db` will work correctly without blocking module load.
export const db = connectDB();