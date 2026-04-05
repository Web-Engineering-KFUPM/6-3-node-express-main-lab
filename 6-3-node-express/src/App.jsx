/*
===================================================================
Back-end Lab — Express
===================================================================

===================================================================
LAB SETUP INSTRUCTIONS
===================================================================

1. Navigate to the project directory:
   Open your terminal and run:
      cd 6-3-node-express-main

2. Install project dependencies:
   Run either of these commands:
      - npm i
        OR
      - npm install
        OR
      - npm install express cors morgan

   Note:
   - If express and cors are not installed, install them manually:
      npm install express cors
   - To add request logging in this lab, also install morgan:
      npm install morgan

3. Start the front server server from 6-3-node-express-main\6-3-node-express path:
   Run:
      npm run dev

4. Start the back-end server from a separate terminal, path: 6-3-node-express-main\6-3-node-express\backend:
   Run:
      node server.js
   Note: Start the back-end server after creating the server in server.js file.

   If your system blocks running npm commands (especially on Windows PowerShell),
   run this command first to allow script execution:
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

===================================================================
Back-end Lab — Express (TODO GUIDE)
===================================================================

-------------------------------------------------------------------
TODO 1:
Initialize Express App
-------------------------------------------------------------------

In server.js, set up the Express server.

Tasks:
- Import express
- Create the app
- Define PORT

Hint:
- call the imported express function

Syntax hint:
   import ______ from "express";
   const app = ______();
   const PORT = ______;

-------------------------------------------------------------------
TODO 2:
Create getRandomInt Function
-------------------------------------------------------------------

In utils/random.js, create a function named getRandomInt and pass max as a parameter to the function.

Goal:
Return a random integer between 0 and (max - 1)

Hints:
- Use Math.random()
- Multiply by max
- Use Math.floor()

Syntax hint:
   return Math.floor(______ * ______);

-------------------------------------------------------------------
TODO 3:
Create getRandomQuote Function
-------------------------------------------------------------------

In quotes.js, export a function named getRandomQuote.

Goal:
Return one random quote from the quotes array.

Important:
- Use getRandomInt(max)
- Import random.js file to quote.js to use getRandomInt function.

Steps:
- Generate random index
- Return quote using that index

Syntax hint:
   const index = ______(quotes.length);
   return ______[index];

-------------------------------------------------------------------
TODO 4:
Enable CORS
-------------------------------------------------------------------

In server.js, allow frontend to access backend.

Tasks:
- Import cors
- Use it as middleware

Syntax hint:
   import ______ from "cors";
   app.use(______);

-------------------------------------------------------------------
TODO 5:
Add Morgan Logger
-------------------------------------------------------------------

In server.js, add morgan to log incoming requests.

Tasks:
- Import morgan
- Use it as middleware

Goal:
Log request details in the terminal whenever the server receives a request.

Hint:
- Use the "dev" logger format

Syntax hint:
   import morgan from "morgan";
   app.use(morgan("dev"));

-------------------------------------------------------------------
TODO 6:
Define Routes
-------------------------------------------------------------------

--------------------------------
TODO 6.1: Root Route
--------------------------------

Path: "/"

Goal:
Send plain text response

Syntax hint:
   app.get("____", (req, res) => {
     res.____("____________________________");
   });

--------------------------------
TODO 6.2: Quote API Route
--------------------------------

Path: "/api/quote"

Goal:
Return a random quote as JSON

Syntax hint:
   app.get("__________", (req, res) => {
     const quote = ______();
     res.____({ quote });
   });

-------------------------------------------------------------------
TODO 7:
Start the Server
-------------------------------------------------------------------

In server.js, start the server.

Syntax hint:
   app.listen(____, () => {
     console.log(`____________________________`);
   });

===================================================================
How to Test the Output of the Lab
===================================================================

1. Start the frontend:
   Open a terminal in:
      6-3-node-express-main\6-3-node-express
   Then run:
      npm run dev

2. Start the backend:
   Open another terminal in:
      6-3-node-express-main\6-3-node-express\backend
   Then run:
      node server.js

3. Test the root route in the browser:
   Visit:
      http://localhost:3000/
   Expected:
   - You should see a plain text response from the server.

4. Test the quote API route in the browser:
   Visit:
      http://localhost:3000/api/quote
   Expected:
   - You should see JSON output like:
      { "quote": "some random quote here" }

5. Test the frontend connection:
   - Open the frontend in the browser from the Vite dev server URL.
   - Check whether the frontend successfully fetches and displays a random quote.

6. Test Morgan logging:
   - Keep the backend terminal open.
   - Refresh the browser or visit the routes again.
   Expected:
   - You should see request logs in the backend terminal for each request.

===================================================================
*/

import { useState } from "react";
import "./index.css";

function App() {
  const [quote, setQuote] = useState("");

  const fetchQuote = async () => {
    const res = await fetch("http://localhost:3000/api/quote");
    const data = await res.json();
    setQuote(data.quote);
  };

  return (
    <div className="app">
      <div className="card">
        <h1 className="title">Random Quote Generator</h1>
        <button className="btn" onClick={fetchQuote}>
          Get Quote
        </button>
        <div className="quote-box">
          {quote ? (
            <p className="quote">{quote}</p>
          ) : (
            <p className="placeholder">
              Click the button to get a quote
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
