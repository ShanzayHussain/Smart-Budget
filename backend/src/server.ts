import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import riskRouter from "./routes/risk";
import riskHistoryRouter from "./routes/riskHistory";
import chatRouter from "./routes/chat";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/risk", riskRouter);
app.use("/api/risk-history", riskHistoryRouter);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SmartBudget backend running on port ${PORT}`);
});