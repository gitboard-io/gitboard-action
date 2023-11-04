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
    const environment = core.getInput('environment') ?? 'prod';
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
    const steps = await getSteps(token, true);

    await Promise.all(
      usernames.map(async (username, index) => {
        const key = keys[index];
        const response = await new GitboardApiSdk(
          authenticatedAxios(environment === 'dev' ? 'https://api.dev.gitboard.io' : `https://api.gitboard.io`, key),
        ).upsertJob(
          { username },
          getUpsertJobBody(username, 'pending', steps, ''),
        );
        core.debug(
          `Pre gitboard-action upsert job response status code: ${response.statusCode}`,
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
