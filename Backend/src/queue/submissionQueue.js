import { Queue } from "bullmq";
import Redis from "ioredis";

let submissionQueue = null;

if (process.env.REDIS_URL) {
  try {
    const connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null
    });
    submissionQueue = new Queue("submissionQueue", { connection });
    console.log("Redis connected — submission queue active");
  } catch (err) {
    console.warn("Redis connection failed — submissions disabled:", err.message);
  }
} else {
  console.warn("No REDIS_URL set — submission queue disabled");
}

export default submissionQueue;