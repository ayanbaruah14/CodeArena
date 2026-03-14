import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import dotenv from "dotenv";

import runCode from "../services/codeExecutor.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";

dotenv.config();

// MongoDB connection
await mongoose.connect(process.env.MONGO_URI);
console.log("Worker connected to MongoDB");

// Redis connection
const connection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

console.log("Worker started and waiting for jobs...");

// Language normalization map
const languageMap = {
  "c++": "cpp",
  "cpp": "cpp",
  "c": "cpp",
  "python": "python",
  "py": "python",
  "javascript": "javascript",
  "js": "javascript",
  "node": "javascript",
  "java": "java"
};

const worker = new Worker(
  "submissionQueue",
  async (job) => {

    console.log("Job received:", job.data);

    const { submissionId, code, problemId, language } = job.data;

    try {

      console.log("Language received:", language);

      const normalizedLanguage = languageMap[language?.toLowerCase()];

      if (!normalizedLanguage) {
        console.log("Unsupported language:", language);
        throw "Unsupported Language";
      }

      console.log("Normalized language:", normalizedLanguage);

      const submission = await Submission.findById(submissionId);
      const problem = await Problem.findById(problemId);

      if (!submission || !problem) {
        console.log("Submission or Problem not found");
        return;
      }

      const testCases = problem.testCases;

      let maxExecutionTime = 0;

      for (const test of testCases) {

        const result = await runCode(code, test.input, normalizedLanguage, submissionId);

        const output = result.output;
        const time = result.time;

        maxExecutionTime = Math.max(maxExecutionTime, time);

        console.log("Input:", test.input);
        console.log("Expected:", test.output);
        console.log("Received:", output);
        console.log("Execution Time:", time, "seconds");

        if (output.trim() !== test.output.trim()) {

          submission.status = "Wrong Answer";
          submission.executionTime = maxExecutionTime;

          await submission.save();

          console.log("Wrong Answer");
          return;
        }
      }

      // If all test cases passed
      submission.status = "Accepted";
      submission.executionTime = maxExecutionTime;

      await submission.save();

      console.log("Accepted");

    } catch (err) {

      console.log("Execution Error:", err);

      const submission = await Submission.findById(submissionId);

      if (submission) {

        if (err === "Compilation Error") {
          submission.status = "Compilation Error";
        }
        else if (err === "Time Limit Exceeded") {
          submission.status = "Time Limit Exceeded";
        }
        else if (err === "Unsupported Language") {
          submission.status = "Unsupported Language";
        }
        else {
          submission.status = "Runtime Error";
        }

        await submission.save();
      }
    }

  },
  { connection }
);

// Job completed event
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

// Job failed event
worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed`, err);
});