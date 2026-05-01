const router = require("express").Router();
const Slot = require("../models/Slot");
const { provider, contract } = require("../services/chain");

router.post("/", async (req, res) => {
  try {
    const { userId, slotId, transactionHash } = req.body;
    if (!userId || slotId == null || !transactionHash)
      return res.status(400).json({ error: "Missing fields" });

    // 1. fetch tx + receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);
    if (!receipt) return res.status(400).json({ error: "Tx not mined" });
    if (receipt.status !== 1) return res.status(400).json({ error: "Tx failed" });

    const tx = await provider.getTransaction(transactionHash);
    if (tx.to.toLowerCase() !== (await contract.getAddress()).toLowerCase())
      return res.status(400).json({ error: "Wrong contract" });

    // 2. parse SlotBooked event
    const iface = contract.interface;
    let bookedSlot = null, bookedUser = null, expiresAt = null;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === "SlotBooked") {
          bookedSlot = Number(parsed.args.slotId);
          bookedUser = parsed.args.user;
          expiresAt = Number(parsed.args.expiresAt);
        }
      } catch (_) {}
    }
    if (bookedSlot !== Number(slotId))
      return res.status(400).json({ error: "Slot mismatch" });

    // 3. Update or create the slot record in MongoDB

    const doc = await Slot.findOneAndUpdate(
      { slotId },
      {
        slotId,
        status: "reserved",
        user: bookedUser,
        txHash: transactionHash,
        expiresAt: new Date(expiresAt * 1000),
      },
      { upsert: true, new: true }
    );
    res.json({ ok: true, slot: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
module.exports = router;
