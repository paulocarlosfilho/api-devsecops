output "vpc_id" {
  description = "ID da VPC provisionada"
  value       = aws_vpc.main.id
}

output "subnet_id" {
  description = "ID da subnet publica"
  value       = aws_subnet.public.id
}

output "instance_id" {
  description = "ID da instancia EC2 simulada"
  value       = aws_instance.app_server.id
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 de artefatos"
  value       = aws_s3_bucket.artifacts.bucket
}
