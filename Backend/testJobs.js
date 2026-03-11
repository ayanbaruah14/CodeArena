import submissionQueue from "./src/queue/submissionQueue.js";

await submissionQueue.add("execute", {
  submissionId: "test1",
  problemId: "testProblem",
  code: `
#include <iostream>
using namespace std;

int main(){
    int a,b;
    cin >> a >> b;
    cout << a + b;
}
`
});

console.log("Test job added to queue");