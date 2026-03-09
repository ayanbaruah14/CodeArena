import submissionQueue from "../queue/submissionQueue.js";

export const submitCode = async(req,res)=>{

  const {code,language,problemId} = req.body;

  await submissionQueue.add("execute",{
    code,
    language,
    problemId,
    userId:req.user.id
  });

  res.json({
    message:"Submission queued"
  });

};