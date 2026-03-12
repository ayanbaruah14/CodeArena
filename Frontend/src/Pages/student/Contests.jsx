import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";
import { useNavigate } from "react-router-dom";

function Contests(){

  const [contests,setContests] = useState([]);
  const [loading,setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(()=>{

    const fetchContests = async () => {
      try{
        const res = await API.get("/contests");
        console.log(res.data);
        setContests(res.data);
      }
      catch(err){
        console.error("Error fetching contests:",err);
      }
      finally{
        setLoading(false);
      }
    }

    fetchContests();

  },[])

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Contests
        </h1>

        {loading && <p>Loading contests...</p>}

        {!loading && contests.length === 0 && (
          <p>No contests available</p>
        )}

        {contests.map(c=>(

          <div
            key={c._id}
            className="border p-4 mb-3 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            onClick={()=>navigate(`/contest/${c._id}`)}
          >

            <h2 className="text-xl font-semibold">
              {c.title}
            </h2>

            {c.startTime && (
              <p className="text-sm text-gray-600">
                Start: {new Date(c.startTime).toLocaleString()}
              </p>
            )}

            {c.endTime && (
              <p className="text-sm text-gray-600">
                End: {new Date(c.endTime).toLocaleString()}
              </p>
            )}

            {c.status && (
              <p className="text-sm mt-1">
                Status: <span className="font-medium">{c.status}</span>
              </p>
            )}

          </div>

        ))}

      </div>

    </div>

  )

}

export default Contests;