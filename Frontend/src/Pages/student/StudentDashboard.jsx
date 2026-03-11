import Navbar from "../../components/Navbar";

function StudentDashboard(){

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Student Dashboard
        </h1>

        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white p-6 shadow rounded">
            View Contests
          </div>

          <div className="bg-white p-6 shadow rounded">
            My Submissions
          </div>

          <div className="bg-white p-6 shadow rounded">
            Leaderboard
          </div>

        </div>

      </div>

    </div>

  );

}

export default StudentDashboard;