import dotenv from "dotenv";
import { Redis } from "ioredis";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  if (err.message.includes("NOAUTH")) {
    console.error(
      "Redis authentication failed. Please check your password configuration."
    );
  } else {
    console.error("Redis connection error:", err);
  }
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis");
});

export default redis;
