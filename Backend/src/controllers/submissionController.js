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
    status:"In queue"
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

export const getUserSubmissions = async (req,res)=>{

  try{

    const userId = req.user.id;

    const submissions = await Submission
      .find({user:userId})
      .populate("problem","title")
      .sort({createdAt:-1});

    res.json(submissions);

  }catch(err){

    res.status(500).json({msg:"Server error"});

  }

};

export const getContestProblemStatus = async (req,res)=>{

  try{

    const userId = req.user.id;
    const {contestId} = req.params;

    const submissions = await Submission.find({
      user:userId,
      contest:contestId
    }).sort({createdAt:-1});

    const problemStatus = {};

    submissions.forEach(sub=>{

      const problemId = sub.problem.toString();

      if(!problemStatus[problemId]){
        problemStatus[problemId] = sub.status;
      }

    });

    res.json(problemStatus);

  }catch(err){

    res.status(500).json({msg:"Server error"});

  }

};