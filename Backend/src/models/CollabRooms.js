import mongoose from "mongoose";

const CollabRoomSchema = new mongoose.Schema({
  roomId:   { type: String, required: true, unique: true, index: true },
  code:     { type: String, default: "" },
  language: { type: String, default: "cpp", enum: ["cpp", "python", "javascript", "java"] },

  collabProblem: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     "Problem",
    default: null,
  },

  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("CollabRoom", CollabRoomSchema);