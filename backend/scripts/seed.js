/**
 * Seed default departments and an admin user.
 * Run: npm run seed
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "dns";
import { connectDB, stopMemoryMongo } from "../config/db.js";
import { seedDefaults } from "./seedData.js";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }
  await connectDB(uri);
  console.log("Connected");

  await seedDefaults();
  console.log("Departments ensured");

  await mongoose.disconnect();
  await stopMemoryMongo();
  console.log("Done");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
