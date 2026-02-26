'use strict';

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  require('dotenv').config();
}

class GitHubClient {
  constructor({ token, owner, repo, branch, commitMessage }) {
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'github-activity-tracker-lambda',
    };
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.commitMessage = commitMessage;
  }

  async _request(method, path, body) {
    const url = `${this.baseUrl}${path}`;
    const options = { method, headers: this.headers };
    if (body !== undefined) options.body = JSON.stringify(body);
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        `GitHub API error ${res.status} on ${method} ${path}: ${JSON.stringify(data)}`,
      );
    return data;
  }

  async getHeadCommitSha() {
    const data = await this._request(
      'GET',
      `/repos/${this.owner}/${this.repo}/git/ref/heads/${this.branch}`,
    );
    return data.object.sha;
  }

  async getTreeSha(commitSha) {
    const data = await this._request(
      'GET',
      `/repos/${this.owner}/${this.repo}/git/commits/${commitSha}`,
    );
    return data.tree.sha;
  }

  async createCommit(treeSha, parentSha) {
    const data = await this._request(
      'POST',
      `/repos/${this.owner}/${this.repo}/git/commits`,
      {
        message: this.commitMessage,
        tree: treeSha,
        parents: [parentSha],
      },
    );
    return data.sha;
  }

  async updateRef(newCommitSha) {
    await this._request(
      'PATCH',
      `/repos/${this.owner}/${this.repo}/git/refs/heads/${this.branch}`,
      {
        sha: newCommitSha,
        force: false,
      },
    );
  }

  async createEmptyCommit() {
    console.log(
      `Creating empty commit on ${this.owner}/${this.repo}@${this.branch}`,
    );
    const headSha = await this.getHeadCommitSha();
    const treeSha = await this.getTreeSha(headSha);
    const newSha = await this.createCommit(treeSha, headSha);
    await this.updateRef(newSha);
    console.log(`Branch ${this.branch} updated to ${newSha}`);
    return newSha;
  }
}

async function getParameterFromSSM(parameterName) {
  const { SSMClient, GetParameterCommand } =
    await import('@aws-sdk/client-ssm');
  const client = new SSMClient({
    region: process.env.AWS_REGION || 'us-west-1',
    ...(process.env.LOCALSTACK_ENDPOINT
      ? { endpoint: process.env.LOCALSTACK_ENDPOINT }
      : {}),
  });
  const response = await client.send(
    new GetParameterCommand({ Name: parameterName, WithDecryption: true }),
  );
  return response.Parameter.Value;
}

exports.handler = async (event) => {
  console.log('github-activity-tracker invoked');
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const commitMessage =
    process.env.COMMIT_MESSAGE || `activity: ${new Date().toISOString()}`;
  const ssmParamName = process.env.GITHUB_TOKEN_SSM_PARAM;

  if (!owner || !repo || !ssmParamName) {
    const msg =
      'Missing required env vars: GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN_SSM_PARAM';
    console.error(msg);
    return { statusCode: 500, body: msg };
  }

  // GITHUB_TOKEN_OVERRIDE: local dev escape hatch (never set in Terraform)
  const token =
    process.env.GITHUB_TOKEN_OVERRIDE ||
    (await getParameterFromSSM(ssmParamName).catch((err) => {
      console.error('Failed to fetch GitHub token from SSM:', err);
      throw err;
    }));

  const client = new GitHubClient({
    token,
    owner,
    repo,
    branch,
    commitMessage,
  });
  try {
    const newSha = await client.createEmptyCommit();
    return { statusCode: 200, body: `Empty commit created: ${newSha}` };
  } catch (err) {
    console.error('GitHub API error:', err);
    return { statusCode: 500, body: `GitHub error: ${err.message}` };
  }
};
