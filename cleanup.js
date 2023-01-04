const core = require('@actions/core');
const github = require('@actions/github');

try {
    const context = JSON.stringify(github.context, undefined, 2)
    console.log(`The post event context: ${context}`);
} catch (error) {
    core.setFailed(error.message);
}