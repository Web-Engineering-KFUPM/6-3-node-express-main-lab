# Backend Lab - Express

> **Note:**
> Please follow the `app.jsx` file to implement the TODOs.
>  
> **Due Date:** 6 April, 2026, **8:59 PM**

## Overview
This lab introduces students to **Express.js** — the core technologies used to build modern back-end web applications.  
Students will create a simple REST API that serves random quotes to a React frontend.  
The lab reinforces the concepts covered in ZyBooks sections **6.4**, providing hands-on practice with express, routes, middleware, and HTTP communication.

---

## Reading Assignments

- 6.4 Express

---

## Concepts Used in This Lab

### 1. What Is Express.js and Why Is It Used?
Express.js is a web framework for Node.js used to simplify route handling, middleware, and server logic.

**General Syntax:**
```js
import express from "express";
const app = express();
app.listen(3000, () => console.log("Server running"));
```

### 2. Middleware Functions
Middleware functions are functions that run between a request and a response.  
They are used for tasks such as logging, authentication, or enabling CORS.

**General Syntax:**
```js
app.use((req, res, next) => {
  console.log("Middleware executed");
  next();
});
```

### 3. How Web Servers Handle Requests, Responses & Routes

A **web server** listens for **requests** (like when a browser or front-end calls an API) and sends back **responses** (like JSON data).

To organize which request should return what data, we create **routes**.

#### Why do we make routes?
- Each URL (endpoint) should respond with different data.
- It keeps the API organized and clean.
- Example: `/students` and `/teachers` should return different information.
- Routes divide the backend logic based on purpose.

#### How do we make routes?
We define a specific endpoint using `app.get()`, `app.post()`, etc. and write code inside the route handler that tells the server what to return.

**General Syntax:**
```js
// GET route example
app.get("/students", (req, res) => {
  res.send("Here is students data (this is server response)");
});

// POST route example
app.post("/login", (req,res) => {
  res.json({ success: true });
});
```

### 4. What Are `package.json` and `package-lock.json` Files?
- **package.json** → Defines project metadata and lists dependencies.  
- **package-lock.json** → Records exact versions of installed packages to ensure consistent installs.

---

## 🧠 Code Syntax Summary for Concepts used in this lab

| Concept | Example Syntax |
|----------|----------------|
| Create a Server | `const app = express(); app.listen(3000);` |
| Define a Route | `app.get("/path", (req, res) => res.send("Message"));` |
| Send JSON Response | `res.json({ key: "value" });` |
| Use Middleware | `app.use(cors());` |
| Import a Module | `import { func } from "./file.js";` |
| Export a Function | `export function func() { ... }` |
| Random Number | `Math.floor(Math.random() * max);` |

---

## ✅ Submission Checklist

Before submitting your lab, make sure you have:

- [ ] Completed **all six TODOs** in the backend folder.  
- [ ] Created and exported the `getRandomInt()` function in `utils/random.js`.  
- [ ] Created and exported the `getRandomQuote()` function in `quotes.js`.  
- [ ] Added CORS and routes in `server.js`.  
- [ ] Successfully tested API routes in the browser or Postman.  
- [ ] The frontend displays quotes when clicking **“Get Quote”**.  
- [ ] Your server starts without errors using `node server.js`.  

---
