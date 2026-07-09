import { Router } from "express";
import type { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.get("/", verifyAuth, async (req, res) => {
  try {
    const uid = req.uid!;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [userSnap, expensesSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb
        .collection("expenses")
        .where("userId", "==", uid)
        .where("timestamp", ">=", startOfMonth)
        .get(),
    ]);

    const userData = userSnap.data();
    const totalBudget = userData?.monthlyBudget ?? 0;

    const expenses = expensesSnap.docs.map((d: QueryDocumentSnapshot) => d.data());
    const spentSoFar = expenses.reduce(
      (sum: number, e: DocumentData) => sum + (e.amount ?? 0),
      0
    );

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const daysLeft = daysInMonth - daysElapsed;
    const remaining = Math.max(totalBudget - spentSoFar, 0);
    const safeDailyPace = daysLeft > 0 ? remaining / daysLeft : remaining;
    const actualDailyAverage = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
    const paceRatio = actualDailyAverage / (safeDailyPace || 1);

    const level = paceRatio >= 1.4 ? "High" : paceRatio >= 1.0 ? "Medium" : "Low";

    res.json({
      level,
      spentSoFar,
      totalBudget,
      safeDailyPace,
      actualDailyAverage,
      source: "placeholder",
    });
  } catch (err) {
    console.error("Risk calculation failed:", err);
    res.status(500).json({ error: "Failed to calculate risk." });
  }
});

export default router;