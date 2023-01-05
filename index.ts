import * as core from "@actions/core";
import * as github from "@actions/github";
import {Caller, GitboardApiSdk} from "@codeaim/gitboard-api";
import axios from "axios";

async function run() {
  try {
    const username = core.getInput('username');
    const key = core.getInput('key');
    const gitboardApiSdk =  new GitboardApiSdk(authenticatedAxios(`https://api.gitboard.io`, key))
    const response = await gitboardApiSdk.getUser({ username });
    if(response.statusCode === 200) {
      console.log(`user`, response.result);
    }
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
    const context = JSON.stringify(github.context, undefined, 2);
    console.log(`The event context: ${context}`);
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
          Authorization: `Bearer ${key}`
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