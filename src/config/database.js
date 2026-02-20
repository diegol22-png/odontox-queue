const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/odontox.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS exam_types (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL UNIQUE,
    active     INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS queue_entries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name  TEXT    NOT NULL,
    phone         TEXT    NOT NULL,
    exam_type_id  INTEGER NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'waiting'
                          CHECK(status IN ('waiting', 'called', 'completed', 'cancelled')),
    position      INTEGER NOT NULL,
    called_at     TEXT,
    completed_at  TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now', 'localtime')),
    queue_date    TEXT    NOT NULL DEFAULT (date('now', 'localtime')),
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id)
  );

  CREATE INDEX IF NOT EXISTS idx_queue_phone_date
    ON queue_entries(phone, queue_date);

  CREATE INDEX IF NOT EXISTS idx_queue_exam_status
    ON queue_entries(exam_type_id, status, position);

  CREATE INDEX IF NOT EXISTS idx_queue_date
    ON queue_entries(queue_date);
`);

const seedExams = db.prepare('INSERT OR IGNORE INTO exam_types (name) VALUES (?)');
const initialExams = [
  'Raio-X Panoramico',
  'Tomografia',
  'Raio-X Periapical',
  'Documentacao Ortodontica',
];

const seedTransaction = db.transaction(() => {
  for (const exam of initialExams) {
    seedExams.run(exam);
  }
});
seedTransaction();

module.exports = db;
