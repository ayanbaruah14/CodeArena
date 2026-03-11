import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";

function StudentDashboard(){

  const navigate = useNavigate();

  return(

    <div className="min-h-screen bg-gray-100">

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-8">
          Student Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Contests */}

          <div
            className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg transition"
            onClick={()=>navigate("/contests")}
          >

            <h2 className="text-xl font-semibold mb-2">
              Contests
            </h2>

            <p className="text-gray-600">
              Enter live contests and solve problems.
            </p>

          </div>

          {/* Leaderboard */}

          <div
            className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg transition"
            onClick={()=>navigate("/contest")}
          >

            <h2 className="text-xl font-semibold mb-2">
              Leaderboard
            </h2>

            <p className="text-gray-600">
              View contest rankings and scores.
            </p>

          </div>

          {/* Submissions */}

          <div
            className="bg-white p-6 rounded shadow cursor-pointer hover:shadow-lg transition"
          >

            <h2 className="text-xl font-semibold mb-2">
              My Submissions
            </h2>

            <p className="text-gray-600">
              Track your submission history.
            </p>

          </div>

        </div>

      </div>

    </div>

  )

}

export default StudentDashboard;