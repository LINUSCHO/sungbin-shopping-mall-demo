require('dotenv').config();
const { createApp } = require('./app');
const { connectToDatabase } = require('./config/db');

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopping-mall';

(async () => {
  try {
    await connectToDatabase(MONGO_URI);

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[server] listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('[server] failed to start application:', error);
    process.exit(1);
  }
})();
