const { validationResult } = require("express-validator");

/**
 * Middleware: checks express-validator results and returns 400 if invalid.
 * Place after your validation chain in the route definition.
 *
 * Example:
 *   router.post("/signup", [body("email").isEmail()], validate, controller)
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = validate;
