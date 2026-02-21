# Histórico de Alterações — OdontoX Fila Virtual

---

## #1 · 2026-02-21 · Autenticação HTTP Basic Auth no painel

- Instalada a biblioteca `express-basic-auth`
- Criado usuário **admin** com acesso total ao painel
- Adicionadas variáveis `PANEL_USER` e `PANEL_PASSWORD` no `.env`
- Todas as rotas `/painel` e `/api/panel` passaram a exigir autenticação

---

## #2 · 2026-02-21 · Mensagens WhatsApp personalizadas por tipo de exame

- Adicionadas colunas `queue_message` e `call_message` na tabela `exam_types` (migração automática via `database.js`)
- Atualizado `examModel.js` para incluir e salvar as novas colunas
- Atualizado `whatsappService.js` com função `replacePlaceholders()` para suporte às variáveis `{nome}`, `{exame}`, `{posicao}`, `{link}`
- Adicionado editor de mensagens no painel admin com textos padrão como placeholder
- Adicionada rota `PATCH /api/exams/:id` para salvar as mensagens

---

## #3 · 2026-02-21 · Botão "Sair" no painel

- Adicionado botão **Sair** no cabeçalho do painel (canto superior direito)
- Implementada função `logout()` que invalida as credenciais e redireciona para `/painel`, forçando nova autenticação

---

## #4 · 2026-02-21 · Usuário operador "tecnico"

- Criado segundo usuário **tecnico** com acesso intermediário (pode chamar, concluir e retirar pacientes, mas não gerencia tipos de exame)
- Adicionadas variáveis `PANEL_OPERATOR_USER` e `PANEL_OPERATOR_PASSWORD` no `.env`
- Adicionado middleware `operatorOrAdmin` no `server.js`
- Painel oculta a seção "Gerenciar Tipos de Exame" para não-admins via `checkRole()`

---

## #5 · 2026-02-21 · Usuário recepção "recepcao"

- Criado terceiro usuário **recepcao** com acesso somente leitura (visualiza a fila, sem ações)
- Adicionadas variáveis `PANEL_RECEPTION_USER` e `PANEL_RECEPTION_PASSWORD` no `.env`
- Botões "Chamar Próximo", "Concluir" e "Retirar" ocultados para o usuário recepcao via `userRole`
- Adicionado middleware `blockReception` no `server.js` para bloquear ações na API (403)

---

## #6 · 2026-02-21 · Correção de roteamento do painel

- Corrigido erro em que rotas `/api/panel/*` usavam `app.get/post/patch` com um Express Router, quebrando o roteamento (Express Router requer `app.use` para funcionar corretamente)
- Restaurado `app.use('/api/panel', panelAuth, panelRoutes)` como ponto único de entrada
- Movido endpoint `/api/panel/role` para dentro do `panelRoutes` para eliminar dependência de ordem de registro de rotas
- Resultado: admin, tecnico e recepcao funcionando corretamente com suas respectivas permissões
