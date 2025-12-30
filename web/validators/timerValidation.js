import Joi from "joi";

const createSchema = Joi.object({
  storeDomain: Joi.string().optional(),
  productId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  message: Joi.string().allow("").optional(),
  styles: Joi.object().optional(),
  urgencyMinutes: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional(),
  metadata: Joi.object().optional(),
});

const updateSchema = Joi.object({
  productId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().optional(),
  message: Joi.string().allow("").optional(),
  styles: Joi.object().optional(),
  urgencyMinutes: Joi.number().integer().min(0).optional(),
  active: Joi.boolean().optional(),
  metadata: Joi.object().optional(),
}).or("productId", "startTime", "endTime", "message", "styles", "urgencyMinutes", "active", "metadata");

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({ error: "Validation failed", details });
    }
    req.body = value; // sanitized
    next();
  };
}

export const validateCreateTimer = validate(createSchema);
export const validateUpdateTimer = validate(updateSchema);
