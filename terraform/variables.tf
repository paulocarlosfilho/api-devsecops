variable "aws_region" {
  description = "Região AWS simulada pelo LocalStack"
  type        = string
  default     = "us-east-1"
}

variable "localstack_endpoint" {
  description = "Endpoint do LocalStack"
  type        = string
  default     = "http://localhost:4566"
}

variable "project_name" {
  description = "Nome do projeto, usado como prefixo dos recursos"
  type        = string
  default     = "ecommerce"
}

variable "vpc_cidr" {
  description = "CIDR block da VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block da subnet pública"
  type        = string
  default     = "10.0.1.0/24"
}

variable "instance_type" {
  description = "Tipo da instância EC2 simulada"
  type        = string
  default     = "t2.micro"
}
