import mongoose from "mongoose";

let memoryServer;

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);

  const useMemory =
    String(process.env.USE_MEMORY_MONGO || "").trim().toLowerCase() === "true" ||
    uri === "memory" ||
    String(uri || "").startsWith("memory://");

  let connectionUri = uri;

  if (useMemory) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "vericlaim" },
    });
    connectionUri = memoryServer.getUri();
    console.log("Using in-memory MongoDB");
  } else {
    try {
      await mongoose.connect(connectionUri);
      console.log("MongoDB connected");
      return;
    } catch (err) {
      const code = err?.code || err?.cause?.code;
      const isDnsFail =
        code === "ENOTFOUND" ||
        code === "ENAMEQUERY" ||
        /ENOTFOUND|querySrv/i.test(String(err?.message || err));

      if (!isDnsFail) throw err;

      console.warn("MongoDB Atlas unreachable (", code || err.message, "). Falling back to in-memory MongoDB.");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: "vericlaim" },
      });
      connectionUri = memoryServer.getUri();
    }
  }

  await mongoose.connect(connectionUri);
  console.log("MongoDB connected");
}

export async function stopMemoryMongo() {
  if (memoryServer) {
    await mongoose.disconnect();
    await memoryServer.stop();
    memoryServer = null;
  }
}
