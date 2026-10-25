import mongoose from 'mongoose';

let cachedPromise = null;

/**
 * Connect to MongoDB with retry logic and event listeners
 * Caches connection for serverless platforms like Vercel
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_starter';

  cachedPromise = mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
      family: 4, // Force IPv4 to prevent Windows/cloud SSL alert 80 on Atlas
    })
    .then((conn) => {
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    })
    .catch((error) => {
      cachedPromise = null;
      console.error(`[Database Error] Connection failed: ${error.message}`);
      return null;
    });

  return cachedPromise;
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected.');
});

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};
