import * as core from "@actions/core";
import * as github from "@actions/github";
import {Caller, GitboardApiSdk} from "@codeaim/gitboard-api";
import axios from "axios";

async function run() {
  try {
    const username = core.getInput('username');
    const key = core.getInput('key');
    const gitboardApiSdk =  new GitboardApiSdk(authenticatedAxios(`https://api.gitboard.io`, key))
    await gitboardApiSdk.upsertJob({ username }, { username, id: `${github.context.payload.repository.full_name}-${github.context.job}`, url: github.context.payload.repository.html_url, name: github.context.payload.repository.full_name, access: github.context.payload["private"] ? "private" : "public", status: "pending", updated: new Date().toISOString() });
    console.log(`View GitBoard.io dashboard: https://gitboard.io/${username}/dashboard`)
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

function authenticatedAxios(url: string, key: string): Caller {
  return {
    call: async (method: any, resource: any, path: string, body: any, pathParameters: any, queryParameters: any, multiQueryParameters: any, headers: any, config: any) => {
      const result = await axios(url + path, {
        method: method as any,
        data: body,
        params: { ...queryParameters, ...multiQueryParameters },
        headers: {
          ...headers,
          "X-Api-Key": `${key}`
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

run()