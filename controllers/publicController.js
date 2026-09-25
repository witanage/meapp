const sections = require('../config/sections');
const genericModel = require('../models/genericModel');
const pool = require('../config/db');

exports.home = async (req, res, next) => {
  try {
    const [profileRows] = await pool.query('SELECT * FROM profile WHERE id = 1 LIMIT 1');

    const data = {};
    for (const key of Object.keys(sections)) {
      const cfg = sections[key];
      const model = genericModel(cfg.table, cfg.fields.map((f) => f.name));
      data[key] = await model.getAll(cfg.orderBy);
    }

    res.render('index', {
      pageTitle: 'Chinthaka Withanage | SQA Engineer',
      profile: profileRows[0] || {},
      data,
    });
  } catch (err) {
    next(err);
  }
};
