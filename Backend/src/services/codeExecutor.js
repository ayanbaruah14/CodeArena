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

    fs.writeFileSync(codePath, code);
    fs.writeFileSync(inputPath, input);

    const command = `docker run --rm -v ${process.cwd()}/temp:/app -w /app cpp-judge bash -c "g++ solution.cpp -o solution && ./solution < input.txt"`;


    exec(command, (err, stdout, stderr) => {

      if (stderr) {
        console.log("stderr:", stderr);
      }

      if (err) {
        return reject(err);
      }

      resolve(stdout);

    });

  });
};

export default runCode;