import mongoose from "mongoose";

const ContestSchema = new mongoose.Schema({

  title:String,

  startTime:Date,

  endTime:Date,

  status:{
    type:String,
    enum:["upcoming","live","ended"],
    default:"upcoming"
  },

  problems:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"Problem"
    }
  ]

},{timestamps:true});

export default mongoose.model("Contest",ContestSchema);