// models/User.js
const db = require("../db");

// ایجاد کاربر جدید
async function createUser({ name, email, password, role = "citizen" }) {
  const result = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, email, password, role]
  );
  return result.rows[0];
}

// پیدا کردن کاربر با ایمیل
async function findUserByEmail(email) {
  const result = await db.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}

// پیدا کردن کاربر با آیدی
async function findUserById(id) {
  const result = await db.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
