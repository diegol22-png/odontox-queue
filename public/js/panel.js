const panelGrid = document.getElementById('panelGrid');
const alertEl = document.getElementById('alert');
const adminToggle = document.getElementById('adminToggle');
const adminContent = document.getElementById('adminContent');
const addExamBtn = document.getElementById('addExamBtn');
const newExamName = document.getElementById('newExamName');
const examList = document.getElementById('examList');

// Toggle admin
adminToggle.addEventListener('click', () => {
  adminContent.classList.toggle('show');
  if (adminContent.classList.contains('show')) {
    loadExamList();
  }
});

function showAlert(message, type) {
  alertEl.textContent = message;
  alertEl.className = `alert alert-${type} show`;
  setTimeout(() => { alertEl.className = 'alert'; }, 5000);
}

function getStatusBadge(status) {
  const labels = {
    waiting: 'Aguardando',
    called: 'Chamado',
    completed: 'Concluido',
    cancelled: 'Cancelado',
  };
  return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
}

function renderQueues(queues) {
  panelGrid.innerHTML = '';

  queues.forEach(q => {
    const waiting = q.patients.filter(p => p.status === 'waiting');
    const called = q.patients.filter(p => p.status === 'called');
    const active = [...called, ...waiting];

    const card = document.createElement('div');
    card.className = 'exam-card';
    card.innerHTML = `
      <div class="exam-card-header">
        <h3>${escapeHtml(q.examType.name)}</h3>
        <span class="count">${q.stats.waiting} aguardando</span>
      </div>
      <div class="exam-card-body">
        <button class="btn btn-success call-btn" onclick="callNext(${q.examType.id})" ${q.stats.waiting === 0 ? 'disabled' : ''}>
          Chamar Proximo
        </button>
        ${active.length === 0
          ? '<p class="empty-queue">Nenhum paciente na fila</p>'
          : `<ul class="patient-list">${active.map(p => `
              <li class="patient-item">
                <div class="patient-info">
                  <div class="patient-name">${escapeHtml(p.name)}</div>
                  <div class="patient-phone">${p.phone}</div>
                  ${p.status === 'waiting' && p.createdAt ? `<div class="patient-wait-time">⏱ ${formatWaitingTime(p.createdAt)}</div>` : ''}
                </div>
                ${getStatusBadge(p.status)}
                <div class="patient-actions">
                  ${p.status === 'called' ? `
                    <button class="btn btn-success btn-sm" onclick="completePatient(${p.id})">Concluir</button>
                  ` : ''}
                  ${p.status !== 'completed' && p.status !== 'cancelled' ? `
                    <button class="btn btn-danger btn-sm" onclick="cancelPatient(${p.id})">Retirar</button>
                  ` : ''}
                </div>
              </li>
            `).join('')}</ul>`
        }
        ${q.stats.completed > 0 ? `<p style="text-align:center;color:var(--gray-500);font-size:0.8rem;margin-top:0.75rem;">${q.stats.completed} atendido(s) hoje</p>` : ''}
      </div>
    `;
    panelGrid.appendChild(card);
  });
}

function formatWaitingTime(createdAt) {
  const diffMin = Math.floor((Date.now() - new Date(createdAt)) / 60000);
  if (diffMin < 1) return '< 1 min';
  if (diffMin < 60) return `${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadQueues() {
  try {
    const res = await fetch('/api/panel/queues');
    const queues = await res.json();
    renderQueues(queues);
  } catch {
    showAlert('Erro ao carregar filas.', 'error');
  }
}

async function callNext(examTypeId) {
  try {
    const res = await fetch('/api/panel/call-next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examTypeId }),
    });
    const data = await res.json();

    if (!res.ok) {
      showAlert(data.error ? data.error.message : 'Erro ao chamar paciente.', 'warning');
      return;
    }

    showAlert(`Paciente ${data.name} chamado com sucesso!`, 'success');
    loadQueues();
  } catch {
    showAlert('Erro de conexao.', 'error');
  }
}

async function completePatient(id) {
  try {
    const res = await fetch(`/api/panel/complete/${id}`, { method: 'PATCH' });
    if (res.ok) {
      showAlert('Paciente marcado como concluido.', 'success');
      loadQueues();
    }
  } catch {
    showAlert('Erro ao concluir paciente.', 'error');
  }
}

async function cancelPatient(id) {
  if (!confirm('Tem certeza que deseja retirar este paciente da fila?')) return;

  try {
    const res = await fetch(`/api/panel/cancel/${id}`, { method: 'PATCH' });
    if (res.ok) {
      showAlert('Paciente removido da fila.', 'info');
      loadQueues();
    }
  } catch {
    showAlert('Erro ao cancelar paciente.', 'error');
  }
}

// Admin - carregar lista de exames
async function loadExamList() {
  try {
    const res = await fetch('/api/exams');
    const exams = await res.json();
    examList.innerHTML = exams.map(e => `
      <div class="exam-list-item">
        <span>${escapeHtml(e.name)}</span>
        <button class="btn btn-danger btn-sm" onclick="removeExam(${e.id})">Remover</button>
      </div>
    `).join('');
  } catch {
    examList.innerHTML = '<p style="color:var(--danger)">Erro ao carregar exames.</p>';
  }
}

// Admin - adicionar exame
addExamBtn.addEventListener('click', async () => {
  const name = newExamName.value.trim();
  if (!name) return;

  try {
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json();
      showAlert(data.error ? data.error.message : 'Erro ao adicionar exame.', 'error');
      return;
    }

    newExamName.value = '';
    showAlert('Exame adicionado com sucesso!', 'success');
    loadExamList();
    loadQueues();
  } catch {
    showAlert('Erro de conexao.', 'error');
  }
});

async function removeExam(id) {
  if (!confirm('Tem certeza que deseja remover este tipo de exame?')) return;

  try {
    const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showAlert('Exame removido.', 'info');
      loadExamList();
      loadQueues();
    }
  } catch {
    showAlert('Erro ao remover exame.', 'error');
  }
}

// Socket.IO
const socket = io();

socket.on('connect', () => {
  socket.emit('join:panel');
});

socket.on('panel:refresh', () => {
  loadQueues();
});

socket.on('queue:updated', () => {
  loadQueues();
});

// Carregar filas inicialmente
loadQueues();

// Atualizar tempos de espera a cada minuto
setInterval(loadQueues, 60000);
