import { Worker } from "bullmq";
import Redis from "ioredis";
import runCode from "../services/codeExecutor.js";

const connection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

console.log("Worker started and waiting for jobs...");

const worker = new Worker(
  "submissionQueue",
  async (job) => {

    console.log("Job received:", job.data);

    const { code } = job.data;

    try {
      const output = await runCode(code);
      console.log("Program Output:", output);
    } catch (err) {
      console.log("Execution Error:", err);
    }

  },
  { connection }
);