// middleware/auth.js

module.exports = {
  // Only allow if not logged in
  ensureAuth: (req, res, next) => {
    if (req.session.user) {
      return next();
    }
    req.flash("error_msg", "Please log in first.");
    return res.redirect("/auth/login");
  },

  // Only allow if not logged in
  forwardAuth: (req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    return res.redirect("/dashboard");
  },

  // Check user role
  checkRole: (roles) => {
    return (req, res, next) => {
      if (req.session.user && roles.includes(req.session.user.role)) {
        return next();
      }
      req.flash("error_msg", "You do not have the necessary access.");
      return res.redirect("/dashboard");
    };
  },
};
