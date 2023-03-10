import * as core from '@actions/core';
import * as github from '@actions/github';
import { Caller, GitboardApiSdk } from '@codeaim/gitboard-api';
import axios from 'axios';

async function run() {
  try {
    const usernames = core
      .getInput('username')
      .split(',')
      .map((x) => x.trim());
    const keys = core
      .getInput('key')
      .split(',')
      .map((x) => x.trim());
    const status = core.getInput('status');
    console.log(`GitHub context: ${JSON.stringify(github.context)}`);
    await Promise.all(
      usernames.map(async (username, index) => {
        const key = keys[index];
        const gitboardApiSdk = new GitboardApiSdk(
          authenticatedAxios(`https://api.gitboard.io`, key),
        );
        await gitboardApiSdk.upsertJob(
          { username },
          {
            username,
            repository: github.context.payload.repository.full_name,
            workflow: github.context.workflow,
            job: github.context.job,
            runNumber: String(github.context.runNumber),
            runId: String(github.context.runId),
            message: github.context.payload['head_commit'].message,
            status: status,
            access: github.context.payload.repository.private
              ? 'private'
              : 'public',
            updated: new Date().toISOString(),
            url: github.context.payload.repository.html_url,
          },
        );
        console.log(`GitHub context: ${JSON.stringify(github.context)}`);
        console.log(
          `View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard`,
        );
      }),
    );
  } catch (error) {
    core.setFailed(error.message);
  }
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
        method: method as any,
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
