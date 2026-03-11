import Navbar from "../../components/Navbar";

function AdminDashboard(){

  return(

    <div>

      <Navbar/>

      <div className="p-10">

        <h1 className="text-3xl font-bold mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white p-6 shadow rounded">
            Create Problems
          </div>

          <div className="bg-white p-6 shadow rounded">
            Create Contests
          </div>

          <div className="bg-white p-6 shadow rounded">
            Manage Contests
          </div>

        </div>

      </div>

    </div>

  );

}

export default AdminDashboard;