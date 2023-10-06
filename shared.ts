import { Caller } from '@codeaim/gitboard-api';
import axios from 'axios';
import { Context } from '@actions/github/lib/context';
import * as github from '@actions/github';
import * as core from '@actions/core';
import { GitHub } from '@actions/github/lib/utils';

export function authenticatedAxios(url: string, key: string): Caller {
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

export function resolveMessage(context: Context): string {
  const message =
    context.eventName === 'pull_request'
      ? context.payload['pull_request']?.title
      : context.payload['head_commit']?.message;
  return message ?? 'unknown';
}

export async function getSteps(token: string): Promise<any[] | undefined> {
  if (token) {
    const octokit = github.getOctokit(token);
    await getWorkflowRun(octokit);
    const job = await getJob(octokit);
    const steps = job.steps.map((step) => ({
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
    core.debug(`gitboard-action job steps: ${JSON.stringify(steps)}`);
    return steps;
  }
  return undefined;
}

export async function getWorkflowRun(octokit: InstanceType<typeof GitHub>) {
  try {
    const request = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      run_id: github.context.runId,
    };
    core.debug(
      `gitboard-action getWorkflowRun request: ${JSON.stringify(request)}`,
    );
    const workflowResponse = await octokit.rest.actions.getWorkflowRun(request);
    core.debug(
      `gitboard-action getWorkflowRun response: ${JSON.stringify(
        workflowResponse,
      )}`,
    );
    return workflowResponse.data;
  } catch (error) {
    core.error(`GitHub getWorkflowRun error message: ${JSON.stringify(error)}`);
  }
}

export async function getJob(octokit: InstanceType<typeof GitHub>) {
  try {
    const request = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      run_id: github.context.runId,
    };
    core.debug(
      `gitboard-action listJobsForWorkflowRun request: ${JSON.stringify(
        request,
      )}`,
    );
    const listJobsResponse = await octokit.rest.actions.listJobsForWorkflowRun(
      request,
    );
    core.debug(
      `gitboard-action getWorkflowRun response: ${JSON.stringify(
        listJobsResponse,
      )}`,
    );
    const job = listJobsResponse.data.jobs[0];
    core.debug(`gitboard-action job: ${JSON.stringify(job)}`);
    return job;
  } catch (error) {
    core.error(`GitHub getJob error message: ${JSON.stringify(error)}`);
  }
}

export async function getLogUrl(token: string): Promise<string | undefined> {
  if (token) {
    const octokit = github.getOctokit(token);
    const logUrl = await downloadJobLogsForWorkflowRun(octokit);
    core.info(`gitboard-action job log url: ${logUrl}`);
    return logUrl;
  }
  return undefined;
}

export async function downloadJobLogsForWorkflowRun(
  octokit: InstanceType<typeof GitHub>,
) {
  try {
    const request = {
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      run_id: github.context.runId,
    };
    core.debug(
      `gitboard-action listJobsForWorkflowRun request: ${JSON.stringify(
        request,
      )}`,
    );
    const jobsResponse = await octokit.rest.actions.listJobsForWorkflowRun(
      request,
    );
    core.debug(
      `gitboard-action listJobsForWorkflowRun response: ${JSON.stringify(
        jobsResponse,
      )}`,
    );
    const logRequest = {
      ...request,
      job_id: jobsResponse.data.jobs[0].id,
    };
    core.debug(
      `gitboard-action downloadJobLogsForWorkflowRun request: ${JSON.stringify(
        logRequest,
      )}`,
    );
    const logsResponse =
      await octokit.rest.actions.downloadJobLogsForWorkflowRun(logRequest);
    core.debug(
      `gitboard-action downloadJobLogsForWorkflowRun response: ${JSON.stringify(
        logsResponse,
      )}`,
    );
    return logsResponse.url;
  } catch (error) {
    core.error(`GitHub getRunLogUrl error message: ${JSON.stringify(error)}`);
  }
}

export function getUpsertJobBody(
  username: string,
  status: string,
  steps: any[],
  logUrl: string,
) {
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
    status: status,
    access: github.context.payload.repository.private ? 'private' : 'public',
    updated: new Date().toISOString(),
    url: github.context.payload.repository.html_url,
    steps: steps,
    logUrl: logUrl,
  };
  core.debug(
    `gitboard-action upsert job body for ${username}: ${JSON.stringify(
      upsertJobBody,
    )}`,
  );
  return upsertJobBody;
}
