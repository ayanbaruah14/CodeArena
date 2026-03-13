import { useEffect,useState } from "react";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function Submissions(){

  const [submissions,setSubmissions] = useState([]);

  useEffect(()=>{

    API.get("/submissions/user")
      .then(res=>setSubmissions(res.data))

  },[])

  return(

    <div className="min-h-screen bg-gray-100">

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          My Submissions
        </h1>

        <table className="w-full bg-white shadow rounded">

          <thead className="bg-gray-200">

            <tr>

              <th className="p-3">Problem</th>
              <th className="p-3">Status</th>
              <th className="p-3">Language</th>
              <th className="p-3">Time</th>

            </tr>

          </thead>

          <tbody>

            {submissions.map(sub=>(

              <tr key={sub._id} className="text-center border-t">

                <td className="p-3">
                  {sub.problem?.title}
                </td>

                <td className="p-3">
                  {sub.status}
                </td>

                <td className="p-3">
                  {sub.language}
                </td>

                <td className="p-3">
                  {new Date(sub.createdAt).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}

export default Submissions;