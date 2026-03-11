import { Worker } from "bullmq";
import Redis from "ioredis";
import mongoose from "mongoose";
import dotenv from "dotenv";

import runCode from "../services/codeExecutor.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";

dotenv.config();

/*
-----------------------------------------
Connect to MongoDB (worker is separate process)
-----------------------------------------
*/

await mongoose.connect(process.env.MONGO_URI);

console.log("Worker connected to MongoDB");

/*
-----------------------------------------
Redis Connection
-----------------------------------------
*/

const connection = new Redis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null
});

console.log("Worker started and waiting for jobs...");

/*
-----------------------------------------
Worker Logic
-----------------------------------------
*/

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

        const output = await runCode(code, test.input);
        console.log("Running with input:", test.input);
        console.log("Expected:", test.output);
        console.log("Received:", output);

        if (output.trim() !== test.output.trim()) {

          submission.status = "Wrong Answer";
          await submission.save();

          console.log("Wrong Answer");
          return;
        }

      }

      submission.status = "Accepted";
      await submission.save();

      console.log("Accepted");

    } catch (err) {

      console.log("Execution Error:", err);

      const submission = await Submission.findById(job.data.submissionId);

      if (submission) {
        submission.status = "Runtime Error";
        await submission.save();
      }

    }

  },
  { connection }
);

/*
-----------------------------------------
Worker Events
-----------------------------------------
*/

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed`, err);
});