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
    problemId,
    language
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

export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission
      .findById(req.params.submissionId)
      .populate("problem", "title");

    if (!submission)
      return res.status(404).json({ msg: "Submission not found" });


    if (submission.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Access denied" });

    res.json(submission);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
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