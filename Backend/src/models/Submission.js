import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({

  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  problem:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Problem"
  },

  contest:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Contest"
  },

  language:String,

  code:String,

  status:{
    type:String,
    enum:[
      "Pending",
      "Accepted",
      "Wrong Answer",
      "TLE",
      "Runtime Error",
      "Compilation Error"
    ],
    default:"Pending"
  }

},{timestamps:true});

export default mongoose.model("Submission",SubmissionSchema);