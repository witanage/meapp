const genericModel = require('../models/genericModel');

// Builds list/add/edit/create/update/remove handlers for a section defined
// in config/sections.js, backed by the generic model.
module.exports = function crudFactory(cfg) {
  const fieldNames = cfg.fields.map((f) => f.name);
  const model = genericModel(cfg.table, fieldNames);

  function validate(body) {
    const errors = [];
    cfg.fields.forEach((f) => {
      if (f.required && (body[f.name] === undefined || body[f.name] === '')) {
        errors.push(`${f.label} is required`);
      }
    });
    return errors;
  }

  return {
    async list(req, res, next) {
      try {
        const rows = await model.getAll(cfg.orderBy);
        res.render('admin/list', {
          pageTitle: cfg.title,
          section: cfg.table,
          singular: cfg.singular,
          listColumns: cfg.listColumns,
          rows,
        });
      } catch (err) {
        next(err);
      }
    },

    addForm(req, res) {
      res.render('admin/form', {
        pageTitle: `Add ${cfg.singular}`,
        section: cfg.table,
        fields: cfg.fields,
        item: {},
        isEdit: false,
        errors: [],
      });
    },

    async create(req, res, next) {
      try {
        const errors = validate(req.body);
        if (errors.length) {
          return res.status(400).render('admin/form', {
            pageTitle: `Add ${cfg.singular}`,
            section: cfg.table,
            fields: cfg.fields,
            item: req.body,
            isEdit: false,
            errors,
          });
        }
        await model.create(req.body);
        res.redirect(`/admin/${cfg.table}`);
      } catch (err) {
        next(err);
      }
    },

    async editForm(req, res, next) {
      try {
        const item = await model.getById(req.params.id);
        if (!item) {
          return res.status(404).render('error', { pageTitle: 'Not Found', message: 'Record not found' });
        }
        res.render('admin/form', {
          pageTitle: `Edit ${cfg.singular}`,
          section: cfg.table,
          fields: cfg.fields,
          item,
          isEdit: true,
          errors: [],
        });
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const errors = validate(req.body);
        if (errors.length) {
          return res.status(400).render('admin/form', {
            pageTitle: `Edit ${cfg.singular}`,
            section: cfg.table,
            fields: cfg.fields,
            item: { ...req.body, id: req.params.id },
            isEdit: true,
            errors,
          });
        }
        await model.update(req.params.id, req.body);
        res.redirect(`/admin/${cfg.table}`);
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        await model.remove(req.params.id);
        res.redirect(`/admin/${cfg.table}`);
      } catch (err) {
        next(err);
      }
    },
  };
};
