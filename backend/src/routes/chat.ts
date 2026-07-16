import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

router.post("/", verifyAuth, async (req, res) => {
  try {
    const uid = req.uid!;
    const { message, history } = req.body as { message: string; history: ChatMessage[] };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    // pull the user's real financial context so advice is grounded, not generic
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [userSnap, expensesSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("expenses").where("userId", "==", uid).get(),
    ]);

    const userData = userSnap.data();
    const totalBudget = userData?.monthlyBudget ?? 0;
    const name = userData?.name ?? "there";

    const allExpenses = expensesSnap.docs.map((d) => d.data());
    const thisMonthExpenses = allExpenses.filter(
      (e) => new Date(e.createdAt) >= startOfMonth
    );
    const spentSoFar = thisMonthExpenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

    const categoryTotals: Record<string, number> = {};
    for (const e of thisMonthExpenses) {
      categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
    }
    const categorySummary = Object.entries(categoryTotals)
      .map(([cat, amt]) => `${cat}: PKR ${amt}`)
      .join(", ");

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const remaining = Math.max(totalBudget - spentSoFar, 0);

    const systemContext = `You are a friendly, practical budgeting assistant inside the SmartBudget app.
The user's name is ${name}.
This month's budget: PKR ${totalBudget}.
Spent so far: PKR ${spentSoFar} (${totalBudget > 0 ? Math.round((spentSoFar / totalBudget) * 100) : 0}% used).
Remaining: PKR ${remaining}, with ${daysLeft} days left in the month.
Spending by category so far: ${categorySummary || "no expenses logged yet"}.

Guidelines:
- Give practical, specific budgeting advice grounded in the numbers above.
- Keep responses short — 2-4 sentences unless the user asks for detail.
- Never give investment, tax, or legal advice — only budgeting/spending guidance.
- If asked something outside budgeting, gently redirect to what you can help with.
- Be encouraging, not judgmental, even if their spending looks risky.`;

    const contents = [
      ...(history ?? []).map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemContext }] },
          contents,
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      throw new Error(`Gemini API responded with status ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";

    res.json({ reply });
  } catch (err) {
    console.error("Chat request failed:", err);
    res.status(500).json({ error: "Failed to get a response." });
  }
});

export default router;