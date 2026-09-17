resource "aws_instance" "app_server" {
  ami                    = "ami-0c02fb55956c7d316"
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = <<-EOF
    #!/bin/bash
    # Simula o provisionamento do host que roda os containers via docker-compose:
    # api, frontend, prometheus e grafana.
    docker compose -f /opt/ecommerce/docker-compose.yml up -d
  EOF

  tags = {
    Name = "${var.project_name}-app-server"
  }
}
