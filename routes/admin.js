const express = require("express");
const router = express.Router();
const db = require("../db");
const { checkRole  } = require("../middleware/auth");

// just for Admin
router.use(checkRole ("admin"));

/* ========== Dashboard ========== */
router.get("/", async (req, res) => {
  try {
    const [users, deps, services, requests] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS count FROM users"),
      db.query("SELECT COUNT(*)::int AS count FROM departments"),
      db.query("SELECT COUNT(*)::int AS count FROM services"),
      db.query("SELECT COUNT(*)::int AS count FROM requests") 
    ]);

    const stats = {
      users: users.rows[0].count,
      departments: deps.rows[0].count,
      services: services.rows[0].count,
      requests: requests.rows[0].count
    };

    res.render("admin/dashboard", {
      user: req.session.user,
      stats
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    req.flash("error_msg", "Error loading admin dashboard.");
    res.redirect("/");
  }
});

/* ========== USERS CRUD ========== */
// Index with search
router.get("/users", async (req, res) => {
  const search = req.query.search || "";  
  let query = "SELECT * FROM users";
  let params = [];

  if (search) {
    query += " WHERE name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1";
    params.push(`%${search}%`);
  }

  query += " ORDER BY id";

  const result = await db.query(query, params);
  res.render("admin/users/index", { users: result.rows, search });
});


// New form
router.get("/users/new", (req, res) => {
  res.render("admin/users/new");
});

// Create
router.post("/users", async (req, res) => {
  const { name, email, role, password } = req.body;
  await db.query(
    "INSERT INTO users (name, email, role, password) VALUES ($1,$2,$3,$4)",
    [name, email, role, password]
  );
  res.redirect("/admin/users");
});

// Edit form
router.get("/users/:id/edit", async (req, res) => {
  const result = await db.query("SELECT * FROM users WHERE id=$1", [
    req.params.id,
  ]);
  res.render("admin/users/edit", { user: result.rows[0] });
});

// Update
router.put("/users/:id", async (req, res) => {
  const { name, email, role } = req.body;
  await db.query(
    "UPDATE users SET name=$1, email=$2, role=$3 WHERE id=$4",
    [name, email, role, req.params.id]
  );
  res.redirect("/admin/users");
});

// Delete
router.delete("/users/:id", async (req, res) => {
  await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.redirect("/admin/users");
});

/* ========== DEPARTMENTS CRUD ========== */
// Index with search for Departments
router.get("/departments", async (req, res) => {
  const search = req.query.search || "";
  let query = "SELECT * FROM departments";
  let params = [];

  if (search) {
    query += " WHERE name ILIKE $1 ";
    params.push(`%${search}%`);
  }

  query += " ORDER BY id";

  const result = await db.query(query, params);
  res.render("admin/departments/index", { departments: result.rows, search });
});
;

router.get("/departments/new", (req, res) => {
  res.render("admin/departments/new");
});

router.post("/departments", async (req, res) => {
  const { name, description } = req.body;
  await db.query("INSERT INTO departments (name, description) VALUES ($1,$2)", [
    name,
    description,
  ]);
  res.redirect("/admin/departments");
});

router.get("/departments/:id/edit", async (req, res) => {
  const result = await db.query("SELECT * FROM departments WHERE id=$1", [
    req.params.id,
  ]);
  res.render("admin/departments/edit", { department: result.rows[0] });
});

router.put("/departments/:id", async (req, res) => {
  const { name, description } = req.body;
  await db.query(
    "UPDATE departments SET name=$1, description=$2 WHERE id=$3",
    [name, description, req.params.id]
  );
  res.redirect("/admin/departments");
});

router.delete("/departments/:id", async (req, res) => {
  await db.query("DELETE FROM departments WHERE id=$1", [req.params.id]);
  res.redirect("/admin/departments");
});

/* ========== SERVICES CRUD ========== */
router.get("/services", async (req, res) => {
  const search = req.query.search || "";

  const result = await db.query(
    `SELECT s.*, d.name AS "departmentName"
     FROM services s
     JOIN departments d ON s.department_id = d.id
     WHERE s.name ILIKE $1 OR d.name ILIKE $1
     ORDER BY s.id`,
    [`%${search}%`]
  );

  res.render("admin/services/index", {
    services: result.rows,
    search
  });
});


router.get("/services/new", async (req, res) => {
  const deps = await db.query("SELECT * FROM departments");
  res.render("admin/services/new", { departments: deps.rows });
});

router.post("/services", async (req, res) => {
  const { name, description, departmentId } = req.body;
  await db.query(
    "INSERT INTO services (name, description, department_id) VALUES ($1,$2,$3)",
    [name, description, departmentId]
  );
  res.redirect("/admin/services");
});

router.get("/services/:id/edit", async (req, res) => {
  const service = await db.query("SELECT * FROM services WHERE id=$1", [
    req.params.id,
  ]);
  const deps = await db.query("SELECT * FROM departments");
  res.render("admin/services/edit", {
    service: service.rows[0],
    departments: deps.rows,
  });
});

router.put("/services/:id", async (req, res) => {
  const { name, description, departmentId } = req.body;
  await db.query(
    "UPDATE services SET name=$1, description=$2, department_id=$3 WHERE id=$4",
    [name, description, departmentId, req.params.id]
  );
  res.redirect("/admin/services");
});

router.delete("/services/:id", async (req, res) => {
  await db.query("DELETE FROM services WHERE id=$1", [req.params.id]);
  res.redirect("/admin/services");
});

/* ========== REQUESTS CRUD ========== */
router.get("/requests", async (req, res) => {
  try {
    const search = req.query.search || "";
    let query = `
      SELECT r.*, u.name AS citizenName, s.name AS serviceName
      FROM requests r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
    `;
    const params = [];
    if (search) {
      query += ` WHERE u.name ILIKE $1 OR s.name ILIKE $1 OR r.status ILIKE $1`;
      params.push(`%${search}%`);
    }
    query += " ORDER BY r.id DESC";

    const result = await db.query(query, params);
    res.render("admin/requests/index", { requests: result.rows, search });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error fetching requests.");
    res.redirect("/admin");
  }
});


router.get("/requests/new", async (req, res) => {
  const citizens = await db.query("SELECT id, name FROM users WHERE role='citizen'");
  const services = await db.query("SELECT id, name FROM services");
  res.render("admin/requests/new", {
    citizens: citizens.rows,
    services: services.rows,
  });
});

router.post("/requests", async (req, res) => {
  const { citizenId, serviceId, status } = req.body;
  await db.query(
    "INSERT INTO requests (user_id, service_id, status) VALUES ($1,$2,$3)",
    [citizenId, serviceId, status]
  );
  res.redirect("/admin/requests");
});

router.get("/requests/:id/edit", async (req, res) => {
  const r = await db.query("SELECT * FROM requests WHERE id=$1", [
    req.params.id,
  ]);
  const citizens = await db.query("SELECT id, name FROM users WHERE role='citizen'");
  const services = await db.query("SELECT id, name FROM services");
  res.render("admin/requests/edit", {
    request: r.rows[0],
    citizens: citizens.rows,
    services: services.rows,
  });
});

router.put("/requests/:id", async (req, res) => {
  const { citizenId, serviceId, status } = req.body;
  await db.query(
    "UPDATE requests SET user_id=$1, service_id=$2, status=$3 WHERE id=$4",
    [citizenId, serviceId, status, req.params.id]
  );
  res.redirect("/admin/requests");
});

router.delete("/requests/:id", async (req, res) => {
  await db.query("DELETE FROM requests WHERE id=$1", [req.params.id]);
  res.redirect("/admin/requests");
});

module.exports = router;
