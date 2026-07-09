import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import riskRouter from "./routes/risk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/risk", riskRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SmartBudget backend running on port ${PORT}`);
});