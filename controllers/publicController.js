const sections = require('../config/sections');
const genericModel = require('../models/genericModel');
const pool = require('../config/db');

exports.home = async (req, res, next) => {
  try {
    const [profileRows] = await pool.query('SELECT * FROM profile WHERE id = 1 LIMIT 1');
    const [cvRows] = await pool.query('SELECT id FROM cv_file WHERE id = 1 AND enabled = 1 LIMIT 1');
    const [settingRows] = await pool.query('SELECT section_key, visible FROM section_settings');
    const visible = {};
    settingRows.forEach((r) => { visible[r.section_key] = !!r.visible; });

    const data = {};
    for (const key of Object.keys(sections)) {
      const cfg = sections[key];
      const model = genericModel(cfg.table, cfg.fields.map((f) => f.name));
      data[key] = await model.getAll(cfg.orderBy);
    }

    res.render('index', {
      pageTitle: 'Chinthaka Withanage | SQA Engineer',
      profile: profileRows[0] || {},
      hasCv: cvRows.length > 0,
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || '',
      visible,
      data,
    });
  } catch (err) {
    next(err);
  }
};
