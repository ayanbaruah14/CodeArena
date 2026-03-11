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

    // write code and input
    fs.writeFileSync(codePath, code);
    fs.writeFileSync(inputPath, input);

    const command = `docker run --rm -v ${process.cwd()}/temp:/app -w /app cpp-judge bash -c "g++ solution.cpp -o solution 2> compile_error.txt && timeout 2s ./solution < input.txt"`;


    exec(command, (err, stdout, stderr) => {

      // check compilation errors
      if (fs.existsSync(compileErrorPath)) {

        const compileError = fs.readFileSync(compileErrorPath, "utf8");

        if (compileError.length > 0) {
          return reject("Compilation Error");
        }

      }

      // detect timeout
      if (err) {

        if (err.signal === "SIGTERM" || err.killed) {
          return reject("Time Limit Exceeded");
        }

        return reject(err);
      }

      resolve(stdout);

    });

  });
};

export default runCode;