import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitboardApiSdk } from '@codeaim/gitboard-api';
import {
  authenticatedAxios,
  getLogUrl,
  getSteps,
  getUpsertJobBody,
} from './shared';

async function run() {
  try {
    core.debug(
      `Running post gitboard-action with context: ${JSON.stringify(
        github.context,
      )}`,
    );
    const usernames = core
      .getInput('username')
      .split(',')
      .map((x) => x.trim());
    core.debug(
      `Post gitboard-action input usernames: ${JSON.stringify(usernames)}`,
    );
    const keys = core
      .getInput('key')
      .split(',')
      .map((x) => x.trim());
    const status = core.getInput('status');
    core.debug(`Post gitboard-action input status: ${JSON.stringify(status)}`);

    const token = core.getInput('token');
    const steps = await getSteps(token);
    const logUrl = await getLogUrl(token);

    await Promise.all(
      usernames.map(async (username, index) => {
        const key = keys[index];
        const response = await new GitboardApiSdk(
          authenticatedAxios(`https://api.gitboard.io`, key),
        ).upsertJob(
          { username },
          getUpsertJobBody(username, status, steps, logUrl),
        );
        core.debug(
          `Post gitboard-action upsert job response status code: ${response.statusCode}`,
        );
        switch (response.statusCode) {
          case 200: {
            core.info(
              `View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard`,
            );
            break;
          }
          case 401:
          case 403: {
            const { message } = response.result as Error;
            core.error(`GitBoard.io error message: ${message}`);
            break;
          }
        }
      }),
    );
  } catch (error) {
    core.info('Issue reporting build status to GitBoard.io');
    core.error(`GitBoard.io error message: ${error.message}`);
  }
}

run();
