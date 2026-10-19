const sections = require('../config/sections');
const genericModel = require('../models/genericModel');
const pool = require('../config/db');

exports.dashboard = async (req, res, next) => {
  try {
    const [settingRows] = await pool.query('SELECT section_key, visible FROM section_settings');
    const visible = {};
    settingRows.forEach((r) => { visible[r.section_key] = !!r.visible; });
    const counts = {};
    for (const key of Object.keys(sections)) {
      const cfg = sections[key];
      const model = genericModel(cfg.table, cfg.fields.map((f) => f.name));
      const rows = await model.getAll('id ASC');
      counts[key] = { title: cfg.title, count: rows.length, visible: visible[key] !== false };
    }
    res.render('admin/dashboard', { pageTitle: 'Dashboard', counts, sections });
  } catch (err) {
    next(err);
  }
};

exports.toggleVisibility = async (req, res, next) => {
  try {
    const key = req.params.key;
    if (!Object.prototype.hasOwnProperty.call(sections, key)) return next();
    await pool.query(
      `INSERT INTO section_settings (section_key, visible) VALUES (?, 0)
       ON DUPLICATE KEY UPDATE visible = 1 - visible`,
      [key]
    );
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
};
