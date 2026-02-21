# Histórico de Alterações — OdontoX Fila Virtual

---

## #9 · 2026-02-21 · Exportar histórico de pacientes para Excel

- Adicionado botão **↓ Exportar Excel** na seção de Histórico do painel
- Gera arquivo `.csv` com BOM UTF-8 (compatível com Excel em português sem distorção de acentos)
- Exporta os dados conforme o filtro ativo (Todos / Aguardando / Chamado / Concluído / Retirado)
- Colunas exportadas: `#`, `Nome`, `Exame`, `Entrada`, `Espera`, `Status`
- Nome do arquivo: `historico-YYYY-MM-DD.csv`
- Implementação 100% client-side (sem dependências extras no servidor)

---

## #8 · 2026-02-21 · Histórico por data e retenção de 30 dias

- Retenção de dados no banco alterada de 7 para **30 dias** (`queueModel.js`)
- Adicionado endpoint `GET /api/panel/history?date=YYYY-MM-DD` para consultar qualquer dia
- Adicionado método `getAllByDate(date)` no `queueModel.js` e `getHistoryByDate(date)` no `queueService.js`
- Adicionado seletor de **Data** + botão **Buscar** na seção de Histórico do painel
- Histórico abre automaticamente na data de hoje; data exibida no rodapé da tabela
- Título da seção atualizado para "Histórico de Pacientes"

---

## #7 · 2026-02-21 · Coluna "Espera" no histórico de pacientes

- Adicionada coluna **Espera** na tabela "Histórico de Pacientes do Dia"
- Para pacientes já chamados: exibe o tempo entre a entrada na fila e o momento da chamada (`calledAt - createdAt`)
- Para pacientes ainda aguardando: exibe o tempo decorrido desde a entrada até agora
- Para pacientes cancelados antes de serem chamados: exibe `-`
- Adicionadas funções auxiliares `formatDuration()` e `getWaitTime()` em `panel.js`

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
