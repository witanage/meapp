const sections = require('../config/sections');
const genericModel = require('../models/genericModel');

exports.dashboard = async (req, res, next) => {
  try {
    const counts = {};
    for (const key of Object.keys(sections)) {
      const cfg = sections[key];
      const model = genericModel(cfg.table, cfg.fields.map((f) => f.name));
      const rows = await model.getAll('id ASC');
      counts[key] = { title: cfg.title, count: rows.length };
    }
    res.render('admin/dashboard', { pageTitle: 'Dashboard', counts, sections });
  } catch (err) {
    next(err);
  }
};
