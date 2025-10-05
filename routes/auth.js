const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser } = require("../models/User");
const { forwardAuth  } = require('../middleware/auth');

const router = express.Router();

// Login Page
router.get('/login', forwardAuth , (req, res) => {
  res.render('auth/login');
});

// Handle Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail( email );

  if (!user) {
    req.flash('error_msg', 'Invalid email or password');
    return res.redirect('/auth/login');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    req.flash('error_msg', 'Invalid email or password');
    return res.redirect('/auth/login');
  }

  req.session.user = { id: user.id, role: user.role, name: user.name, department_id: user.department_id};
  if (user.role === "admin") res.redirect("/admin");
  else if (user.role === "officer") res.redirect("/dashboard/officer");
  else res.redirect("/citizen");
});

// Register Page
router.get('/register', forwardAuth, (req, res) => {
  res.render('auth/register');
});

// Handle Register
router.post('/register', async (req, res) => {
  const { name, email, national_id, dob, contact_info, password, confirm_password } = req.body;

  if (!name || !email || !password || !confirm_password) {
    req.flash("error_msg", "Please fill in all required fields");
    return res.redirect("/auth/register");
  }

  if (password !== confirm_password) {
    req.flash("error_msg", "Passwords do not match");
    return res.redirect("/auth/register");
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      req.flash("error_msg", "Email already registered");
      return res.redirect("/auth/register");
    }

    const hashed = await bcrypt.hash(password, 10);

    await createUser({
      name,
      email,
      national_id,
      dob,
      contact_info,
      password: hashed,
      role: "citizen", // default role
    });

    req.flash("success_msg", "Registration successful, you can now log in");
    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Error during registration");
    res.redirect("/auth/register");
  }
});



// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
