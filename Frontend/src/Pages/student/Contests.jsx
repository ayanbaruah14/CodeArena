import { useEffect,useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

function Contests(){

  const [contests,setContests] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{

    API.get("/contests")
      .then(res=>setContests(res.data))

  },[])

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Contests
        </h1>

        {contests.map(c=>(
          <div
            key={c._id}
            className="border p-4 mb-3 cursor-pointer hover:bg-gray-100"
            onClick={()=>navigate(`/contest/${c._id}`)}
          >
            {c.name}
          </div>
        ))}

      </div>

    </div>

  )

}

export default Contests;