const db = require('../config/database');

function nowBrasilia() {
  return new Date().toLocaleString('sv', { timeZone: 'America/Sao_Paulo' }).replace('T', ' ');
}

function todayBrasilia() {
  return new Date().toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' });
}

const stmts = {
  findByPhoneToday: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.phone = ? AND qe.queue_date = ?
      AND qe.status IN ('waiting', 'called')
  `),

  getNextPosition: db.prepare(`
    SELECT COALESCE(MAX(position), 0) + 1 AS next_position
    FROM queue_entries
    WHERE exam_type_id = ? AND queue_date = ?
  `),

  insert: db.prepare(`
    INSERT INTO queue_entries (patient_name, phone, exam_type_id, position, created_at, queue_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getById: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.id = ?
  `),

  getPositionAhead: db.prepare(`
    SELECT COUNT(*) AS ahead
    FROM queue_entries
    WHERE exam_type_id = ? AND queue_date = ?
      AND status = 'waiting' AND position < ?
  `),

  getQueueByExamType: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.exam_type_id = ? AND qe.queue_date = ?
    ORDER BY qe.position ASC
  `),

  getAllToday: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.queue_date = ?
    ORDER BY qe.exam_type_id, qe.position ASC
  `),

  getNextWaiting: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.exam_type_id = ? AND qe.queue_date = ?
      AND qe.status = 'waiting'
    ORDER BY qe.position ASC
    LIMIT 1
  `),

  callPatient: db.prepare(`
    UPDATE queue_entries SET status = 'called', called_at = ?
    WHERE id = ?
  `),

  completePatient: db.prepare(`
    UPDATE queue_entries SET status = 'completed', completed_at = ?
    WHERE id = ?
  `),

  cancelPatient: db.prepare(`
    UPDATE queue_entries SET status = 'cancelled'
    WHERE id = ?
  `),

  cleanupOld: db.prepare(`
    DELETE FROM queue_entries WHERE queue_date < ?
  `),

  getAllByDate: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.queue_date = ?
    ORDER BY qe.created_at ASC
  `),

  countWaitingByExam: db.prepare(`
    SELECT exam_type_id, COUNT(*) AS total
    FROM queue_entries
    WHERE queue_date = ? AND status = 'waiting'
    GROUP BY exam_type_id
  `),
};

const addToQueue = db.transaction((name, phone, examTypeId) => {
  const today = todayBrasilia();
  const now = nowBrasilia();
  const { next_position } = stmts.getNextPosition.get(examTypeId, today);
  const result = stmts.insert.run(name, phone, examTypeId, next_position, now, today);
  return stmts.getById.get(result.lastInsertRowid);
});

module.exports = {
  findByPhoneToday(phone) {
    return stmts.findByPhoneToday.get(phone, todayBrasilia());
  },

  addToQueue(name, phone, examTypeId) {
    return addToQueue(name, phone, examTypeId);
  },

  getById(id) {
    return stmts.getById.get(id);
  },

  getPositionAhead(examTypeId, position) {
    return stmts.getPositionAhead.get(examTypeId, todayBrasilia(), position).ahead;
  },

  getQueueByExamType(examTypeId) {
    return stmts.getQueueByExamType.all(examTypeId, todayBrasilia());
  },

  getAllToday() {
    return stmts.getAllToday.all(todayBrasilia());
  },

  callNext(examTypeId) {
    const patient = stmts.getNextWaiting.get(examTypeId, todayBrasilia());
    if (!patient) return null;
    stmts.callPatient.run(nowBrasilia(), patient.id);
    return stmts.getById.get(patient.id);
  },

  completePatient(id) {
    return stmts.completePatient.run(nowBrasilia(), id);
  },

  cancelPatient(id) {
    return stmts.cancelPatient.run(id);
  },

  cleanupOld() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffDate = cutoff.toLocaleDateString('sv', { timeZone: 'America/Sao_Paulo' });
    return stmts.cleanupOld.run(cutoffDate);
  },

  countWaitingByExam() {
    return stmts.countWaitingByExam.all(todayBrasilia());
  },

  getAllByDate(date) {
    return stmts.getAllByDate.all(date);
  },
};
