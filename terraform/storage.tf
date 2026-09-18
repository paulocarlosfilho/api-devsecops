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

# 1. Mapeia os arquivos do projeto (sobe um nível para pegar a raiz)
locals {
  api_files = {
    for file in fileset("${path.module}/..", "**") :
    file => {
      source = "${path.module}/../${file}"
      key    = file
    }
    if !startswith(file, ".git/")
    && !startswith(file, ".vscode/")
    && !startswith(file, ".terraform/")
    && !startswith(file, "node_modules/")
    && !startswith(file, "frontend/node_modules/")
    && !startswith(file, "dist/")
    && !startswith(file, "pgdata/")
    && !startswith(file, "terraform/")
  }
}

# 2. Faz o upload de cada arquivo para o S3 no LocalStack
resource "aws_s3_object" "api_files" {
  for_each = local.api_files

  bucket = aws_s3_bucket.artifacts.id
  key    = each.value.key
  source = each.value.source

  content_type = lookup(
    {
      ".html" = "text/html"
      ".css"  = "text/css"
      ".js"   = "application/javascript"
      ".json" = "application/json"
      ".png"  = "image/png"
      ".jpg"  = "image/jpeg"
    },
    try(lower(regex("\\.[^.]+$", each.value.key)), ""),
    "application/octet-stream"
  )

  etag = filemd5(each.value.source)
}