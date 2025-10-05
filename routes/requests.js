// routes/requests.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { ensureAuth, checkRole  } = require("../middleware/auth");

const router = express.Router();

// Upload settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Application form (citizen only)
router.get("/new", checkRole ("citizen"), async (req, res) => {
    const services = await db.query(
        `SELECT s.id, s.name, d.name AS department_name
         FROM services s
         JOIN departments d ON s.department_id = d.id
         ORDER BY d.name, s.name`
      );
      res.render("requests/new", { services: services.rows });
    });

// Save request
router.post(
    "/new",
    checkRole ("citizen"),
    upload.single("attachment"),
    async (req, res) => {
      try {
        const { service_id, description } = req.body;
        const filePath = req.file ? "/uploads/" + req.file.filename : null;
  
        await db.query(
          `INSERT INTO requests (user_id, service_id, description, attachment)
           VALUES ($1, $2, $3, $4)`,
          [req.session.user.id, service_id, description, filePath]
        );
  
        req.flash("success", "Your request has been registered.");
        res.redirect("/requests/my");
      } catch (err) {
        console.error(err);
        req.flash("error", "Error submitting request.");
        res.redirect("/requests/new");
      }
    }
  );

// View my requests (citizen only)
router.get("/my", checkRole ("citizen"), async (req, res) => {
  const requests = await db.query(
    `SELECT r.*, s.name as service_name, d.name as department_name
     FROM requests r
     JOIN services s ON r.service_id = s.id
     JOIN departments d ON s.department_id = d.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [req.session.user.id]
  );
  res.render("requests/my", { requests: requests.rows });
});

// View department requests
router.get("/department", checkRole (["officer", "head", "admin"]), async (req, res) => {
    try {
      const deptId = req.session.user.department_id; // Officer's department
      const requests = await db.query(
        `SELECT r.*, u.name as citizen_name, s.name as service_name
         FROM requests r
         JOIN users u ON r.user_id = u.id
         JOIN services s ON r.service_id = s.id
         WHERE s.department_id = $1
         ORDER BY r.created_at DESC`,
        [deptId]
      );
  
      res.render("requests/department", { requests: requests.rows });
    } catch (err) {
      console.error(err);
      req.flash("error", "Error fetching department requests.");
      res.redirect("/");
    }
  });

  // Change request status
router.post("/update-status/:id", checkRole (["officer", "head", "admin"]), async (req, res) => {
    try {
      const { status } = req.body;
      const requestId = req.params.id;

      // Only valid statuses
      const validStatuses = ['Under Review','Approved','Rejected','In-Progress'];
      if (!validStatuses.includes(status)) {
        req.flash("error", "Invalid status.");
        return res.redirect("/requests/department");
      }
  
      await db.query(
        `UPDATE requests SET status=$1, updated_at=NOW() WHERE id=$2`,
        [status, requestId]
      );
  
      req.flash("success", "Request status updated.✅");
      res.redirect("/requests/department");
    } catch (err) {
      console.error(err);
      req.flash("error", "Error updating request status.");
      res.redirect("/requests/department");
    }
  });

  // View Office Requests (Officer / Head)
router.get("/department", checkRole(["officer", "head"]), async (req, res) => {
  try {
      const deptId = req.session.user.department_id;
      const requests = await db.query(
          `SELECT r.*, u.name AS citizen_name, s.name AS service_name
           FROM requests r
           JOIN users u ON r.user_id = u.id
           JOIN services s ON r.service_id = s.id
           WHERE s.department_id = $1
           ORDER BY r.created_at DESC`,
          [deptId]
      );

      res.render("officer/dashboard", { requests: requests.rows });
  } catch (err) {
      console.error(err);
      req.flash("error", "Error fetching department requests.");
      res.redirect("/dashboard");
  }
});

// View request details and change status
router.get("/department/:id", checkRole(["officer", "head"]), async (req, res) => {
  try {
      const { id } = req.params;
      const request = await db.query(
          `SELECT r.*, u.name AS citizen_name, s.name AS service_name
           FROM requests r
           JOIN users u ON r.user_id = u.id
           JOIN services s ON r.service_id = s.id
           WHERE r.id=$1`,
          [id]
      );

      if (request.rows.length === 0) {
          req.flash("error", "Request not found.");
          return res.redirect("/requests/department");
      }

      res.render("officer/request_detail", { request: request.rows[0] });
  } catch (err) {
      console.error(err);
      req.flash("error", "Error fetching request details.");
      res.redirect("/requests/department");
  }
});

// Update request status
router.post("/department/:id/update-status", checkRole(["officer", "head"]), async (req, res) => {
  try {
      const { id } = req.params;
      const { status } = req.body;

      await db.query(`UPDATE requests SET status=$1, updated_at=NOW() WHERE id=$2`, [status, id]);

      req.flash("success", "Request status updated.");
      res.redirect(`/requests/department/${id}`);
  } catch (err) {
      console.error(err);
      req.flash("error", "Error updating request status.");
      res.redirect("/requests/department");
  }
});

  
module.exports = router;
