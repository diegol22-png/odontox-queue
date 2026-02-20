const queueId = window.location.pathname.split('/fila/')[1];

const patientCard = document.getElementById('patientCard');
const errorCard = document.getElementById('errorCard');
const calledAlert = document.getElementById('calledAlert');
const calledExam = document.getElementById('calledExam');
const positionNumber = document.getElementById('positionNumber');
const positionDisplay = document.getElementById('positionDisplay');
const positionHint = document.getElementById('positionHint');
const statusBadge = document.getElementById('statusBadge');
const patientName = document.getElementById('patientName');
const examName = document.getElementById('examName');
const entryTime = document.getElementById('entryTime');

let currentExamTypeId = null;

function updateUI(data) {
  patientName.textContent = data.name;
  examName.textContent = data.examType;
  currentExamTypeId = data.examTypeId;

  if (data.createdAt) {
    const date = new Date(data.createdAt);
    entryTime.textContent = `Entrada: ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  updateStatus(data.status, data.position, data.examType);
}

function updateStatus(status, position, examType) {
  // Reset
  calledAlert.classList.remove('show');
  statusBadge.className = 'badge';

  switch (status) {
    case 'waiting':
      statusBadge.classList.add('badge-waiting');
      statusBadge.textContent = 'Aguardando';
      positionNumber.textContent = position;
      positionHint.textContent = position === 1 ? 'voce e o proximo!' : 'aguarde sua chamada';
      break;

    case 'called':
      statusBadge.classList.add('badge-called');
      statusBadge.textContent = 'Chamado';
      positionDisplay.style.display = 'none';
      calledExam.textContent = examType;
      calledAlert.classList.add('show');
      // Vibrar se disponivel
      if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
      break;

    case 'completed':
      statusBadge.classList.add('badge-completed');
      statusBadge.textContent = 'Concluido';
      positionDisplay.style.display = 'none';
      positionHint.textContent = 'Atendimento concluido';
      break;

    case 'cancelled':
      statusBadge.classList.add('badge-cancelled');
      statusBadge.textContent = 'Cancelado';
      positionDisplay.style.display = 'none';
      break;
  }
}

async function fetchStatus() {
  try {
    const res = await fetch(`/api/queue/${queueId}`);
    if (!res.ok) {
      patientCard.style.display = 'none';
      errorCard.style.display = 'block';
      return;
    }
    const data = await res.json();
    updateUI(data);
  } catch {
    console.error('Erro ao buscar status da fila');
  }
}

// Socket.IO para atualizacoes em tempo real
const socket = io();

socket.on('connect', () => {
  socket.emit('join:patient', parseInt(queueId));
  if (currentExamTypeId) {
    socket.emit('join:exam', currentExamTypeId);
  }
});

socket.on('patient:called', (data) => {
  updateStatus('called', 0, data.examType);
});

socket.on('queue:updated', (data) => {
  // Recarregar status quando a fila mudar
  fetchStatus();
});

// Polling fallback a cada 30 segundos
setInterval(fetchStatus, 30000);

// Carregar status inicial
fetchStatus();
