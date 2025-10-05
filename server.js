const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const db = require("./db");
const { ensureAuth, checkRole } = require("./middleware/auth");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')));

// Session & Flash
app.use(
  session({
    secret: "secretkey123",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// Inject flash messages & current user into all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.info_msg = req.flash("info_msg");
  res.locals.user = req.session.user || null;
  next();
});


// View Engine
app.set("view engine", "ejs");

// Routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

// Requests 
const requestRoutes = require("./routes/requests");
app.use("/requests", ensureAuth, checkRole(["citizen"]), requestRoutes);

// Admin dashboard
const adminRoutes = require("./routes/admin");
app.use("/admin", ensureAuth, checkRole(["admin"]), adminRoutes);

// Officer dashboard 
const officerRoutes = require("./routes/officer");
app.use("/dashboard/officer", ensureAuth, checkRole(["officer", "admin"]), officerRoutes);

// Citizen dashboard 
const citizenRoutes = require("./routes/citizen");
app.use("/citizen", ensureAuth, checkRole(["citizen"]), citizenRoutes);

//HOME PAGE
app.get("/", (req, res) => {
    res.render("index", { message: "Welcome to E-Government Portal " });
  });

// Dashboard 
app.get("/dashboard", ensureAuth, async (req, res) => {
  try {
    // Example query to get total requests (adjust to your DB)
    const totalRequests = await db.query("SELECT COUNT(*) AS total FROM requests");
    const pendingRequests = await db.query("SELECT COUNT(*) AS total FROM requests WHERE status='pending'");

    res.render("officer/dashboard", {
      user: req.session.user,
      totalRequests: parseInt(total.rows[0].count, 10),
      pendingRequests: parseInt(pending.rows[0].count, 10)
    });
  } catch (err) {
    console.error(err);
    res.render("officer/dashboard", {
      user: req.session.user,
      totalRequests: 0,
      pendingRequests: 0
    });
  }
});
// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


