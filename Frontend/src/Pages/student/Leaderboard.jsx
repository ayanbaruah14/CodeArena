import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function Leaderboard(){

  const {contestId} = useParams();

  const [leaders,setLeaders] = useState([]);
  const [problems,setProblems] = useState([]);

  useEffect(()=>{

    API.get(`/contests/leaderboard/${contestId}`)
      .then(res=>{
        setLeaders(res.data.leaderboard);
        setProblems(res.data.problems);
      });

  },[contestId]);
console.log(leaders);

  return(
    
    <div className="min-h-screen bg-gray-100">

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Leaderboard
        </h1>

        <table className="w-full bg-white shadow rounded">

          <thead className="bg-gray-200">

            <tr>

              <th className="p-3">Rank</th>
              <th className="p-3">User</th>

              {problems.map((p,i)=>{

                const letter = String.fromCharCode(65+i);

                return(
                  <th key={p._id} className="p-3">
                    {letter}
                  </th>
                );

              })}

              <th className="p-3">Score</th>

            </tr>

          </thead>

          <tbody>
            {leaders.map((user,index)=>(

              <tr key={index} className="text-center border-t">

                <td className="p-3">{index+1}</td>
                <td className="p-3">{user.username}</td>

                {problems.map((p)=>{

                  const prob = user.problems?.[p._id];

                  if(!prob) return <td key={p._id}>.</td>;

                  if(prob.solved)
                    return <td key={p._id}>+{prob.score ?? 0}</td>;

                  return <td key={p._id}>-{prob.wrong}</td>;

                })}

                <td className="p-3 font-bold">
                  {user.score}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}

export default Leaderboard;