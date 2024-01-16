>  Note that this action is no longer required to interact with gitboard.io. We now have a Github App that allows a direct connection.

# Update GitBoard.io Dashboard action

[GitBoard.io](https://gitboard.io/) a real time build status dashboard for GitHub Actions.
This action reports a jobs status to the GitBoard.io api which is then reflected on GitBoard.io.
Simply [login to GitBoard.io](https://gitboard.io/login) using your github account to access your free build status dashboard. 

## Inputs

### `username`

**Required** -  GitBoard.io username, dictates which GitBoard.io account will reflect the job status. A users GitBoard.io username can be found at https://gitboard.io/profile. Multiple account usernames can be supplied. Separate account usernames with a comma. Align corresponding account usernames and account keys.

### `key`

**Required** -  GitBoard.io users api key, authenticates the request to the GitBoard.io api. This should be kept secret, we recommend storing this in a GitHub secret. A users GitBoard.io api key can be found at https://gitboard.io/profile. Multiple account keys can be supplied. Separate account keys with a comma. Align corresponding account usernames and account keys.

## Example usage

Update any GitHub Action job to include the following step, replacing the values with those provided on your [GitBoard.io profile](https://gitboard.io/profile):

### Single User 
```yaml
uses: gitboard-io/gitboard-action@main
with:
  username: # <replace-with-gitboard.io-username>
  key: # <replace-with-gitboard.io-api-key>
```

### Multiple Users
```yaml
uses: gitboard-io/gitboard-action@main
with:
  username: # <replace-with-first-gitboard.io-username>, <replace-with-second-gitboard.io-username>
  key: # <replace-with-first-gitboard.io-api-key>, <replace-with-second-gitboard.io-api-key>
```

At GitBoard.io we store our inputs as Organisation Actions secrets to enable easy addition and updating of this step across our organisations repositories. 
