import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

const defaultOptions = {
  // Use the new URL parser
  useNewUrlParser: true,
  // Use the new Server Discover and Monitoring engine
  useUnifiedTopology: true,
  // Don't build indexes automatically in production
  autoIndex: process.env.NODE_ENV !== "production",
  // Keep socket alive
  socketTimeoutMS: 45000,
  // How long to try reconnecting before failing
  serverSelectionTimeoutMS: 5000,
};

function onConnected() {
  console.log("MongoDB: connected");
}

function onError(err) {
  console.error("MongoDB connection error:", err);
}

function onDisconnected() {
  console.warn("MongoDB: disconnected");
}

mongoose.connection.on("connected", onConnected);
mongoose.connection.on("error", onError);
mongoose.connection.on("disconnected", onDisconnected);

/**
 * Connect to MongoDB using mongoose.
 * Throws an error if MONGO_URI is not set or connection fails.
 */
export async function connectMongo(retries = 2) {
  if (!MONGO_URI) {
    throw new Error(
      "Missing MongoDB connection string. Set MONGO_URI or DATABASE_URL in your environment."
    );
  }

  try {
    // mongoose.connect returns a promise
    await mongoose.connect(MONGO_URI, defaultOptions);
    // Optional: disable mongoose buffering in production to surface errors fast
    if (process.env.NODE_ENV === "production") {
      mongoose.set("bufferCommands", false);
    }
    return mongoose;
  } catch (err) {
    console.error(`MongoDB connection attempt failed: ${err.message}`);
    if (retries > 0) {
      console.log(`Retrying MongoDB connection (${retries} left)...`);
      // small backoff
      await new Promise((r) => setTimeout(r, 1000));
      return connectMongo(retries - 1);
    }
    throw err;
  }
}

export async function disconnectMongo() {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected cleanly");
  } catch (err) {
    console.error("Error while disconnecting MongoDB:", err);
  }
}

// Graceful shutdown on process termination signals
process.on("SIGINT", async () => {
  console.log("SIGINT received: closing MongoDB connection");
  await disconnectMongo();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received: closing MongoDB connection");
  await disconnectMongo();
  process.exit(0);
});
