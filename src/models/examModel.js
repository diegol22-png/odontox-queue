const db = require('../config/database');

const stmts = {
  getAll: db.prepare('SELECT id, name FROM exam_types WHERE active = 1 ORDER BY name'),
  getById: db.prepare('SELECT id, name, active FROM exam_types WHERE id = ?'),
  create: db.prepare('INSERT INTO exam_types (name) VALUES (?)'),
  deactivate: db.prepare('UPDATE exam_types SET active = 0 WHERE id = ?'),
  activate: db.prepare('UPDATE exam_types SET active = 1 WHERE id = ?'),
  rename: db.prepare('UPDATE exam_types SET name = ? WHERE id = ?'),
};

module.exports = {
  getAll() {
    return stmts.getAll.all();
  },

  getById(id) {
    return stmts.getById.get(id);
  },

  create(name) {
    const result = stmts.create.run(name);
    return { id: result.lastInsertRowid, name };
  },

  deactivate(id) {
    return stmts.deactivate.run(id);
  },

  activate(id) {
    return stmts.activate.run(id);
  },

  rename(id, name) {
    return stmts.rename.run(name, id);
  },
};
