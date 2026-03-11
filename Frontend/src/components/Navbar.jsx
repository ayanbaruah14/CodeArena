import { Link } from "react-router-dom";
import { logout } from "../utils/auth";

function Navbar() {

  const role = localStorage.getItem("role");

  return (

    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between">

      <h1 className="text-xl font-bold">
        CodeArena
      </h1>

      <div className="flex gap-6">

        {role === "admin" && (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/create-problem">Create Problem</Link>
            <Link to="/create-contest">Create Contest</Link>
          </>
        )}

        {role === "student" && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/contests">Contests</Link>
            <Link to="/leaderboard">Leaderboard</Link>
          </>
        )}

        <button onClick={logout}>
          Logout
        </button>

      </div>

    </nav>

  );

}

export default Navbar;