# SmartDesk

> Plataforma inteligente de help desk com suporte N1, N2, N3.

![Node.js](https://img.shields.io/badge/Node.js-22%2B-success)
![Docker](https://img.shields.io/badge/Docker-%20%20-%237873BF)
![License](https://img.shields.io/badge/License-MIT-green)

## 📖 Visão geral
SmartDesk é uma aplicação full‑stack que oferece:
- **Frontend**: SPA usando Bootstrap 5 com tema escuro e animações suaves.
- **Backend**: API RESTful em Node.js/Express, camada ORM Sequelize e banco MySQL.
- **Autenticação**: JWT + refresh token.
- **Escalonamento automático** de tickets (N1 → N2 → N3) baseado na complexidade.
- **Auditoria completa** de ações (login, CRUD, escalonamento, etc.).
- **Deploy** simplificado com Docker & Docker‑Compose.

## 📂 Estrutura de diretórios
```
SmartDesk/
├─ client/            # SPA – assets, css, js, pages (HTML)
├─ server/            # API – config, controllers, middlewares, models, routes, services
├─ database/          # migrations & seeders
├─ uploads/           # arquivos enviados
├─ tests/             # testes unitários e de integração
├─ .env               # variáveis de ambiente (exemplo em .env.example)
├─ Dockerfile
├─ docker-compose.yml
├─ package.json
└─ README.md
```

## ⚙️ Requisitos
- **Node.js** ≥ 22
- **Docker** ≥ 20
- **Docker‑Compose** ≥ 1.29
- **MySQL** 8 (usado pelo container)

## 🚀 Configuração Local
1. **Clone o repositório**
   ```bash
   git clone <repo-url>
   cd SmartDesk
   ```
2. **Instale as dependências**
   ```bash
   npm install
   ```
3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   # edite .env conforme necessário
   ```
4. **Inicie o banco de dados (Docker)**
   ```bash
   docker compose up -d
   ```
5. **Execute as migrações**
   ```bash
   npx sequelize-cli db:migrate
   ```
6. **Inicie a aplicação**
   ```bash
   npm run dev
   ```
   A API ficará disponível em `http://localhost:3000`.

## 📡 Uso da API
| Recurso | Método | Endpoint | Descrição |
|---------|--------|----------|----------|
| **Auth** | POST | `/api/auth/login` | Gera `accessToken` e `refreshToken`. |
|  | POST | `/api/auth/refresh` | Renova token. |
| **Usuários** | GET | `/api/users` | Lista usuários (admin). |
|  | POST | `/api/users` | Cria usuário. |
| **Tickets** | POST | `/api/tickets` | Cria ticket (atribuição automática). |
|  | GET | `/api/tickets` | Lista tickets (filtros). |
|  | PUT | `/api/tickets/:id` | Atualiza ticket. |
|  | POST | `/api/tickets/:id/escalate` | Escalona ticket. |
| **Dashboard** | GET | `/api/dashboard/summary` | Dados resumidos (contagem por status, níveis, etc.). |

> Para detalhes completos veja a documentação Swagger em `/api/docs` (a ser implementada).

## 🧪 Testes
Execute a suíte de testes com:
```bash
npm test
```
Os testes utilizam **Jest** e **Supertest** e cobrem controladores, middlewares e serviços.

## 📦 Deploy
O Dockerfile já está configurado para produção. Para criar a imagem e rodar em produção:
```bash
docker compose -f docker-compose.yml up -d --build
```
A aplicação será exposta na porta 3000.

## 🤝 Contribuição
1. Fork o repositório.
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`).
3. Commit suas mudanças (`git commit -m 'feat: descrição'`).
4. Abra um Pull Request.

## 📄 Licença
Este projeto está licenciado sob a licença MIT.
