import { useState } from "react";
import API from "../../api/api";
import { useNavigate, Link } from "react-router-dom";

function Register() {

  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [errors,setErrors] = useState({});

  const navigate = useNavigate();

  const validate = () => {

    const newErrors = {};

    if(!username.trim()){
      newErrors.username = "Username is required";
    }

    if(!email){
      newErrors.email = "Email is required";
    }
    else if(!/\S+@\S+\.\S+/.test(email)){
      newErrors.email = "Invalid email format";
    }

    if(!password){
      newErrors.password = "Password is required";
    }
    else if(password.length < 6){
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if(!validate()) return;

    try{

      await API.post("/auth/register",{
        username,
        email,
        password
      });

      alert("Registration Successful");
      navigate("/login");

    }catch(err){
console.log(err);
      alert("Registration Failed");

    }

  };

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >

        <h2 className="text-2xl font-bold text-center mb-6">
          Register
        </h2>

        {/* Username */}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {errors.username && (
          <p className="text-red-500 text-sm mb-3">
            {errors.username}
          </p>
        )}

        {/* Email */}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {errors.email && (
          <p className="text-red-500 text-sm mb-3">
            {errors.email}
          </p>
        )}

        {/* Password */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {errors.password && (
          <p className="text-red-500 text-sm mb-4">
            {errors.password}
          </p>
        )}

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>

      </form>

    </div>

  );

}

export default Register;