import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({

  roomId: {
    type: String,
    unique: true,
    required: true
  },

  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  users: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      username: String
    }
  ],

 
  status: {
    type: String,
    enum: ["live", "ended"],
    default: "live"
  },


  messages: [
    {
      userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
      message:  String,
      system:   { type: Boolean, default: false },
      sentAt:   { type: Date, default: Date.now },
    }
  ],

  contest: {
    active:       { type: Boolean, default: false },
    status:       { type: String, enum: ["none","waiting","active","ended"], default: "none" },
    problems:     [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],

    minPoints:    { type: Number, default: 800  },
    maxPoints:    { type: Number, default: 1600 },

    problemCount: { type: Number, default: 5 },
    startTime:    Date,
    endTime:      Date,
    duration:     Number,
    scores: [{
      userId:         { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username:       String,
      solved:         { type: Number, default: 0 },
      score:          { type: Number, default: 0 },
      solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
    }],
  },

}, { timestamps: true });

export default mongoose.model("Room", RoomSchema);