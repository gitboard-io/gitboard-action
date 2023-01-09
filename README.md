# Update GitBoard.io Dashboard action

[GitBoard.io](https://gitboard.io/) a real time build status dashboard for GitHub Actions.
This action reports a jobs status to the GitBoard.io api which is then reflected on GitBoard.io.
Simply [login to GitBoard.io](https://gitboard.io/login) using your github account to access your free build status dashboard. 

## Inputs

### `username`

**Required** -  GitBoard.io username, dictates which GitBoard.io account will reflect the job status. A users GitBoard.io username can be found at https://gitboard.io/profile.

### `key`

**Required** -  GitBoard.io users api key, authenticates the request to the GitBoard.io api. This should be kept secret, we recommend storing this in a GitHub secret. A users GitBoard.io api key can be found at https://gitboard.io/profile

## Example usage

Update any GitHub Action job to include the following step, replacing the values with those provided on your [GitBoard.io profile](https://gitboard.io/profile):

```yaml
uses: gitboard-io/gitboard-action@v1.0
with:
  username: # <replace-with-gitboard.io-username>
  key: # <replace-with-gitboard.io-api-key>
```

At GitBoard.io we store our inputs as Organisation Actions secrets to enable easy addition and updating of this step across our organisations repositories. 