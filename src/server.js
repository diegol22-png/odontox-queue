const env = require('./config/env');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

// Rotas da API
app.use('/api/exams', examRoutes);
app.use('/api/queue', queueRoutes);
app.post('/api/queue', queueLimiter);
app.use('/api/panel', panelRoutes);

// Rota para pagina da fila (SPA - serve o mesmo HTML)
app.get('/fila/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/fila.html'));
});

// Rota para painel profissional
app.get('/painel', (req, res) => {
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
