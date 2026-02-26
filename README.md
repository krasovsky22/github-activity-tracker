# GitHub Activity Tracker

An AWS Lambda function that runs on a schedule and pushes empty commits to a GitHub repository, keeping your contribution graph active.

## How It Works

An EventBridge (CloudWatch Events) rule triggers the Lambda on a cron schedule. The Lambda fetches a GitHub Personal Access Token (PAT) from AWS SSM Parameter Store, then uses the GitHub API to create an empty commit on the target branch — no file changes, just a new commit object pointing to the same tree.

```
EventBridge (cron) → Lambda → SSM (PAT) → GitHub API (empty commit)
```

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.0
- AWS account with credentials configured (`aws configure`)
- GitHub Personal Access Token with `repo` scope
- A GitHub repository to commit to

## Setup

### 1. Store your GitHub token in SSM

```bash
aws ssm put-parameter \
  --name "/github-activity-tracker/github-token" \
  --value "ghp_yourtoken" \
  --type SecureString \
  --region us-west-1
```

### 2. Configure Terraform variables

Copy the example vars file and fill in your values:

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

```hcl
# terraform/terraform.tfvars
aws_region             = "us-west-1"
cron_schedule          = "cron(0 0 * * ? *)"   # daily at midnight UTC
github_owner           = "your-username"
github_repo            = "your-repo"
github_branch          = "main"
github_token_ssm_param = "/github-activity-tracker/github-token"
```

### 3. Deploy

```bash
make deploy
# or: cd terraform && terraform init && terraform apply
```

### 4. Destroy

```bash
make destroy
# or: cd terraform && terraform destroy
```

## Terraform Variables

| Variable | Description | Default |
|---|---|---|
| `aws_region` | AWS region | `us-west-1` |
| `function_name` | Lambda function name | `github-activity-tracker` |
| `cron_schedule` | EventBridge schedule expression | `cron(0 0 * * ? *)` |
| `github_owner` | GitHub repo owner/org | — |
| `github_repo` | GitHub repo name | — |
| `github_branch` | Branch to commit to | `main` |
| `github_token_ssm_param` | SSM path for the GitHub PAT | `/github-activity-tracker/github-token` |
| `log_retention_days` | CloudWatch log retention | `14` |

## Infrastructure

- **Lambda** — Node.js 20.x runtime, zipped from `src/`
- **EventBridge rule** — triggers Lambda on the configured schedule
- **IAM role** — `AWSLambdaBasicExecutionRole` + `ssm:GetParameter` on the token path
- **CloudWatch log group** — `/aws/lambda/github-activity-tracker`

## Local Development

Requires [Docker](https://docs.docker.com/get-docker/) for LocalStack.

```bash
# Start LocalStack
make local-up

# Deploy to LocalStack
make local-deploy

# Invoke the function
make local-invoke

# Tear down LocalStack
make local-down
```

For a quick smoke test without LocalStack, set `GITHUB_TOKEN_OVERRIDE` to skip SSM:

```bash
GITHUB_OWNER=your-username \
GITHUB_REPO=your-repo \
GITHUB_TOKEN_OVERRIDE=ghp_yourtoken \
npm run local:run
```

> `GITHUB_TOKEN_OVERRIDE` is an intentional local dev escape hatch and is never set in Terraform.

## Environment Variables (Lambda)

| Variable | Source | Description |
|---|---|---|
| `GITHUB_OWNER` | Terraform | Repository owner |
| `GITHUB_REPO` | Terraform | Repository name |
| `GITHUB_BRANCH` | Terraform | Target branch (default: `main`) |
| `GITHUB_TOKEN_SSM_PARAM` | Terraform | SSM parameter path for the PAT |
| `COMMIT_MESSAGE` | optional | Override the commit message |
| `GITHUB_TOKEN_OVERRIDE` | local only | Skip SSM; use token directly |
| `LOCALSTACK_ENDPOINT` | local only | Point SSM client at LocalStack |
