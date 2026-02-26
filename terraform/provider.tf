provider "aws" {
  region = var.aws_region

  # LocalStack overrides (no-ops when localstack_endpoint is "")
  access_key                  = var.localstack_endpoint != "" ? "test" : null
  secret_key                  = var.localstack_endpoint != "" ? "test" : null
  skip_credentials_validation = var.localstack_endpoint != ""
  skip_requesting_account_id  = var.localstack_endpoint != ""
  skip_metadata_api_check     = var.localstack_endpoint != ""

  dynamic "endpoints" {
    for_each = var.localstack_endpoint != "" ? [1] : []
    content {
      lambda           = var.localstack_endpoint
      iam              = var.localstack_endpoint
      cloudwatchlogs   = var.localstack_endpoint
      cloudwatchevents = var.localstack_endpoint
    }
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5"
}
