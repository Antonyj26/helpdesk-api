🧾 Sobre o projeto

A Helpdesk API é uma aplicação back-end desenvolvida em Node.js para gerenciar chamados técnicos. O sistema oferece autenticação JWT, cadastro de clientes, tickets, usuários, serviços e mantém relações entre essas entidades com total integridade através do banco PostgreSQL gerenciado pelo Prisma ORM.

O projeto foi criado com foco em boas práticas, validações com Zod, padronização de erros com AppError, testes automatizados (Jest + Supertest) e ambiente Docker para o PostgreSQL.

🚀 Tecnologias utilizadas

Node.js

Express.js

TypeScript

Prisma ORM

PostgreSQL

Docker

Zod

JWT (Json Web Token)

Jest + Supertest

Axios (para consumo interno)

Cors

📂 Funcionalidades principais
👤 Usuários

Criar usuários

Listar todos

Buscar por user_id

Atualizar nome, e-mail e role

Deletar usuário

Login com JWT

🧑‍💼 Clientes

Criar cliente

Listar clientes

Buscar cliente

Atualizar

Remover cliente com validação: não remove se houver tickets associados

🛠️ Tickets

Criar ticket com vínculo ao cliente e serviço

Listar tickets

Buscar ticket com cliente + serviços associados

Atualizar status/descrição

Remover ticket

💼 Serviços

CRUD completo de serviços (para ser consumido no Front React)
