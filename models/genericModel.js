const pool = require('../config/db');

// Generic CRUD helper for a whitelisted table + column set (config/sections.js).
// Table/column identifiers always come from our own trusted config, never from
// user input, so string interpolation of identifiers here is safe; all values
// are still passed as parameterized placeholders.
module.exports = function genericModel(table, allowedFields) {
  return {
    async getAll(orderBy = 'id ASC') {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` ORDER BY ${orderBy}`);
      return rows;
    },

    async getById(id) {
      const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
      return rows[0];
    },

    async create(data) {
      const cols = allowedFields.filter((f) => data[f] !== undefined);
      const colNames = cols.map((c) => `\`${c}\``).join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      const values = cols.map((c) => (data[c] === '' ? null : data[c]));
      const [result] = await pool.query(
        `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`,
        values
      );
      return result.insertId;
    },

    async update(id, data) {
      const cols = allowedFields.filter((f) => data[f] !== undefined);
      const setClause = cols.map((c) => `\`${c}\` = ?`).join(', ');
      const values = cols.map((c) => (data[c] === '' ? null : data[c]));
      values.push(id);
      await pool.query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, values);
    },

    async remove(id) {
      await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    },
  };
};
