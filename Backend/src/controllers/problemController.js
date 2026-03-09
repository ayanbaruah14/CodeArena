import Problem from "../models/Problem.js";

export const createProblem = async (req,res)=>{

  try{

    const problem = await Problem.create(req.body);

    res.status(201).json(problem);

  }catch(err){

    res.status(500).json({error:err.message});

  }

};

export const getProblems = async (req,res)=>{

  const problems = await Problem.find();

  res.json(problems);

};

export const getProblemById = async (req,res)=>{

  const problem = await Problem.findById(req.params.id);

  res.json(problem);

};