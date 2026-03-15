import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

  username:{
    type:String,
    required:true
  },

  email:{
    type:String,
    required:true,
    unique:true
  },

  password:{
    type:String,
    required:true
  },

  role:{
    type:String,
    enum:["admin","student"],
    default:"student"
  },

  rating:{
    type:Number,
    default:1000
  }

},{timestamps:true});

export default mongoose.model("User",UserSchema);