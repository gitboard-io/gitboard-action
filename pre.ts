import * as core from '@actions/core';
import * as github from '@actions/github';
import { Caller, GitboardApiSdk } from '@codeaim/gitboard-api';
import axios from 'axios';
import { Context } from '@actions/github/lib/context';

async function run() {
  try {
    console.debug('Running pre gitboard-action with context', github.context);
    const usernames = core
      .getInput('username')
      .split(',')
      .map((x) => x.trim());
    console.debug('Pre gitboard-action input usernames', usernames);
    const keys = core
      .getInput('key')
      .split(',')
      .map((x) => x.trim());
    await Promise.all(
      usernames.map(async (username, index) => {
        const key = keys[index];
        const gitboardApiSdk = new GitboardApiSdk(
          authenticatedAxios(`https://api.gitboard.io`, key),
        );
        const upsertJobBody = {
          username,
          repository: github.context.payload.repository.full_name,
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
        console.debug(
          'Pre gitboard-action upsert job body',
          username,
          upsertJobBody,
        );
        const response = await gitboardApiSdk.upsertJob(
          { username },
          upsertJobBody,
        );
        console.debug(
          'Pre gitboard-action upsert job response status code',
          response.statusCode,
        );
        switch (response.statusCode) {
          case 200: {
            console.log(
              `View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard`,
            );
            break;
          }
          case 401: {
            const { message } = response.result as Error;
            console.log(message);
            break;
          }
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
    console.debug('GitBoard.io error message:', error);
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
