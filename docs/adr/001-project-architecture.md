# ADR 001: Arquitetura inicial do projeto

## Contexto

O TaskBoard é uma aplicação full stack criada para um teste técnico.

## Decisão

- Adotar um monólito modular no backend.
- Usar Django e Django REST Framework.
- Organizar o frontend React com arquitetura Feature-Based.
- Usar PostgreSQL como banco de dados.
- Orquestrar o ambiente local com Docker Compose.

## Justificativa

A solução reduz a complexidade operacional, é aderente ao escopo do teste e segue KISS sem impedir a evolução modular do sistema.

