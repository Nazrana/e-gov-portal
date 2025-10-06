#  E-Gov Portal

**E-Gov Portal** is a web-based government service management system that allows **citizens** to digitally submit and track service requests, while **administrators** manage departments, services, and user requests efficiently.  

🔗 **Live Demo:** [https://e-gov-portal.onrender.com/](https://e-gov-portal.onrender.com/)  
💻 **Repository:** [https://github.com/Nazrana/e-gov-portal](https://github.com/Nazrana/e-gov-portal)

---

## 📘 Table of Contents
- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Run Locally](#run-locally)
- [Deployment](#deployment)
- [Author](#author)

---

## 🧩 About the Project

**E-Gov Portal** is a digital platform designed to bring government services closer to citizens through an easy-to-use, secure, and transparent online system.  

It enables:
- **Citizens** to submit service requests, upload required documents, and check their request status online.  
- **Officers** to review, verify, and process citizens’ requests assigned to their department, update request statuses, and communicate with applicants.
- **Admins** to manage users, departments, and services, and review or update requests with full control.

---

## ✨ Features

### Citizen Features
- Register and log in securely  
- Submit service requests with attachments  
- View request history and statuses (`Under Review`, `In-Progress`, `Approved`, `Rejected`)  
- Download approved attachments  

### Officer Features
- View and manage service requests assigned to their department
- Review citizen-submitted documents and details
- Update request statuses (e.g., move from Under Review → In-Progress → Approved/Rejected)

### Admin Features
- Dashboard with key system statistics  
- CRUD for Users, Departments, and Services  
- Manage and update request statuses  
- Search and filter data dynamically  

### ⚙️ General Features
- File upload support via **Multer**  
- Authentication and session handling  
- Flash messages for user feedback  
- Responsive interface using **TailwindCSS**  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **Templating** | EJS |
| **Styling** | TailwindCSS |
| **File Upload** | Multer |
| **Auth & Session** | express-session, connect-flash |
| **Deployment** | Render Cloud Platform |

---

## 📂 Project Structure

e-gov-portal/
├── public/ # Static assets (uploads, images, CSS)
├── routes/ # Application routes (citizen, admin, auth)
├── views/ # EJS templates for pages
│ ├── admin/
│ ├── auth/
│ ├── citizen/
│ └── partials/
├── db.js # Database connection setup
├── server.js # Main entry point
├── package.json
├── .env
├── .gitignore
└── README.md

yaml
Copy code

---

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nazrana/e-gov-portal.git
   cd e-gov-portal
Install dependencies:

bash
Copy code
npm install
🔐 Environment Variables
Create a .env file in the root directory with the following configuration:

ini
Copy code
PORT=5000
DATABASE_URL=postgresql://egov_portal_pd9m_user:LlGdv8U4CuabLURzcGgbfh2mnOQQHD1d@dpg-d3hncovdiees73cgk2tg-a/egov_portal_pd9m
SESSION_SECRET=SuperSecret123!@#
🧮 Database Setup
Open PostgreSQL and create the database:

sql
Copy code
CREATE DATABASE e_gov_portal;
Create the required tables (users, departments, services, requests)
or run your SQL schema/seed files manually.

Ensure the requests table includes:

sql
Copy code
status VARCHAR(50) CHECK (status IN ('Under Review', 'Approved', 'Rejected', 'In-Progress'))
▶️ Run Locally
Start the development server:

bash
Copy code
npm run dev
Or run in production mode:

bash
Copy code
npm start
Open in your browser:
👉 http://localhost:5000

☁️ Deployment
This project is deployed on Render Cloud.

Render Configuration
Build Command: npm install

Start Command: npm start

Environment Variables: same as .env file

Static Files: /public

Live link:
🌐 https://e-gov-portal.onrender.com/

👩‍💻 Author
Nazrana Sediqi
Full-Stack Developer 
📍 Herat, Afghanistan


