import { exec } from "child_process";
import fs from "fs";

const runCode = (code, input) => {

  return new Promise((resolve, reject) => {

    fs.writeFileSync("solution.cpp", code);

    exec("g++ solution.cpp -o solution", (err) => {

      if (err) return reject("Compilation Error");

      exec(`echo "${input}" | ./solution`, (err, stdout) => {

        if (err) return reject("Runtime Error");

        resolve(stdout);

      });

    });

  });

};

export default runCode;