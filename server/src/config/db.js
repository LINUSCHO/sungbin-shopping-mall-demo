const mongoose = require('mongoose');

async function connectToDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not provided');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: true,
  });

  console.log('[mongo] connected');

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });
}

module.exports = { connectToDatabase };
