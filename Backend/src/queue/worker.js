import { Worker } from "bullmq";
import Redis from "ioredis";
import runCode from "../services/codeExecutor.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";

const connection = new Redis({
  host:"127.0.0.1",
  port:6379,
  maxRetriesPerRequest:null
});

console.log("Worker started and waiting for jobs...");

const worker = new Worker(
  "submissionQueue",
  async (job)=>{

    const {submissionId,code,problemId} = job.data;

    const submission = await Submission.findById(submissionId);
    const problem = await Problem.findById(problemId);

    const testCases = problem.testCases;

    try{

      for(const test of testCases){

        const output = await runCode(code,test.input);

        if(output.trim() !== test.output.trim()){

          submission.status = "Wrong Answer";
          await submission.save();

          console.log("Wrong Answer");

          return;
        }

      }

      submission.status = "Accepted";
      await submission.save();

      console.log("Accepted");

    }catch(err){

      submission.status = "Runtime Error";
      await submission.save();

      console.log("Runtime Error");

    }

  },
  {connection}
);