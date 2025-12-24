import mongoose from "mongoose";

declare global {
  // Prevents hot-reload / multi-import duplication in dev
  // eslint-disable-next-line no-var
  var __mongoConnectPromise: Promise<typeof mongoose> | null;
}

globalThis.__mongoConnectPromise ??= null;

/**
 * Mongoose connection readyState:
 * 0 = disconnected
 * 1 = connected
 * 2 = connecting
 * 3 = disconnecting
 */
function isMongooseConnected() {
  return mongoose.connection.readyState === 1;
}

export async function connectToMongoDB(): Promise<void> {
  if (isMongooseConnected()) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  // If a connection is already in-flight, await it (prevents duplicate connects)
  if (globalThis.__mongoConnectPromise) {
    await globalThis.__mongoConnectPromise;
    return;
  }

  try {
    globalThis.__mongoConnectPromise = mongoose.connect(mongoUri, {
      // Good defaults; you can tweak based on your infra
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
    });

    await globalThis.__mongoConnectPromise;
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    globalThis.__mongoConnectPromise = null;
    console.error("❌ MongoDB connection error:", error);
    // Don't throw immediately, let the caller decide
    // throw error; 
  }
}


export async function disconnectFromMongoDB(): Promise<void> {
  // If currently connecting, wait first to avoid race conditions
  if (mongoose.connection.readyState === 2 && globalThis.__mongoConnectPromise) {
    try {
      await globalThis.__mongoConnectPromise;
    } catch {
      // ignore: if connect failed, we can't disconnect anyway
    }
  }

  if (mongoose.connection.readyState === 0) return;

  await mongoose.disconnect();
  globalThis.__mongoConnectPromise = null;
  console.log("👋 Disconnected from MongoDB");
}
