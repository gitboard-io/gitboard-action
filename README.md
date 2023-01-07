# gitboard.io action

[gitboard.io](https://gitboard.io/) a real time build status dashboard for GitHub Actions.
This action reports a jobs status to the gitboard.io api which is then reflected on gitboard.io.
Simply [login to gitboard.io](https://gitboard.io/login) using your github account to access your free build status dashboard. 

## Inputs

### `username`

**Required** -  gitboard.io username, dictates which gitboard.io account will reflect the job status. A users gitboard.io username can be found at https://gitboard.io/profile.

### `key`

**Required** -  gitboard.io users api key, authenticates the request to the gitboard.io api. This should be kept secret, we recommend storing this in a GitHub secret. A users gitboard.io api key can be found at https://gitboard.io/profile

## Example usage

Update any GitHub Action job to include the following step, replacing the values with those provided on your [gitboard.io profile](https://gitboard.io/profile):

```yaml
uses: gitboard-io/gitboard-action@v1.0
with:
  username: # <replace-with-gitboard.io-username>
  key: # <replace-with-gitboard.io-api-key>
```