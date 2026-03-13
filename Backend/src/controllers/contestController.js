import Contest from "../models/Contest.js";
import Submission from "../models/Submission.js";

/* ---------------- CREATE CONTEST ---------------- */

export const createContest = async (req,res)=>{

  try{

    const contest = await Contest.create(req.body);

    res.status(201).json(contest);

  }catch(err){

    res.status(500).json({error:err.message});

  }

};


/* ---------------- ADD PROBLEM ---------------- */

export const addProblemToContest = async (req,res)=>{

  try{

    const {problemId} = req.body;

    const contest = await Contest.findById(req.params.id);

    if(!contest){
      return res.status(404).json({msg:"Contest not found"});
    }

    contest.problems.push(problemId);

    await contest.save();

    res.json({msg:"Problem added to contest"});

  }catch(err){

    res.status(500).json({msg:"Server error"});

  }

};


/* ---------------- GET ALL CONTESTS ---------------- */

export const getContests = async(req,res)=>{

  const contests = await Contest
    .find()
    .populate({
      path:"problems",
      select:"title points"
    });

  res.json(contests);

};


/* ---------------- GET SINGLE CONTEST ---------------- */

export const getContestById = async (req,res)=>{

  try{

    const contest = await Contest
      .findById(req.params.id)
      .populate({
        path:"problems",
        select:"title points"
      });

    if(!contest){
      return res.status(404).json({msg:"Contest not found"});
    }

    res.json(contest);

  }catch(err){

    res.status(500).json({msg:"Server error"});

  }

};


/* ---------------- LEADERBOARD ---------------- */

export const getLeaderboard = async (req,res)=>{

  try{

    const {contestId} = req.params;

    const contest = await Contest
      .findById(contestId)
      .populate({
        path:"problems",
        select:"title points"
      });

    if(!contest){
      return res.status(404).json({msg:"Contest not found"});
    }

    const submissions = await Submission
      .find({contest:contestId})
      .populate("user","username")
      .sort({createdAt:1});

    const leaderboard = {};

    const wrongPenalty = 50;
    const timePenalty = 2;

    submissions.forEach(sub=>{

      const userId = sub.user._id.toString();
      const problemId = sub.problem.toString();

      /* Initialize user */

      if(!leaderboard[userId]){

        leaderboard[userId] = {
          username:sub.user.username,
          score:0,
          problems:{}
        };

      }

      /* Initialize problem for user */

      if(!leaderboard[userId].problems[problemId]){

        leaderboard[userId].problems[problemId] = {
          wrong:0,
          solved:false,
          score:0
        };

      }

      const prob = leaderboard[userId].problems[problemId];

      /* Ignore submissions after solve */

      if(prob.solved) return;

      if(sub.status === "Accepted"){

        prob.solved = true;

        const problem = contest.problems.find(
          p => p._id.toString() === problemId
        );

        /* Safety check */

        if(!problem) return;

        const minutes = contest.startDate
          ? Math.floor((sub.createdAt - contest.startDate)/60000)
          : 0;

        let gainedScore = problem.points ?? 0;

        gainedScore -= minutes * timePenalty;
        gainedScore -= prob.wrong * wrongPenalty;

        gainedScore = Math.max(gainedScore,0);

        prob.score = gainedScore;

        leaderboard[userId].score += gainedScore;

      }
      else{

        prob.wrong++;

      }

    });

    const result = Object.values(leaderboard)
      .sort((a,b)=>b.score-a.score);

    res.json({
      problems:contest.problems,
      leaderboard:result
    });

  }catch(err){

    console.log(err);

    res.status(500).json({msg:"Server error"});

  }

};


/* ---------------- UPDATE STATUS ---------------- */

export const updateContestStatus = async(req,res)=>{

  const {status} = req.body;

  const contest = await Contest.findByIdAndUpdate(
    req.params.id,
    {status},
    {new:true}
  );

  res.json(contest);

};