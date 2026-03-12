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
      "In queue",
      "Accepted",
      "Wrong Answer",
      "Time Limit Exceeded",
      "Runtime Error",
      "Compilation Error"
    ],
    default:"In queue"
  }

},{timestamps:true});

export default mongoose.model("Submission",SubmissionSchema);