import express from "express";
import Timer from "../lib/models/timer.js";

const router = express.Router();

// Helper to parse date input safely
function parseDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

// POST /api/timer - create a timer
router.post("/", async (req, res) => {
  try {
    // Prefer store domain from authenticated session if available
    const storeDomain = (res.locals?.shopify?.session?.shop) || req.body.storeDomain;
    if (!storeDomain) return res.status(400).json({ error: "Missing storeDomain or not authenticated." });

    const { productId, startTime, endTime, message, styles, urgencyMinutes, active, metadata } = req.body;

    if (!productId) return res.status(400).json({ error: "Missing productId" });

    const s = parseDate(startTime);
    const e = parseDate(endTime);
    if (!s || !e) return res.status(400).json({ error: "Invalid startTime or endTime" });
    if (e <= s) return res.status(400).json({ error: "endTime must be after startTime" });

    const doc = new Timer({
      storeDomain,
      productId: String(productId),
      startTime: s,
      endTime: e,
      message: message || "",
      styles: styles || {},
      urgencyMinutes: typeof urgencyMinutes === "number" ? urgencyMinutes : undefined,
      active: typeof active === "boolean" ? active : true,
      metadata: metadata || {},
    });

    const saved = await doc.save();
    return res.status(201).json({ success: true, timer: saved });
  } catch (err) {
    console.error("POST /api/timer error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/timer/:shop - fetch active timers for a shop (optionally filter by productId)
router.get("/:shop", async (req, res) => {
  try {
    const shop = req.params.shop;
    if (!shop) return res.status(400).json({ error: "Missing shop parameter" });

    const productId = req.query.productId;
    const now = new Date();

    const query = {
      storeDomain: shop,
      active: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    };
    if (productId) query.productId = String(productId);

    const timers = await Timer.find(query).sort({ endTime: 1 }).lean();
    return res.status(200).json({ success: true, timers });
  } catch (err) {
    console.error("GET /api/timer/:shop error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// PUT /api/timer/:id - update a timer (merchant must own the timer)
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id parameter" });

    const timer = await Timer.findById(id);
    if (!timer) return res.status(404).json({ error: "Timer not found" });

    // Ensure authenticated merchant owns the timer
    const storeDomain = (res.locals?.shopify?.session?.shop);
    if (storeDomain && timer.storeDomain !== storeDomain) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { productId, startTime, endTime, message, styles, urgencyMinutes, active, metadata } = req.body;

    if (productId !== undefined) timer.productId = String(productId);
    if (startTime !== undefined) {
      const s = parseDate(startTime);
      if (!s) return res.status(400).json({ error: "Invalid startTime" });
      timer.startTime = s;
    }
    if (endTime !== undefined) {
      const e = parseDate(endTime);
      if (!e) return res.status(400).json({ error: "Invalid endTime" });
      timer.endTime = e;
    }
    if (timer.endTime <= timer.startTime) return res.status(400).json({ error: "endTime must be after startTime" });
    if (message !== undefined) timer.message = message;
    if (styles !== undefined) timer.styles = styles;
    if (urgencyMinutes !== undefined) timer.urgencyMinutes = urgencyMinutes;
    if (active !== undefined) timer.active = active;
    if (metadata !== undefined) timer.metadata = metadata;

    const saved = await timer.save();
    return res.status(200).json({ success: true, timer: saved });
  } catch (err) {
    console.error("PUT /api/timer/:id error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// DELETE /api/timer/:id - delete a timer (merchant must own the timer)
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id parameter" });

    const timer = await Timer.findById(id);
    if (!timer) return res.status(404).json({ error: "Timer not found" });

    const storeDomain = (res.locals?.shopify?.session?.shop);
    if (storeDomain && timer.storeDomain !== storeDomain) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Timer.deleteOne({ _id: id });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("DELETE /api/timer/:id error", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
