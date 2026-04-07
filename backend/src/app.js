import express from "express";
import "dotenv/config";

import mongoose from "mongoose";
import cors from "cors";

import userRoutes from "./routes/users.routes.js";
import meetRoutes from "./routes/meet.routes.js";

const app = express();

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meet", meetRoutes);

const start = async () => {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    throw new Error("MONGO_URL is not set in .env");
  }
  const connectionDb = await mongoose.connect(mongoUrl, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });

  console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
  app.listen(app.get("port"), () => {
    console.log(`Listening on port ${app.get("port")}`);
  });
};

start();
