const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());

// ================== KONFIG ==================
const SECRET = "ISI_SECRET_RAHASIA_KAMU"; // ganti ini
const COOLDOWN = 10 * 1000; // 10 detik
// ============================================

let leaderboard = [];
let lastDonation = null;
let lastNotifyTime = 0;

// Rate limit (anti spam request)
app.use("/saweria", rateLimit({
  windowMs: 10 * 1000,
  max: 5
}));

// ====== WEBHOOK SAWERIA ======
app.post("/saweria", (req, res) => {
  const secret = req.headers["x-saweria-secret"];
  if (secret !== SECRET) {
    return res.status(403).send("FORBIDDEN");
  }

  const name = req.body.donator_name || "Anonymous";
  const amount = Number(req.body.amount_raw);
  const msg = req.body.message || "";

  if (!amount || amount < 1000 || amount > 5000000) {
    return res.status(400).send("INVALID AMOUNT");
  }

  lastDonation = {
    name,
    amount,
    msg,
    time: Date.now()
  };

  const found = leaderboard.find(d => d.name === name);
  if (found) found.total += amount;
  else leaderboard.push({ name, total: amount });

  leaderboard.sort((a,b)=>b.total-a.total);
  leaderboard = leaderboard.slice(0,10);

  res.sendStatus(200);
});

// ====== ROBLOX AMBIL NOTIF ======
app.get("/donation", (req,res)=>{
  if (!lastDonation) return res.json({});

  const now = Date.now();
  if (now - lastNotifyTime < COOLDOWN) {
    return res.json({ blocked: true });
  }

  lastNotifyTime = now;
  res.json(lastDonation);
});

// ====== ROBLOX AMBIL LEADERBOARD ======
app.get("/leaderboard", (req,res)=>{
  res.json(leaderboard);
});

app.listen(3000, ()=>console.log("SERVER ON"));
