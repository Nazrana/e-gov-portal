const express = require("express");
const db = require("../db");
const { ensureAuth, checkRole } = require("../middleware/auth");

const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Middleware to get user notifications
router.use(ensureAuth, checkRole(["citizen"]), async (req, res, next) => {
  try {
    const notifsRes = await db.query(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.session.user.id]
    );
    res.locals.notifications = notifsRes.rows;
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.locals.notifications = []; 
  }
  next();
});


// Where to store files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    const uploadPath = path.join(__dirname, "..", "public", "uploads");
    // If it doesn't exist, create it.
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath); // uploads folder in the project root
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });
/**
 * Apply for a new service
 */
router.get("/apply", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const services = await db.query(
      `SELECT s.id, s.name, d.name as dept_name 
       FROM services s
       JOIN departments d ON s.department_id = d.id
       ORDER BY d.name, s.name`
    );
    res.render("citizen/apply", { services: services.rows });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading services.");
    res.redirect("/citizen");
  }
});

router.post("/apply", ensureAuth, checkRole(["citizen"]),upload.single("attachment"), async (req, res) => {
  try {
    const { service_id, description } = req.body;
    const filePath = req.file ? req.file.filename : null; 
    
   // Save the request to the file
      const result = await db.query(
        `INSERT INTO requests (user_id, service_id, status, description, attachment, created_at)
         VALUES ($1, $2, 'Submitted', $3, $4, NOW())
         RETURNING id`,
        [req.session.user.id, service_id, description, filePath]
      );

    
    const newRequestId = result.rows[0].id;

    // Create a notification for the user
      await db.query(
        `INSERT INTO notifications (user_id, message)
        VALUES ($1, $2)`,
        [req.session.user.id, `Your request #${newRequestId} has been submitted.`]
      );

    req.flash("success_msg", "Your request has been submitted.");

    res.redirect(`/citizen/requests/${newRequestId}/pay`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error submitting request.");
    res.redirect("/citizen/apply");
  }
});
;

/**
 * View my requests
 */
router.get("/requests", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, s.name as service_name, d.name as dept_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.session.user.id]
    );
    res.render("citizen/requests", { requests: result.rows });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading your requests.");
    res.redirect("/citizen");
  }
});

/**
 * Request detail page
 */
router.get("/requests/:id", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, s.name as service_name, d.name as dept_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, req.session.user.id]
    );

    if (!result.rows.length) {
      req.flash("error_msg", "Request not found.");
      return res.redirect("/citizen/requests");
    }

    res.render("citizen/request_detail", { request: result.rows[0] });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error fetching request details.");
    res.redirect("/citizen/requests");
  }
});
/**
 * Payment page (for a specific request)
 */
router.get("/requests/:id/pay", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const { id } = req.params;

    // Find the request
    const result = await db.query(
      `SELECT r.*, s.name as service_name, s.fee, d.name as dept_name
       FROM requests r
       JOIN services s ON r.service_id = s.id
       JOIN departments d ON s.department_id = d.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, req.session.user.id]
    );

    if (!result.rows.length) {
      req.flash("error_msg", "Request not found.");
      return res.redirect("/citizen/requests");
    }

    const request = result.rows[0];

    // If there was no cost, no need to pay
    if (!request.fee || request.fee == 0) {
      req.flash("info_msg", "This service does not require payment.");
      return res.redirect(`/citizen/requests/${id}`);
    }

    res.render("citizen/payment", { request, messages: req.flash()});
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading payment page.");
    res.redirect("/citizen/requests");
  }
});

/**
 * Process payment (simulate success)
 */
router.post("/requests/:id/pay", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const { id } = req.params;

  // Find the request and service
    const result = await db.query(
      `SELECT r.*, s.fee
       FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1 AND r.user_id = $2`,
      [id, req.session.user.id]
    );

    if (!result.rows.length) {
      req.flash("error_msg", "Request not found.");
      return res.redirect("/citizen/requests");
    }

    const request = result.rows[0];

    // Record payment in the payments table
    await db.query(
      `INSERT INTO payments (request_id, amount, status, paid_at, created_at)
       VALUES ($1, $2, 'Success', NOW(), NOW())`,
      [id, request.fee]
    );

// Create successful payment notification
    await db.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)`,
      [req.session.user.id, `Payment for request #${id} was successful.`]
    );

    req.flash("success_msg", "Payment successful!");
    res.redirect(`/citizen/requests/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Payment failed.");
    res.redirect("/citizen/requests");
  }
});


router.post("/requests/:id/pay", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const requestId = req.params.id;
    const amount = req.body.amount;

   

    // success message
    req.flash("success_msg", "Payment successful!");
    res.redirect(`/citizen/requests/${requestId}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Payment failed.");
    res.redirect(`/citizen/requests/${req.params.id}`);
  }
});

/**
 * Citizen Dashboard
 */

router.get("/", ensureAuth, checkRole(["citizen"]), async (req, res) => {
  try {
    const notifsRes = await db.query(
      `SELECT id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.session.user.id]
    );
    const notifications = notifsRes.rows;

    res.render("citizen/dashboard", {
      user: req.session.user,
      
    });
  } catch (err) {
    console.error("Error loading citizen dashboard:", err);
    res.render("citizen/dashboard", {
      user: req.session.user,
      notifications: []
    });
  }
});



module.exports = router;
