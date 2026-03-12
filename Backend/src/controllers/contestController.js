import Contest from "../models/Contest.js";

export const createContest = async(req,res)=>{

  try{

    const contest = await Contest.create(req.body);

    res.status(201).json(contest);

  }catch(err){

    res.status(500).json({error:err.message});

  }

};

export const addProblemToContest = async (req,res)=>{

  try{

    const {problemId} = req.body;

    const contest = await Contest.findById(req.params.id);

    contest.problems.push(problemId);

    await contest.save();

    res.json({msg:"Problem added to contest"});

  }catch(err){

    res.status(500).json({msg:"Server error"});

  }

};

export const getContests = async(req,res)=>{

  const contests = await Contest.find().populate("problems");

  res.json(contests);

};

export const getContestById = async (req,res)=>{

  try{

    const contest = await Contest
      .findById(req.params.id)
      .populate("problems");

    if(!contest){
      return res.status(404).json({msg:"Contest not found"});
    }

    res.json(contest);

  }catch(err){

    res.status(500).json({msg:"Server error"});

  }

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