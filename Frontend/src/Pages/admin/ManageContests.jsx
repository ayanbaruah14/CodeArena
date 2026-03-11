import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function ManageContests(){

  const [contests,setContests] = useState([]);

  useEffect(()=>{

    API.get("/contests")
      .then(res=>setContests(res.data))

  },[])

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Manage Contests
        </h1>

        {contests.map(c=>(
          <div key={c._id} className="p-4 border mb-3">
            {c.name}
          </div>
        ))}

      </div>

    </div>

  )

}

export default ManageContests;