const env = require('../config/env');

async function sendMessage(phone, text) {
  const formattedPhone = `55${phone}`;
  const url = `${env.evolution.apiUrl}/message/sendText/${env.evolution.instance}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.evolution.apiKey,
    },
    body: JSON.stringify({
      number: formattedPhone,
      text,
      delay: 1200,
      linkPreview: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Evolution API erro ${response.status}: ${body}`);
  }

  return response.json();
}

async function sendQueueConfirmation(phone, name, position, examName, queueId) {
  const link = `${env.baseUrl}/fila/${queueId}`;
  const text =
    `Ola *${name}*!\n` +
    `Você entrou na fila virtual da *OdontoX*.\n\n` +
    `*Exame:* *${examName}*\n\n` +
    `*Sua posição:* ${position}\n\n` +
    `Acompanhe sua fila em tempo real:\n\n` +
    `${link}\n\n` +
    `Aguarde a chamada. Obrigado!`;

  return sendMessage(phone, text);
}

async function sendCallNotification(phone, name, examName) {
  const text =
    `*${name}*, e a sua vez!\n\n` +
    `Dirija-se ao setor de *${examName}*.\n\n` +
    `OdontoX agradece sua paciencia!`;

  return sendMessage(phone, text);
}

module.exports = {
  sendQueueConfirmation,
  sendCallNotification,
};