const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ParkingBooking", () => {
  it("books and prevents double booking", async () => {
    const [owner, user, user2] = await ethers.getSigners();
    const C = await ethers.getContractFactory("ParkingBooking");
    const c = await C.deploy();
    await c.addSlot(1, ethers.parseEther("0.001"), 3600);
    await c.connect(user).bookSlot(1, { value: ethers.parseEther("0.001") });
    await expect(
      c.connect(user2).bookSlot(1, { value: ethers.parseEther("0.001") })
    ).to.be.revertedWith("Slot already booked");
  });
});
