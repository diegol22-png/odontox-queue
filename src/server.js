const env = require('./config/env');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./socket/index');
const queueService = require('./services/queueService');
const cronService = require('./services/cronService');

const examRoutes = require('./routes/exam');
const queueRoutes = require('./routes/queue');
const panelRoutes = require('./routes/panel');

const app = express();
const server = createServer(app);
const io = new Server(server);

// Conectar Socket.IO ao service
queueService.setIO(io);
initSocket(io);

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan('short'));
app.use(express.json());

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: { message: 'Muitas requisicoes. Tente novamente em alguns minutos.', code: 'RATE_LIMIT' } },
});
app.use(globalLimiter);

const queueLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { message: 'Limite de cadastros atingido. Tente novamente mais tarde.', code: 'RATE_LIMIT' } },
});

// Arquivos estaticos
app.use(express.static(path.join(__dirname, '../public')));

// Autenticacao do painel (admin + tecnico + recepcao)
const panelUsers = {
  [env.panel.user]: env.panel.password,
  [env.panel.operatorUser]: env.panel.operatorPassword,
  [env.panel.receptionUser]: env.panel.receptionPassword,
};

const panelAuth = basicAuth({
  users: panelUsers,
  challenge: true,
  realm: 'OdontoX Painel',
});

// Middleware que exige role admin
const adminOnly = basicAuth({
  users: { [env.panel.user]: env.panel.password },
  challenge: true,
  realm: 'OdontoX Painel',
});

// Middleware que exige admin ou tecnico (bloqueia recepcao)
const operatorOrAdmin = basicAuth({
  users: {
    [env.panel.user]: env.panel.password,
    [env.panel.operatorUser]: env.panel.operatorPassword,
  },
  challenge: true,
  realm: 'OdontoX Painel',
});

// Rotas da API
// GET /api/exams e livre (usado tambem pela recepcao); demais metodos exigem admin
const examAuthMiddleware = (req, res, next) => {
  if (req.method === 'GET') return next();
  return adminOnly(req, res, next);
};
app.use('/api/exams', examAuthMiddleware, examRoutes);
app.use('/api/queue', queueRoutes);
app.post('/api/queue', queueLimiter);
// Rotas de leitura do painel (todos os usuarios)
app.get('/api/panel/queues', panelAuth, panelRoutes);

// Rotas de acao do painel (apenas admin e tecnico)
app.post('/api/panel/call-next', operatorOrAdmin, panelRoutes);
app.patch('/api/panel/complete/:id', operatorOrAdmin, panelRoutes);
app.patch('/api/panel/cancel/:id', operatorOrAdmin, panelRoutes);

// Endpoint para o frontend saber o role do usuario logado
app.get('/api/panel/role', panelAuth, (req, res) => {
  const user = req.auth.user;
  let role = 'reception';
  if (user === env.panel.user) role = 'admin';
  else if (user === env.panel.operatorUser) role = 'operator';
  res.json({ role });
});

// Rota para pagina da fila (SPA - serve o mesmo HTML)
app.get('/fila/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/fila.html'));
});

// Rota para painel profissional
app.get('/painel', panelAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/painel.html'));
});

// Error handler
app.use(errorHandler);

// Iniciar cron jobs
cronService.start();

// Iniciar servidor
server.listen(env.port, () => {
  console.log(`\n  OdontoX Fila Virtual rodando em: http://localhost:${env.port}`);
  console.log(`  Recepcao:  http://localhost:${env.port}/`);
  console.log(`  Painel:    http://localhost:${env.port}/painel\n`);
});
