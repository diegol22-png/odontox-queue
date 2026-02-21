const queueModel = require('../models/queueModel');
const examModel = require('../models/examModel');
const whatsappService = require('./whatsappService');
const { AppError } = require('../middleware/errorHandler');

let io = null;

function setIO(socketIO) {
  io = socketIO;
}

function emitQueueUpdate(examTypeId) {
  if (!io) return;
  const queue = queueModel.getQueueByExamType(examTypeId);
  io.to(`exam:${examTypeId}`).emit('queue:updated', { examTypeId, queue });
  io.to('panel').emit('panel:refresh');
}

async function enqueue(name, phone, examTypeId) {
  const exam = examModel.getById(examTypeId);
  if (!exam || !exam.active) {
    throw new AppError('Tipo de exame invalido ou inativo', 400, 'INVALID_EXAM');
  }

  const existing = queueModel.findByPhoneToday(phone);
  if (existing) {
    throw new AppError(
      'Este telefone ja esta na fila. Acompanhe sua posicao no link enviado pelo WhatsApp.',
      409,
      'DUPLICATE_PHONE'
    );
  }

  const entry = queueModel.addToQueue(name, phone, examTypeId);
  const ahead = queueModel.getPositionAhead(examTypeId, entry.position);

  // WhatsApp - fire and forget
  whatsappService.sendQueueConfirmation(phone, name, ahead + 1, entry.exam_name, entry.id, exam.queue_message)
    .catch(err => console.error('[WhatsApp] Erro ao enviar confirmacao:', err.message));

  emitQueueUpdate(examTypeId);

  return {
    id: entry.id,
    name: entry.patient_name,
    phone: entry.phone,
    examType: entry.exam_name,
    position: ahead + 1,
    status: entry.status,
  };
}

function getPatientStatus(id) {
  const entry = queueModel.getById(id);
  if (!entry) {
    throw new AppError('Paciente nao encontrado na fila', 404, 'NOT_FOUND');
  }

  const ahead = entry.status === 'waiting'
    ? queueModel.getPositionAhead(entry.exam_type_id, entry.position)
    : 0;

  return {
    id: entry.id,
    name: entry.patient_name,
    phone: entry.phone,
    examType: entry.exam_name,
    examTypeId: entry.exam_type_id,
    position: ahead + 1,
    status: entry.status,
    createdAt: entry.created_at,
    calledAt: entry.called_at,
  };
}

async function callNext(examTypeId) {
  const exam = examModel.getById(examTypeId);
  if (!exam) {
    throw new AppError('Tipo de exame invalido', 400, 'INVALID_EXAM');
  }

  const patient = queueModel.callNext(examTypeId);
  if (!patient) {
    throw new AppError('Nenhum paciente na fila para este exame', 404, 'QUEUE_EMPTY');
  }

  // WhatsApp - fire and forget
  whatsappService.sendCallNotification(patient.phone, patient.patient_name, patient.exam_name, exam.call_message)
    .catch(err => console.error('[WhatsApp] Erro ao enviar chamada:', err.message));

  if (io) {
    io.to(`patient:${patient.id}`).emit('patient:called', {
      id: patient.id,
      name: patient.patient_name,
      examType: patient.exam_name,
    });
  }

  emitQueueUpdate(examTypeId);

  return {
    id: patient.id,
    name: patient.patient_name,
    phone: patient.phone,
    examType: patient.exam_name,
    status: 'called',
  };
}

function completePatient(id) {
  const entry = queueModel.getById(id);
  if (!entry) {
    throw new AppError('Paciente nao encontrado', 404, 'NOT_FOUND');
  }
  queueModel.completePatient(id);
  emitQueueUpdate(entry.exam_type_id);
  return { success: true };
}

function cancelPatient(id) {
  const entry = queueModel.getById(id);
  if (!entry) {
    throw new AppError('Paciente nao encontrado', 404, 'NOT_FOUND');
  }
  queueModel.cancelPatient(id);
  emitQueueUpdate(entry.exam_type_id);
  return { success: true };
}

function getHistoryByDate(date) {
  const entries = queueModel.getAllByDate(date);
  return entries.map(e => ({
    id: e.id,
    name: e.patient_name,
    phone: e.phone.substring(0, 3) + '****' + e.phone.substring(e.phone.length - 4),
    status: e.status,
    position: e.position,
    createdAt: e.created_at,
    calledAt: e.called_at,
    examType: e.exam_name,
  }));
}

function getAllQueues() {
  const exams = examModel.getAll();
  const allEntries = queueModel.getAllToday();

  return exams.map(exam => {
    const patients = allEntries.filter(e => e.exam_type_id === exam.id);
    const waiting = patients.filter(p => p.status === 'waiting');
    const called = patients.filter(p => p.status === 'called');
    const completed = patients.filter(p => p.status === 'completed');

    return {
      examType: exam,
      patients: patients.map(p => ({
        id: p.id,
        name: p.patient_name,
        phone: p.phone.substring(0, 3) + '****' + p.phone.substring(p.phone.length - 4),
        status: p.status,
        position: p.position,
        createdAt: p.created_at,
        calledAt: p.called_at,
      })),
      stats: {
        waiting: waiting.length,
        called: called.length,
        completed: completed.length,
        total: patients.length,
      },
    };
  });
}

module.exports = {
  setIO,
  enqueue,
  getPatientStatus,
  callNext,
  completePatient,
  cancelPatient,
  getAllQueues,
  getHistoryByDate,
};
