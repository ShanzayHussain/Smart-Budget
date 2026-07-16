// import { Router } from "express";
// import type { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
// import { adminDb } from "../firebaseAdmin";
// import { verifyAuth } from "../middleware/verifyAuth";

// const router = Router();

// router.get("/", verifyAuth, async (req, res) => {
//   try {
//     const uid = req.uid!;

//     const now = new Date();
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//     const [userSnap, expensesSnap] = await Promise.all([
//       adminDb.collection("users").doc(uid).get(),
//       adminDb
//         .collection("expenses")
//         .where("userId", "==", uid)
//         .where("timestamp", ">=", startOfMonth)
//         .get(),
//     ]);

//     const userData = userSnap.data();
//     const totalBudget = userData?.monthlyBudget ?? 0;

//     const expenses = expensesSnap.docs.map((d: QueryDocumentSnapshot) => d.data());
//     const spentSoFar = expenses.reduce(
//       (sum: number, e: DocumentData) => sum + (e.amount ?? 0),
//       0
//     );

//     const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
//     const daysElapsed = now.getDate();
//     const daysLeft = daysInMonth - daysElapsed;
//     const remaining = Math.max(totalBudget - spentSoFar, 0);
//     const safeDailyPace = daysLeft > 0 ? remaining / daysLeft : remaining;
//     const actualDailyAverage = daysElapsed > 0 ? spentSoFar / daysElapsed : 0;
//     const paceRatio = actualDailyAverage / (safeDailyPace || 1);

//     const level = paceRatio >= 1.4 ? "High" : paceRatio >= 1.0 ? "Medium" : "Low";

//     res.json({
//       level,
//       spentSoFar,
//       totalBudget,
//       safeDailyPace,
//       actualDailyAverage,
//       source: "placeholder",
//     });
//   } catch (err) {
//     console.error("Risk calculation failed:", err);
//     res.status(500).json({ error: "Failed to calculate risk." });
//   }
// });

// export default router;


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

    const expenses = expensesSnap.docs
      .map((d: QueryDocumentSnapshot) => d.data())
      .sort(
        (a: DocumentData, b: DocumentData) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    const spentSoFar = expenses.reduce(
      (sum: number, e: DocumentData) => sum + (e.amount ?? 0),
      0
    );

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const daysLeft = daysInMonth - daysElapsed;

    // most recent expense determines "today's" category/mood/amount context
    const latest = expenses[expenses.length - 1];

    if (!latest) {
      // no expenses logged yet this month — nothing meaningful to send the model
      return res.json({
        level: "Low",
        confidence: null,
        reason: "No expenses logged yet this month.",
        source: "no-data",
      });
    }

    // spending_trend: average of last 3 logged expenses vs. earlier ones
    const recentAmounts = expenses.slice(-3).map((e: DocumentData) => e.amount ?? 0);
    const earlierAmounts = expenses.slice(0, -3).map((e: DocumentData) => e.amount ?? 0);
    const recentAvg = recentAmounts.reduce((a, b) => a + b, 0) / (recentAmounts.length || 1);
    const earlierAvg =
      earlierAmounts.length > 0
        ? earlierAmounts.reduce((a, b) => a + b, 0) / earlierAmounts.length
        : 0;
    const spendingTrend = recentAvg - earlierAvg;

    const mlPayload = {
      day_of_week: new Date(latest.createdAt).getDay(),
      amount_spent_today: latest.amount ?? 0,
      days_left_in_month: daysLeft,
      percent_budget_used_so_far: totalBudget > 0 ? (spentSoFar / totalBudget) * 100 : 0,
      spending_trend: spendingTrend,
      category: latest.category ?? "Other",
      mood_while_spending: latest.mood ?? "Neutral",
    };

    const mlResponse = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
    });

    if (!mlResponse.ok) {
      throw new Error(`ML service responded with status ${mlResponse.status}`);
    }

    const mlResult = await mlResponse.json();

// save one snapshot per user per day, so Insights can show a trend over time
const todayKey = now.toISOString().split("T")[0]; // "2026-07-17"
await adminDb
  .collection("riskSnapshots")
  .doc(`${uid}_${todayKey}`)
  .set(
    {
      userId: uid,
      date: todayKey,
      level: mlResult.level,
      confidence: mlResult.confidence,
      percentBudgetUsed: mlPayload.percent_budget_used_so_far,
      spendingTrend: mlPayload.spending_trend,
      createdAt: now.toISOString(),
    },
    { merge: true }
  );

res.json({
  level: mlResult.level,
  confidence: mlResult.confidence,
  spentSoFar,
  totalBudget,
  source: "ml-model",
});

  
  } catch (err) {
    console.error("Risk calculation failed:", err);
    res.status(500).json({ error: "Failed to calculate risk." });
  }
});

export default router;