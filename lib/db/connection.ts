import mongoose from 'mongoose';

declare global {
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

let cached = global._mongooseConnection;

if (!cached) {
  cached = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 20000,
  }).then((m) => {
    console.log('MongoDB connected');
    return m;
  });
  global._mongooseConnection = cached;
}

export default function dbConnect() {
  return cached;
}
