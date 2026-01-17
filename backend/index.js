const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password", 
    database: "paytm"
});

db.connect((err) => {
    if (err) console.log("❌ Error connecting DB", err);
    else console.log("✅ Database Connected!");
});

// 1. Balance API
app.get("/balance", (req, res) => {
    db.query("SELECT * FROM users", (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// 2. Signup API
app.post("/create-user", (req, res) => {
    const q = "INSERT INTO users (`username`, `balance`) VALUES (?)";
    const values = [req.body.username, req.body.balance];
    db.query(q, [values], (err, data) => {
        if (err) return res.json(err);
        return res.json("User created.");
    });
});

// 3. Transfer API (Ab History bhi save karega) 📝
app.post("/transfer", (req, res) => {
    const { senderName, receiverName, amount } = req.body;

    const checkQuery = "SELECT balance FROM users WHERE username = ?";
    db.query(checkQuery, [senderName], (err, data) => {
        if (err) return res.json(err);
        if (data.length === 0) return res.json({ message: "Sender nahi mila!" });
        if (data[0].balance < amount) return res.json({ message: "❌ Balance kam hai." });

        // Paise Kaato
        const deductQuery = "UPDATE users SET balance = balance - ? WHERE username = ?";
        db.query(deductQuery, [amount, senderName], (err) => {
            if (err) return res.json(err);

            // Paise Jodo
            const addQuery = "UPDATE users SET balance = balance + ? WHERE username = ?";
            db.query(addQuery, [amount, receiverName], (err) => {
                if (err) return res.json(err);

                // --- NEW: History Save Karo ---
                const historyQuery = "INSERT INTO transactions (`sender`, `receiver`, `amount`) VALUES (?)";
                const values = [senderName, receiverName, amount];
                
                db.query(historyQuery, [values], (err) => {
                     if (err) console.log(err); // Error aaye to print karo par roko mat
                     return res.json({ message: "✅ Transaction Successful!" });
                });
            });
        });
    });
});

// 4. History API (Naya Feature) 📜
app.get("/transactions", (req, res) => {
    // Latest transaction sabse upar dikhega (ORDER BY id DESC)
    const q = "SELECT * FROM transactions ORDER BY id DESC";
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.listen(8800, () => {
    console.log("Server chal raha hai...");
});