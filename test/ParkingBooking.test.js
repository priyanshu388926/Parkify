const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ParkingBooking", () => {
  let contract, owner, alice, bob;
  const price = ethers.parseEther("0.001");
  const duration = 3600;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const F = await ethers.getContractFactory("ParkingBooking");
    contract = await F.deploy(price, duration);
  });

  it("books a slot when payment is sufficient", async () => {
    await expect(contract.connect(alice).bookSlot(1, { value: price }))
      .to.emit(contract, "SlotBooked");
    const b = await contract.getBooking(1);
    expect(b.active).to.equal(true);
    expect(b.user).to.equal(alice.address);
  });

  it("rejects insufficient payment", async () => {
    await expect(
      contract.connect(alice).bookSlot(1, { value: price - 1n })
    ).to.be.revertedWith("Insufficient payment");
  });

  it("prevents double booking", async () => {
    await contract.connect(alice).bookSlot(1, { value: price });
    await expect(
      contract.connect(bob).bookSlot(1, { value: price })
    ).to.be.revertedWith("Slot already booked");
  });

  it("allows owner to release", async () => {
    await contract.connect(alice).bookSlot(1, { value: price });
    await contract.connect(alice).releaseSlot(1);
    const b = await contract.getBooking(1);
    expect(b.active).to.equal(false);
  });
});
