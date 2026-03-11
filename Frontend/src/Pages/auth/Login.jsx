import { useState } from "react";
import API from "../../api/api";
import { useNavigate, Link } from "react-router-dom";

const Login=()=>{

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [errors,setErrors] = useState({});

  const navigate = useNavigate();

  const validate = () => {

    const newErrors = {};

    if(!email){
      newErrors.email = "Email is required";
    }

    if(!password){
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleSubmit = async (e)=>{

    e.preventDefault();

    if(!validate()) return;

    try{

      const res = await API.post("/auth/login",{
        email,
        password
      });

      const token = res.data.token;

      localStorage.setItem("token",token);

      alert("Login Successful");

      navigate("/dashboard");

    }catch(err){
console.log(err);
      alert("Invalid credentials");

    }

  };

  return(

    <div className="flex items-center justify-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >

        <h2 className="text-2xl font-bold text-center mb-6">
          Login
        </h2>

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
          Login
        </button>

        <p className="text-center text-sm mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>

      </form>

    </div>

  );

}

export default Login;