import { useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function CreateContest(){

  const [name,setName] = useState("");

  const handleSubmit = async (e)=>{

    e.preventDefault();

    try{

      await API.post("/contests",{
        name
      });

      alert("Contest Created");

    }catch(err){
console.log(err);
      alert("Error");

    }

  };

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Create Contest
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-96">

          <input
            type="text"
            placeholder="Contest Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="border p-2 rounded"
          />

          <button className="bg-blue-600 text-white p-2 rounded">
            Create Contest
          </button>

        </form>

      </div>

    </div>

  )

}

export default CreateContest;