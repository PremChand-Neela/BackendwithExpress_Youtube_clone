import mongoose from "mongoose";

import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );

    // mongoose.connect() returns the mongoose object; the active connection
    // info is available on connectionInstance.connection (or mongoose.connection).
    const host = connectionInstance.connection.host || mongoose.connection.host;
    console.log(`\nMongoDB is connected !! DBHOST : ${host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
