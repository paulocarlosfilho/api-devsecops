resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_name}-deploy-artifacts"

  tags = {
    Name = "${var.project_name}-deploy-artifacts"
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}
