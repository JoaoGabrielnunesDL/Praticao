// Endereço da API (back-end FastAPI rodando no Docker).
const API_URL = 'http://localhost:8000';

// Dados de contato do PratiCão: usados na faixa azul do topo e no rodapé de todas as telas.
// Para mudar o telefone ou o e-mail do sistema inteiro, altere só aqui.
const CONTATO = {
  telefone: '(11) 98765-4321',
  email: 'contato@praticao.com.br',
  endereco: ['Rua das Flores, 123 - Centro', 'São Paulo - SP - CEP 01001-000'],
  horarios: ['Segunda a Sexta: 8h às 18h', 'Sábados: 8h às 14h', 'Domingos: 8h às 12h'],
};

// Expediente usado na tela de agendamento (mesmos horários do rodapé). Dia da semana: 0 = domingo ... 6 = sábado.
// [abre, fecha] em horas. Os horários são oferecidos de PASSO_MIN em PASSO_MIN minutos.
const EXPEDIENTE = { 0: [8, 12], 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [8, 14] };
const PASSO_MIN = 30;
