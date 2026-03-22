import mongoose from "mongoose";

const ProblemSchema = new mongoose.Schema({

  title:{
    type:String,
    required:true
  },

  description:{
    type:String,
    required:true
  },

  difficulty:{
    type:String,
    enum:["easy","medium","hard"],
    default:"easy"
  },
  points:{
    type:Number,
    required:true
  },
  timeLimit:{
    type:Number,
    default:2
  },

  memoryLimit:{
    type:Number,
    default:256
  },

  testCases:[
    {
      input:String,
      output:String
    }
  ]

},{timestamps:true});

export default mongoose.model("Problem",ProblemSchema);

