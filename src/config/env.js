require('dotenv').config();

const requiredVars = [
  'EVOLUTION_API_URL',
  'EVOLUTION_API_INSTANCE',
  'EVOLUTION_API_KEY',
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Variavel de ambiente obrigatoria nao definida: ${varName}`);
    console.error('Copie o arquivo .env.example para .env e preencha os valores.');
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  evolution: {
    apiUrl: process.env.EVOLUTION_API_URL.replace(/\/$/, ''),
    instance: process.env.EVOLUTION_API_INSTANCE,
    apiKey: process.env.EVOLUTION_API_KEY,
  },
  panel: {
    user: process.env.PANEL_USER || 'admin',
    password: process.env.PANEL_PASSWORD || 'odontox123',
  },
};
