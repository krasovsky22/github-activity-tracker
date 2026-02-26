variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
  default     = "github-activity-tracker"
}

variable "cron_schedule" {
  description = "EventBridge schedule expression"
  type        = string
  default     = "cron(0 0 * * ? *)"
}

variable "localstack_endpoint" {
  description = "Set to http://localhost:4566 for local dev, empty string for real AWS"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "krasovsky22"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "github_branch" {
  description = "Branch to push empty commits to"
  type        = string
  default     = "main"
}

variable "github_token_ssm_param" {
  description = "SSM Parameter Store path for GitHub PAT (SecureString)"
  type        = string
  default     = "/github-activity-tracker/github-token"
}
