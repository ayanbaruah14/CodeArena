import { exec } from "child_process";
import fs from "fs";
import path from "path";

const languageConfig = {
  cpp: {
    file: "solution.cpp",
    command: `g++ solution.cpp -o solution 2> compile_error.txt && timeout --kill-after=1s 2s ./solution < input.txt`
  },
  python: {
    file: "solution.py",
    command: `timeout --kill-after=1s 2s python3 solution.py < input.txt`
  },
javascript: {
  file: "solution.js",
  command: `timeout --kill-after=1s 2s node solution.js < input.txt; exit 0`
},
  java: {
    file: "Solution.java",
    command: `javac Solution.java 2> compile_error.txt && timeout --kill-after=1s 2s java Solution < input.txt`
  }
};

const runCode = (code, input, language, submissionId) => {
  return new Promise((resolve, reject) => {

    const dir = `./temp/${submissionId}`;

    // create submission directory
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const lang = languageConfig[language];

    if (!lang) {
      return reject("Unsupported Language");
    }

    const codePath = path.join(dir, lang.file);
    const inputPath = path.join(dir, "input.txt");
    const compileErrorPath = path.join(dir, "compile_error.txt");

    fs.writeFileSync(codePath, code);
    fs.writeFileSync(inputPath, input);

    const command = `docker run --rm \
--network none \  
--memory=128m \
--cpus=0.5 \
--pids-limit 64 \
-v ${process.cwd()}/temp/${submissionId}:/app \
-w /app cpp-judge bash -c "${lang.command}"`;

    const start = Date.now();

    exec(
      command,
      { maxBuffer: 10 * 1024 * 1024 }, // allow large outputs
      (err, stdout, stderr) => {

        const end = Date.now();
        const executionTime = (end - start) / 1000;

        // check compilation errors
        if (fs.existsSync(compileErrorPath)) {
          const compileError = fs.readFileSync(compileErrorPath, "utf8");

          if (compileError.length > 0) {
            cleanTemp(dir);
            return reject("Compilation Error");
          }
        }

        if (err) {

          // timeout error
          if (err.code === 124) {
            cleanTemp(dir);
            return reject("Time Limit Exceeded");
          }

          cleanTemp(dir);
          return reject("Runtime Error");
        }

        cleanTemp(dir);

        resolve({
          output: stdout,
          time: executionTime
        });
      }
    );

  });
};

function cleanTemp(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.log("Temp cleanup error:", err);
  }
}

export default runCode;