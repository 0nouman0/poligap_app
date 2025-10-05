import type { Connection } from "mongoose";
import mongoose from "mongoose";
import { DatabaseName, DB_CONFIG, DbConfig } from "./config";

if (!DB_CONFIG.main.uri) {
  throw new Error('❌ MongoDB URI is required! Please set MONGODB_URI in your .env file');
}

let mainConnection: Connection | null = null;

function setupConnectionListeners(connection: Connection, dbName: string) {
  connection.on("connected", () => {
    console.log(`📡 Mongoose connected to MongoDB ${dbName}`);
  });

  connection.on("error", (err) => {
    console.error(`❌ Mongoose connection error for ${dbName}:`, err);
  });

  connection.on("disconnected", () => {
    console.log(`🔌 Mongoose disconnected from MongoDB ${dbName}`);
  });
}

async function createConnection(
  config: DbConfig<DatabaseName>
): Promise<mongoose.Connection> {
  const opts = {
    bufferCommands: false, // Disable mongoose buffering
    serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain a minimum of 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    retryWrites: true, // Retry failed writes
    retryReads: true, // Retry failed reads
  };

  console.log(`🔄 Creating new MongoDB connection for ${config.name}...`);

  try {
    const mongooseInstance = mongoose.createConnection(
      config.uri as string,
      opts
    );
    
    // Wait for the connection to be established
    await new Promise((resolve, reject) => {
      mongooseInstance.on('connected', resolve);
      mongooseInstance.on('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout after 30 seconds'));
      }, 30000);
    });
    
    console.log(`✅ Successfully connected to MongoDB ${config.name}`);
    setupConnectionListeners(mongooseInstance, config.name);
    return mongooseInstance;
  } catch (error) {
    console.error(`❌ MongoDB connection error for ${config.name}:`, error);
    throw error;
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (mainConnection) await mainConnection.close();
  console.log("👋 MongoDB connections closed through app termination");
  process.exit(0);
});

export const connectDB = async () => {
  if (!mainConnection) {
    try {
      mainConnection = await createConnection(DB_CONFIG.main);
      return mainConnection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }
  return mainConnection;
};

export const initializeConnection = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

const connections = {
  get main() {
    if (!mainConnection) {
      console.warn('⚠️ MongoDB connection not established');
      return null;
    }
    return mainConnection;
  },
};

export default connections;

// Initialize connection but don't block module loading
initializeConnection().catch(err => {
  console.error('❌ Database connection failed during module load:', err);
});

// Also connect to default mongoose for fallback

if (DB_CONFIG.main.uri) {
  mongoose.connect(DB_CONFIG.main.uri, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
  }).then(() => {
    console.log('✅ Default mongoose connection established');
  }).catch(err => {
    console.error('❌ Default mongoose connection failed:', err);
  });
}
