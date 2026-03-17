import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = async (req,res)=>{

  const {username,email,password} = req.body;

  const hashed = await bcrypt.hash(password,10);

  const user = await User.create({
    username,
    email,
    password:hashed
  });

  res.json(user);

};

export const login = async (req,res)=>{

  const {email,password} = req.body;

  const user = await User.findOne({email});

  if(!user) return res.status(404).json({msg:"User not found"});

  const valid = await bcrypt.compare(password,user.password);

  if(!valid) return res.status(401).json({msg:"Invalid password"});

  const token = jwt.sign(
    {id:user._id,role:user.role},
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    role:user.role
  });


};