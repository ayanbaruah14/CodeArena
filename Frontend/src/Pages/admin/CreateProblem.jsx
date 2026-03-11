import { useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function CreateProblem(){

  const [title,setTitle] = useState("");
  const [description,setDescription] = useState("");

  const handleSubmit = async (e)=>{

    e.preventDefault();

    try{

      await API.post("/problems",{
        title,
        description
      });

      alert("Problem Created");

    }catch(err){
console.log(err);
      alert("Error creating problem");

    }

  };

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Create Problem
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-96">

          <input
            type="text"
            placeholder="Problem Title"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            className="border p-2 rounded"
          />

          <textarea
            placeholder="Problem Description"
            value={description}
            onChange={(e)=>setDescription(e.target.value)}
            className="border p-2 rounded"
          />

          <button className="bg-blue-600 text-white p-2 rounded">
            Create
          </button>

        </form>

      </div>

    </div>

  )

}

export default CreateProblem;