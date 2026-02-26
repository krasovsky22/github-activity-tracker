data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "../src"
  output_path = "lambda.zip"
}

resource "aws_lambda_function" "main" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = var.function_name
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.handler"
  runtime       = "nodejs20.x"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      CRON_SCHEDULE          = var.cron_schedule
      GITHUB_OWNER           = var.github_owner
      GITHUB_REPO            = var.github_repo
      GITHUB_BRANCH          = var.github_branch
      GITHUB_TOKEN_SSM_PARAM = var.github_token_ssm_param
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_logs]
}
