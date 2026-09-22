# api-devsecops

Solução do **Desafio Prático Final** (DevOps): API Node.js + Frontend React,
containerizados, com pipeline CI/CD para Docker Hub, infraestrutura como código
via Terraform + LocalStack e observabilidade com Prometheus + Grafana.

## Arquitetura

```
                ┌──────────────┐        ┌──────────────┐
   usuário ───▶ │  frontend    │  /api ▶│     api      │──▶ Postgres
                │ React+Nginx  │        │ Node/Express │──▶ Redis
                └──────────────┘        └──────┬───────┘
                                                │ /metrics
                                                ▼
                                         ┌──────────────┐      ┌──────────┐
                                         │  Prometheus  │◀────▶│ Grafana  │
                                         └──────────────┘      └──────────┘

  terraform/  ──▶ LocalStack (EC2 e bucket S3)
  .github/workflows/ ──▶ build & push das imagens para o Docker Hub
```

## Estrutura do repositório

```
.
├── src/                    # API Node.js/Express (services, controllers, repositories)
├── frontend/               # SPA React (Vite) que consome a API
├── Dockerfile              # imagem da API
├── frontend/Dockerfile     # imagem do frontend (build + Nginx)
├── docker-compose.yml      # stack completa para rodar tudo localmente
├── .github/workflows/      # pipeline CI/CD (GitHub Actions)
├── terraform/              # IaC para provisionar infra simulada no LocalStack
└── monitoring/
    ├── prometheus/         # prometheus.yml (scrape da API)
    └── grafana/            # datasource + dashboard provisionados automaticamente
```

## 1. Rodando tudo localmente (docker-compose)

Pré-requisitos: Docker e Docker Compose instalados.

```bash
cp .env.example .env   # ajuste se quiser, os defaults já funcionam
docker compose up -d --build
docker compose exec api npm run seed   # popula categorias/produtos de exemplo
```

Serviços expostos:

| Serviço            | URL                              | Credenciais       |
|---------------------|-----------------------------------|--------------------|
| Frontend (React)    | http://localhost:8080            | -                  |
| API (Node.js)       | http://localhost:3000            | -                  |
| Swagger da API      | http://localhost:3000/api-docs   | -                  |
| Métricas Prometheus | http://localhost:3000/metrics    | -                  |
| Prometheus          | http://localhost:9090            | -                  |
| Grafana             | http://localhost:3001            | admin / admin      |
| LocalStack          | http://localhost:4566            | -                  |

No Grafana, o datasource do Prometheus e o dashboard **"E-Commerce API -
Observabilidade"** já vêm provisionados automaticamente (requisições/s, p95 de
latência, taxa de erros, CPU, memória, event loop lag).

Para derrubar tudo: `docker compose down -v`.

## 2. Imagens publicadas no Docker Hub

As imagens já estão publicadas e públicas:

- **API**: [<usuario do dockerhub>/ecommerce-api](https://hub.docker.com/r/hrvton/ecommerce-api)
- **Frontend**: [<usuario do dockerhub>/ecommerce-frontend](https://hub.docker.com/r/hrvton/ecommerce-frontend)

```bash
docker pull <usuario do dockerhub>/ecommerce-api:latest
docker pull <usuario do dockerhub>/ecommerce-frontend:latest
```

Para publicar manualmente uma nova versão (fora da pipeline):

```bash
docker login
docker build -t <usuario do dockerhub>/ecommerce-api:latest .
docker build -t <usuario do dockerhub>/ecommerce-frontend:latest ./frontend
docker push hrvton/ecommerce-api:latest
docker push hrvton/ecommerce-frontend:latest
```

## 3. Pipeline CI/CD (GitHub Actions)

Arquivo: `.github/workflows/ci-cd.yml`. A cada `push` na branch `main`:

1. Roda os testes unitários da API (`npm run test:unit`).
2. Se os testes passarem, builda e publica no Docker Hub:
   - `<usuario do dockerhub>/ecommerce-api:latest` e `:<sha do commit>`
   - `<usuario do dockerhub>/ecommerce-frontend:latest` e `:<sha do commit>`

### Configuração necessária no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository
secret**:

| Secret               | Valor                                                    |
|----------------------|-----------------------------------------------------------|
| `DOCKERHUB_USERNAME` | seu usuário do Docker Hub                                  |
| `DOCKERHUB_TOKEN`    | um Access Token gerado em Docker Hub → Account Settings → Security |

## 🛡️ Benefícios do CI/CD com DevSecOps

A integração dessas ferramentas no GitHub Actions garante a segurança em todas as camadas da aplicação (Shift Left Security), prevenindo falhas antes que cheguem a produção:

* **Secret Scanning (Gitleaks)**: Evita o vazamento acidental de chaves de API, senhas e tokens de acesso no repositório público ou privado, eliminando o risco de comprometimento de credenciais na nuvem.
* **SAST - Static Application Security Testing (Snyk)**: Analisa o código Node.js e suas dependências em tempo de desenvolvimento, identificando vulnerabilidades de código (como injeções e falhas de lógica) e bibliotecas desatualizadas com falhas conhecidas.
* **Container Scanning (Trivy)**: Garante que a imagem Docker construída esteja livre de vulnerabilidades de sistema operacional e pacotes base (CVEs de severidade High/Critical), reduzindo a superfície de ataque dos contêineres.
* **IaC Scanning (Checkov)**: Audita os arquivos do Terraform antes do provisionamento no LocalStack/AWS, prevenindo erros de infraestrutura como buckets S3 públicos, portas desnecessariamente abertas e falta de criptografia.
* **DAST - Dynamic Application Security Testing (OWASP ZAP)**: Simula ataques reais contra a API em execução no ambiente de Staging, validando se a aplicação responde com segurança a vetores de ataque comuns (como OWASP Top 10) em tempo de execução.

## 4. Infraestrutura como código (Terraform + LocalStack)

O Terraform provisiona, dentro do LocalStack, os recursos que hospedariam os
containers em um ambiente AWS real:

- **VPC + subnet pública + internet gateway + route table** (rede)
- **Security Group** liberando as portas da API, frontend, Prometheus e Grafana
- **Instância EC2** (simulada) que representaria o host dos containers
- **Bucket S3** para artefatos de deploy

```bash
# 1. Suba o LocalStack (já incluso no docker-compose, ou isoladamente):
docker compose up -d localstack

# 2. Aplique a infraestrutura
cd terraform
terraform init
terraform apply -auto-approve

# 3. Veja os recursos criados
terraform output

# 4. Para destruir
terraform destroy -auto-approve
```

Isso já foi validado de ponta a ponta: `terraform apply` cria os 9 recursos no
LocalStack e `terraform destroy` os remove sem erros.

## 5. Observabilidade (Prometheus + Grafana)

- A API expõe métricas no padrão Prometheus em `GET /metrics`
  (`src/config/metrics.js`), incluindo:
  - `http_requests_total` (contador por rota/método/status)
  - `http_request_duration_seconds` (histograma de latência)
  - métricas padrão do Node.js (CPU, memória, event loop lag, GC)
- `monitoring/prometheus/prometheus.yml` configura o scrape da API a cada 5s.
- `monitoring/grafana/provisioning/` provisiona automaticamente o datasource e
  o dashboard ao subir o container do Grafana — nada precisa ser configurado
  manualmente na interface.

## 6. Repositório no GitHub

Código-fonte: **https://github.com/paulocarlosfilho/api-devsecops**

Os secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` (seção 3) precisam ser
configurados neste repositório para a pipeline publicar as imagens.

## 7. Roteiro para o Pitch Executivo (5 minutos)

| Tempo         | Foco                    | Pontos-chave a citar |
|---------------|-------------------------|------------------------|
| 00:00–01:00   | Problema e solução      | Deploys manuais e sem padronização geravam erro humano e falta de visibilidade. A esteira DevOps automatiza build/deploy e dá visibilidade em tempo real da saúde da aplicação. |
| 01:00–02:30   | Arquitetura e ferramentas | **Git/GitHub**: histórico e colaboração. **Docker/Docker Hub**: ambientes idênticos em qualquer máquina, imagens versionadas e distribuídas. **GitHub Actions**: build e publicação automáticos a cada push, elimina deploy manual. **Terraform + LocalStack**: infraestrutura versionada, reproduzível e testável sem custo de nuvem real. **Prometheus/Grafana**: métricas de CPU, requisições/s e latência em tempo real. |
| 02:30–04:30   | Demonstração prática    | 1) Alterar algo simples no código e dar `git push`. 2) Mostrar a Action rodando em Actions tab. 3) Mostrar a imagem nova no Docker Hub. 4) Rodar `terraform apply` no LocalStack. 5) Abrir o Grafana e gerar tráfego (`curl` em loop na API) mostrando o gráfico de requisições subir em tempo real. |
| 04:30–05:00   | Encerramento            | Ambiente reprodutível, testado automaticamente antes de cada deploy, infraestrutura auditável via código e anomalias detectáveis em segundos — não em dias. |

### Sugestão de comandos para a demonstração em vídeo/ao vivo

```bash
# Gerar tráfego para "animar" o dashboard do Grafana durante a demo
while true; do curl -s http://localhost:3000/api/v1/products > /dev/null; sleep 0.2; done
```

## Troubleshooting

- **`npm install`/`npm ci` falha com `EAI_AGAIN` durante o build da imagem**:
  algumas redes/sandboxes bloqueiam a resolução de DNS de dentro do container
  de build. Se isso ocorrer, builde manualmente com a rede do host:
  ```bash
  docker build --network=host -t <usuario>/ecommerce-api:latest .
  docker build --network=host -t <usuario>/ecommerce-frontend:latest ./frontend
  ```
  Em runners do GitHub Actions isso não costuma ser necessário.
- **Frontend reiniciando em loop com `host not found in upstream "api"`**:
  ocorre se o container `frontend` sobe antes do `api` existir na rede
  (ex.: primeiro `up` enquanto a imagem da API ainda falhava). O `nginx.conf`
  já usa `resolver 127.0.0.11` com resolução dinâmica; basta esperar o
  healthcheck do `api` ficar `healthy` ou rodar
  `docker compose restart frontend`.

## Testes

```bash
npm run test:unit         # testes unitários (77 testes, mockados, sem infra)
npm run test:coverage     # com relatório de cobertura
```
