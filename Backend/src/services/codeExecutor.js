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

    const command = `docker run --rm --memory=128m --cpus=0.5 -v ${process.cwd()}/temp:/app -w /app cpp-judge bash -c "g++ solution.cpp -o solution 2> compile_error.txt && timeout 2s ./solution < input.txt"`;


    exec(command, (err, stdout, stderr) => {

      // detect compilation error
      if (fs.existsSync(compileErrorPath)) {

        const compileError = fs.readFileSync(compileErrorPath, "utf8");

        if (compileError.length > 0) {
          return reject("Compilation Error");
        }

      }

      if (err) {

        // timeout returns exit code 124
        if (err.code === 124) {
          return reject("Time Limit Exceeded");
        }

        return reject("Runtime Error");
      }

      resolve(stdout);

    });

  });
};

export default runCode;