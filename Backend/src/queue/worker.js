import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import dotenv from "dotenv";

import runCode from "../services/codeExecutor.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("Worker connected to MongoDB");

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

    const { submissionId, code, problemId } = job.data;

    try {

      const submission = await Submission.findById(submissionId);
      const problem = await Problem.findById(problemId);

      if (!submission || !problem) {
        console.log("Submission or Problem not found");
        return;
      }

      const testCases = problem.testCases;

      for (const test of testCases) {

        const result = await runCode(code, test.input);

        const output = result.output;
        const time = result.time;

        console.log("Input:", test.input);
        console.log("Expected:", test.output);
        console.log("Received:", output);
        console.log("Execution Time:", time, "seconds");

        if (output.trim() !== test.output.trim()) {

          submission.status = "Wrong Answer";
          submission.executionTime = time;

          await submission.save();

          console.log("Wrong Answer");
          return;
        }

      }

      submission.status = "Accepted";
      submission.executionTime = Date.now();

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
        else {
          submission.status = "Runtime Error";
        }

        await submission.save();
      }

    }

  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed`, err);
});