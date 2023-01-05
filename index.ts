import core from "@actions/core";
import github from "@actions/github";

try {
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const context = JSON.stringify(github.context, undefined, 2);
  console.log(`The event context: ${context}`);
} catch (error) {
  core.setFailed(error.message);
}
