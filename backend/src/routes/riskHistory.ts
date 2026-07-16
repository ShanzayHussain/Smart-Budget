import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { verifyAuth } from "../middleware/verifyAuth";

const router = Router();

router.get("/", verifyAuth, async (req, res) => {
  try {
    const uid = req.uid!;

    const snap = await adminDb
      .collection("riskSnapshots")
      .where("userId", "==", uid)
      .orderBy("date", "asc")
      .get();

    const history = snap.docs.map((d) => d.data());
    res.json({ history });
  } catch (err) {
    console.error("Risk history fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch risk history." });
  }
});

export default router;