import * as core from '@actions/core';
import * as github from '@actions/github';
import { Caller, GitboardApiSdk } from '@codeaim/gitboard-api';
import axios from 'axios';
import { Context } from '@actions/github/lib/context';

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

    let steps = undefined;
    let logUrl = undefined;
    const token = core.getInput('token');
    if (token) {
      const runRequest = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        run_id: github.context.runId,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      };
      const octokit = github.getOctokit(token);
      const runResponse = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/runs/{run_id}',
        runRequest,
      );
      const attemptRequest = {
        ...runRequest,
        attempt_number: runResponse.data.run_attempt,
      };
      const jobsResponse = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs',
        attemptRequest,
      );
      const logsResponse = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs',
        attemptRequest,
      );
      steps = jobsResponse.data.jobs[0].steps.map((step) => ({
        ...step,
        started: step['started_at'],
        completed: step.name.startsWith('Pre Run gitboard-io/gitboard-action')
          ? new Date().toISOString()
          : step['completed_at'],
        status: step.name.startsWith('Pre Run gitboard-io/gitboard-action')
          ? 'completed'
          : step.status,
        conclusion: step.name.startsWith('Pre Run gitboard-io/gitboard-action')
          ? 'success'
          : step.conclusion,
      }));
      logUrl = logsResponse.url;
      core.debug(`Pre gitboard-action job steps: ${JSON.stringify(steps)}`);
      core.debug(`Pre gitboard-action job log url: ${logUrl}`);
    }

    await Promise.all(
      usernames.map(async (username, index) => {
        const key = keys[index];
        const gitboardApiSdk = new GitboardApiSdk(
          authenticatedAxios(`https://api.gitboard.io`, key),
        );
        //Context Example: https://gist.github.com/colbyfayock/1710edb9f47ceda0569844f791403e7e
        const upsertJobBody = {
          username,
          repository: github.context.payload.repository.full_name,
          language: github.context.payload.repository.language,
          workflow: github.context.workflow,
          job: github.context.job,
          runNumber: String(github.context.runNumber),
          runId: String(github.context.runId),
          message: resolveMessage(github.context),
          status: 'pending',
          access: github.context.payload.repository.private
            ? 'private'
            : 'public',
          updated: new Date().toISOString(),
          url: github.context.payload.repository.html_url,
          steps: steps,
          logUrl: logUrl,
        };
        core.debug(
          `Pre gitboard-action upsert job body for ${username}: ${JSON.stringify(
            upsertJobBody,
          )}`,
        );
        const response = await gitboardApiSdk.upsertJob(
          { username },
          upsertJobBody,
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

function resolveMessage(context: Context): string {
  const message =
    context.eventName === 'pull_request'
      ? context.payload['pull_request']?.title
      : context.payload['head_commit']?.message;
  return message ?? 'unknown';
}

function authenticatedAxios(url: string, key: string): Caller {
  return {
    call: async (
      method: any,
      resource: any,
      path: string,
      body: any,
      pathParameters: any,
      queryParameters: any,
      multiQueryParameters: any,
      headers: any,
      config: any,
    ) => {
      const result = await axios(url + path, {
        validateStatus: false,
        method: method,
        data: body,
        params: { ...queryParameters, ...multiQueryParameters },
        headers: {
          ...headers,
          'X-Api-Key': `${key}`,
        },
        transformResponse: [],
        ...config,
      });
      return {
        statusCode: result.status,
        body: result.data,
        headers: result.headers as any,
      };
    },
  };
}

run();
