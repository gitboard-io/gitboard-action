import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitboardApiSdk } from '@codeaim/gitboard-api';
import { authenticatedAxios, getSteps, getUpsertJobBody } from './shared';

async function run() {
  try {
    core.debug(
      `Running pre gitboard-action with context: ${JSON.stringify(
        github.context,
      )}`,
    );
    const usernames = core
      .getInput('username')
      .split(',')
      .map((x) => x.trim());
    core.debug(
      `Pre gitboard-action input usernames: ${JSON.stringify(usernames)}`,
    );
    const keys = core
      .getInput('key')
      .split(',')
      .map((x) => x.trim());

    const token = core.getInput('token');
    const steps = await getSteps(token);

    await Promise.all(
      usernames.map(async (username, index) => {
        const key = keys[index];
        const response = await new GitboardApiSdk(
          authenticatedAxios(`https://api.gitboard.io`, key),
        ).upsertJob(
          { username },
          getUpsertJobBody(username, 'pending', steps, undefined),
        );
        core.debug(
          `Pre gitboard-action upsert job response status code: ${response.statusCode}`,
        );
        switch (response.statusCode) {
          case 200: {
            console.log(
              `View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard`,
            );
            break;
          }
          case 401:
          case 403: {
            const { message } = response.result as Error;
            console.log(message);
            break;
          }
        }
      }),
    );
  } catch (error) {
    console.log('Issue reporting build status to GitBoard.io');
    console.log('GitBoard.io error message:', error);
  }
}

run();
