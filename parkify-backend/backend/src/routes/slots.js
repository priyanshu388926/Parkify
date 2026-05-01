const router = require("express").Router();
const Slot = require("../models/Slot");
const { contract } = require("../services/chain");

router.get("/", async (_req, res) => {
  try {
    const ids = (await contract.getAllSlotIds()).map((n) => Number(n));
    const out = [];
    for (const id of ids) {
      const s = await contract.slots(id);
      const b = await contract.getBooking(id);
      const now = Math.floor(Date.now() / 1000);
      const onChainActive = b.active && Number(b.expiresAt) > now;
      out.push({
        slotId: id,
        price: s.price.toString(),
        duration: Number(s.duration),
        status: onChainActive ? "reserved" : "available",
        user: onChainActive ? b.user : null,
        expiresAt: onChainActive ? Number(b.expiresAt) : null,
      });
    }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
