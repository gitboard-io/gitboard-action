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
    const token = core.getInput('token');
    if (token) {
      core.debug(
        `Pre gitboard-action input optional temporary GITHUB_TOKEN token: ${token}`,
      );
      const octokit = github.getOctokit(token);
      const jobsResponse = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs', {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        run_id: github.context.runId,
        attempt_number: github.context.runNumber,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs',
        {
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          job_id: jobsResponse.data.jobs[0].id,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );
      core.debug(`Logs response headers: ${JSON.stringify(response.headers)}`);
      core.debug(`Logs response: ${JSON.stringify(response)}`);
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
