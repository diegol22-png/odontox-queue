const cron = require('node-cron');
const queueModel = require('../models/queueModel');

function start() {
  cron.schedule('0 0 * * *', () => {
    try {
      const result = queueModel.cleanupOld();
      console.log(`[CRON] Limpeza diaria concluida. ${result.changes} entradas removidas.`);
    } catch (error) {
      console.error('[CRON] Erro na limpeza diaria:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  console.log('[CRON] Reset diario agendado para meia-noite (America/Sao_Paulo)');
}

module.exports = { start };
