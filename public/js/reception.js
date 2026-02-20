const form = document.getElementById('queueForm');
const alertEl = document.getElementById('alert');
const submitBtn = document.getElementById('submitBtn');
const examSelect = document.getElementById('examType');
const phoneInput = document.getElementById('phone');
const formSection = document.getElementById('formSection');
const successSection = document.getElementById('successSection');

// Carregar tipos de exame
async function loadExams() {
  try {
    const res = await fetch('/api/exams');
    const exams = await res.json();
    exams.forEach(exam => {
      const option = document.createElement('option');
      option.value = exam.id;
      option.textContent = exam.name;
      examSelect.appendChild(option);
    });
  } catch {
    showAlert('Erro ao carregar tipos de exame. Recarregue a pagina.', 'error');
  }
}

// Mascara telefone - apenas numeros
phoneInput.addEventListener('input', () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, '').substring(0, 11);
});

// Mostrar alerta
function showAlert(message, type) {
  alertEl.textContent = message;
  alertEl.className = `alert alert-${type} show`;
}

function hideAlert() {
  alertEl.className = 'alert';
}

// Enviar formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const name = document.getElementById('name').value.trim();
  const phone = phoneInput.value.replace(/\D/g, '');
  const examTypeId = parseInt(examSelect.value);

  // Validacao client-side
  if (name.length < 2) {
    showAlert('Nome deve ter pelo menos 2 caracteres.', 'error');
    return;
  }

  if (phone.length < 10 || phone.length > 11) {
    showAlert('Telefone deve ter 10 ou 11 digitos (DDD + numero).', 'error');
    return;
  }

  if (!examTypeId) {
    showAlert('Selecione o tipo de exame.', 'error');
    return;
  }

  // Desabilitar botao
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Processando...';

  try {
    const res = await fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, examTypeId }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.error && data.error.code === 'DUPLICATE_PHONE') {
        showAlert(data.error.message, 'warning');
      } else {
        showAlert(data.error ? data.error.message : 'Erro ao entrar na fila.', 'error');
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar na Fila';
      return;
    }

    // Sucesso
    formSection.style.display = 'none';
    hideAlert();
    document.getElementById('queueNumber').textContent = data.position;
    document.getElementById('queueLink').href = `/fila/${data.id}`;
    successSection.classList.add('show');
  } catch {
    showAlert('Erro de conexao. Verifique sua internet e tente novamente.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Entrar na Fila';
  }
});

// Inicializar
loadExams();
