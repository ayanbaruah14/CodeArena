import { exec } from "child_process";
import fs from "fs";
import path from "path";

const runCode = (code, input) => {
  return new Promise((resolve, reject) => {

    const dir = "./temp";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    const codePath = path.join(dir, "solution.cpp");
    const inputPath = path.join(dir, "input.txt");
    const compileErrorPath = path.join(dir, "compile_error.txt");

    fs.writeFileSync(codePath, code);
    fs.writeFileSync(inputPath, input);

    const command = `docker run --rm --memory=128m --cpus=0.5 -v ${process.cwd()}/temp:/app -w /app cpp-judge bash -c "g++ solution.cpp -o solution 2> compile_error.txt && timeout 2s ./solution < input.txt"`;

    const start = Date.now();

    exec(command, (err, stdout, stderr) => {

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

    });

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