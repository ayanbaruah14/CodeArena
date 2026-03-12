import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import API from "../../api/api";

function ProblemPage(){

  const {contestId,problemId} = useParams();

  const [problem,setProblem] = useState(null);

  const [submissionId,setSubmissionId] = useState(null);

  const [code,setCode] = useState("");

  const [language,setLanguage] = useState("cpp");

  const [result,setResult] = useState("");



  // Load problem
  useEffect(()=>{

    API.get(`/problems/${problemId}`)
      .then(res=>setProblem(res.data))

  },[problemId])



  // Submit Code
  const submitCode = async ()=>{

    try{

      const res = await API.post("/submissions",{
        problemId,
        contestId,
        language,
        code
      })

      const id = res.data.submissionId;

      setSubmissionId(id);

      setResult("In queue")

    }catch(err){

      console.log(err);

      setResult("Submission failed")

    }

  }



  // Poll submission result
  useEffect(()=>{

    if(!submissionId) return;

    const interval = setInterval(async ()=>{

      try{

        const res = await API.get(`/submissions/${submissionId}`);

        const status = res.data.status;

        setResult(status);

        if(status !== "In queue"){
          clearInterval(interval);
        }

      }catch(err){
        console.log(err);
      }

    },2000);

    return ()=>clearInterval(interval);

  },[submissionId])



  if(!problem) return <div className="p-10">Loading...</div>



  return(

    <div className="min-h-screen bg-gray-100">

      <Navbar/>

      <div className="p-10 grid grid-cols-2 gap-6">

        {/* Problem Statement */}

        <div className="bg-white p-6 shadow rounded">

          <h1 className="text-2xl font-bold mb-4">
            {problem.title}
          </h1>

          <p className="text-gray-700 mb-6">
            {problem.description}
          </p>

        </div>



        {/* Code Editor */}

        <div className="bg-white p-6 shadow rounded">

          <div className="flex justify-between mb-4">

            <h2 className="text-xl font-semibold">
              Code Editor
            </h2>

            <select
              value={language}
              onChange={(e)=>setLanguage(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>

          </div>


          <textarea
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            className="w-full h-80 border p-4 font-mono rounded"
            placeholder="Write your code here..."
          />


          <button
            onClick={submitCode}
            className="bg-green-600 text-white px-4 py-2 mt-4 rounded hover:bg-green-700"
          >
            Submit Code
          </button>


          {result && (

            <div className="mt-4 p-3 bg-gray-200 rounded font-semibold">
              {result}
            </div>

          )}

        </div>

      </div>

    </div>

  )

}

export default ProblemPage;