import { useParams,useEffect,useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function Leaderboard(){

  const {contestId} = useParams();

  const [leaders,setLeaders] = useState([]);

  useEffect(()=>{

    API.get(`/leaderboard/${contestId}`)
      .then(res=>setLeaders(res.data))

  },[contestId])

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Leaderboard
        </h1>

        {leaders.map((l,i)=>(
          <div key={i} className="border p-4 mb-2 flex justify-between">
            <span>{l.username}</span>
            <span>{l.score}</span>
          </div>
        ))}

      </div>

    </div>

  )

}

export default Leaderboard;