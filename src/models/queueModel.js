const db = require('../config/database');

const stmts = {
  findByPhoneToday: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.phone = ? AND qe.queue_date = date('now', 'localtime')
      AND qe.status IN ('waiting', 'called')
  `),

  getNextPosition: db.prepare(`
    SELECT COALESCE(MAX(position), 0) + 1 AS next_position
    FROM queue_entries
    WHERE exam_type_id = ? AND queue_date = date('now', 'localtime')
  `),

  insert: db.prepare(`
    INSERT INTO queue_entries (patient_name, phone, exam_type_id, position)
    VALUES (?, ?, ?, ?)
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
    WHERE exam_type_id = ? AND queue_date = date('now', 'localtime')
      AND status = 'waiting' AND position < ?
  `),

  getQueueByExamType: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.exam_type_id = ? AND qe.queue_date = date('now', 'localtime')
    ORDER BY qe.position ASC
  `),

  getAllToday: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.queue_date = date('now', 'localtime')
    ORDER BY qe.exam_type_id, qe.position ASC
  `),

  getNextWaiting: db.prepare(`
    SELECT qe.*, et.name AS exam_name
    FROM queue_entries qe
    JOIN exam_types et ON et.id = qe.exam_type_id
    WHERE qe.exam_type_id = ? AND qe.queue_date = date('now', 'localtime')
      AND qe.status = 'waiting'
    ORDER BY qe.position ASC
    LIMIT 1
  `),

  callPatient: db.prepare(`
    UPDATE queue_entries SET status = 'called', called_at = datetime('now', 'localtime')
    WHERE id = ?
  `),

  completePatient: db.prepare(`
    UPDATE queue_entries SET status = 'completed', completed_at = datetime('now', 'localtime')
    WHERE id = ?
  `),

  cancelPatient: db.prepare(`
    UPDATE queue_entries SET status = 'cancelled'
    WHERE id = ?
  `),

  cleanupOld: db.prepare(`
    DELETE FROM queue_entries WHERE queue_date < date('now', 'localtime', '-7 days')
  `),

  countWaitingByExam: db.prepare(`
    SELECT exam_type_id, COUNT(*) AS total
    FROM queue_entries
    WHERE queue_date = date('now', 'localtime') AND status = 'waiting'
    GROUP BY exam_type_id
  `),
};

const addToQueue = db.transaction((name, phone, examTypeId) => {
  const { next_position } = stmts.getNextPosition.get(examTypeId);
  const result = stmts.insert.run(name, phone, examTypeId, next_position);
  return stmts.getById.get(result.lastInsertRowid);
});

module.exports = {
  findByPhoneToday(phone) {
    return stmts.findByPhoneToday.get(phone);
  },

  addToQueue(name, phone, examTypeId) {
    return addToQueue(name, phone, examTypeId);
  },

  getById(id) {
    return stmts.getById.get(id);
  },

  getPositionAhead(examTypeId, position) {
    return stmts.getPositionAhead.get(examTypeId, position).ahead;
  },

  getQueueByExamType(examTypeId) {
    return stmts.getQueueByExamType.all(examTypeId);
  },

  getAllToday() {
    return stmts.getAllToday.all();
  },

  callNext(examTypeId) {
    const patient = stmts.getNextWaiting.get(examTypeId);
    if (!patient) return null;
    stmts.callPatient.run(patient.id);
    return stmts.getById.get(patient.id);
  },

  completePatient(id) {
    return stmts.completePatient.run(id);
  },

  cancelPatient(id) {
    return stmts.cancelPatient.run(id);
  },

  cleanupOld() {
    return stmts.cleanupOld.run();
  },

  countWaitingByExam() {
    return stmts.countWaitingByExam.all();
  },
};
