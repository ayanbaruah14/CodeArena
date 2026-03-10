import Submission from "../models/Submission.js";
import submissionQueue from "../queue/submissionQueue.js";

export const submitCode = async (req,res)=>{

  const {code,language,problemId,contestId} = req.body;

  const submission = await Submission.create({
    user:req.user.id,
    problem:problemId,
    contest:contestId,
    code,
    language,
    status:"Pending"
  });

  await submissionQueue.add("execute",{
    submissionId:submission._id,
    code,
    problemId
  });

  res.json({
    message:"Submission queued",
    submissionId:submission._id
  });

};