import Contest from "../models/Contest.js";

export const createContest = async(req,res)=>{

  try{

    const contest = await Contest.create(req.body);

    res.status(201).json(contest);

  }catch(err){

    res.status(500).json({error:err.message});

  }

};

export const getContests = async(req,res)=>{

  const contests = await Contest.find().populate("problems");

  res.json(contests);

};

export const updateContestStatus = async(req,res)=>{

  const {status} = req.body;

  const contest = await Contest.findByIdAndUpdate(
    req.params.id,
    {status},
    {new:true}
  );

  res.json(contest);

};