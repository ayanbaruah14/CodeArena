import { useEffect,useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function ContestPage(){

  const {contestId} = useParams();

  const [contest,setContest] = useState(null);

  const navigate = useNavigate();

  useEffect(()=>{

    API.get(`/contests/${contestId}`)
      .then(res=>setContest(res.data))

  },[contestId])

  if(!contest) return <div>Loading...</div>

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          {contest.title}
        </h1>

        {contest.problems.map((p,index)=>{

          const letter = String.fromCharCode(65 + index)

          return(

            <div
              key={p._id}
              className="border p-4 mb-3 cursor-pointer hover:bg-gray-100"
              onClick={()=>navigate(`/contest/${contestId}/problem/${p._id}`)}
            >

              <b>{letter}</b> — {p.title}

            </div>

          )

        })}

      </div>

    </div>

  )

}

export default ContestPage;