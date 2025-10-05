const express = require("express");
const db = require("../db");
const { ensureAuth, checkRole } = require("../middleware/auth");

const router = express.Router();

/**
  * Officer Dashboard
 */
router.get("/", ensureAuth, checkRole(["officer", "head", "admin"]), async (req, res) => {
  try {
    const deptId = req.session.user.department_id;

    // Total number of requests
    const total = await db.query(
      `SELECT COUNT(*) FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1`,
      [deptId]
    );

    // Number of requests awaiting review
    const pending = await db.query(
      `SELECT COUNT(*) FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1 AND r.status = 'Under Review'`,
      [deptId]
    );
// Number of approved requests
    const approved = await db.query(
      `SELECT COUNT(*) FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1 AND r.status = 'Approved'`,
      [deptId]
    );

    // Number of rejected requests
    const rejected = await db.query(
      `SELECT COUNT(*) FROM requests r
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1 AND r.status = 'Rejected'`,
      [deptId]
    );

    // Render dashboard with all stats
    res.render("officer/dashboard", {
      user: req.session.user,
      totalRequests: total.rows[0].count,
      pendingRequests: pending.rows[0].count,
      approvedRequests: approved.rows[0].count,
      rejectedRequests: rejected.rows[0].count
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error loading officer dashboard.");
    res.redirect("/dashboard");
  }
});

/**
 * List of requests related to the officer's office
 */
router.get("/requests", ensureAuth, checkRole(["officer", "head", "admin"]), async (req, res) => {
  try {
    const deptId = req.session.user.department_id;
    const result = await db.query(
      `SELECT r.*, u.name as citizen_name, s.name as service_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       WHERE s.department_id = $1
       ORDER BY r.created_at DESC`,
      [deptId]
    );
    res.render("officer/requests", { requests: result.rows });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error fetching department requests.");
    res.redirect("/dashboard/officer");
  }
});

/**
 * Change request status
 */
router.post("/requests/:id/status", ensureAuth, checkRole(["officer", "head", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Under Review", "Approved", "Rejected", "In-Progress"];
    if (!validStatuses.includes(status)) {
      req.flash("error_msg", "Invalid status.");
      return res.redirect(`/dashboard/officer/requests/${id}`);
    }

    // Status update
    await db.query(
      `UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    // Get the citizen user_id to send notifications
    const result = await db.query(
      `SELECT user_id FROM requests WHERE id = $1`,
      [id]
    );
    const citizenId = result.rows[0].user_id;

    // Create notification for the citizen
    await db.query(
      `INSERT INTO notifications (user_id, message)
       VALUES ($1, $2)`,
      [citizenId, `Your request #${id} has been ${status}.`]
    );

    req.flash("success_msg", "Request status updated.");
    res.redirect(`/dashboard/officer/requests/${id}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error updating request status.");
    res.redirect(`/dashboard/officer/requests/${id}`);
  }
});



/**
 * Request detail page
 */
router.get("/requests/:id", ensureAuth, checkRole(["officer", "head", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const deptId = req.session.user.department_id; 

    const result = await db.query(
      `SELECT r.*, u.name as citizen_name, u.email as citizen_email,
              s.name as service_name
       FROM requests r
       JOIN users u ON r.user_id = u.id
       JOIN services s ON r.service_id = s.id
       WHERE r.id = $1 AND s.department_id = $2`,  
      [id, deptId]
    );

    if (!result.rows.length) {
      req.flash("error_msg", "Request not found or you don't have access.");
      return res.redirect("/dashboard/officer/requests");
    }

    const request = result.rows[0];
    res.render("officer/request_detail", { request });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error fetching request details.");
    res.redirect("/dashboard/officer/requests");
  }
});


module.exports = router;
