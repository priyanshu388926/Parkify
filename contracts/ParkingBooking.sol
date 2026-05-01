// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ParkingBooking
 * @notice Parkify on-chain parking slot reservation contract.
 *         - Users pay a flat ETH price to reserve a slot.
 *         - Booked slots cannot be double-booked while active.
 *         - Only the booker (or owner) can release their slot.
 *         - Bookings auto-expire after `bookingDuration` seconds.
 */
contract ParkingBooking {
    struct Booking {
        address user;
        uint256 slotId;
        uint256 timestamp;
        bool active;
    }

    address public owner;
    uint256 public pricePerSlot;          // wei
    uint256 public bookingDuration;       // seconds (e.g. 1 hours)

    mapping(uint256 => Booking) private bookings;

    event SlotBooked(address indexed user, uint256 indexed slotId, uint256 amount, uint256 timestamp);
    event SlotReleased(address indexed user, uint256 indexed slotId, uint256 timestamp);
    event PriceUpdated(uint256 newPrice);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint256 _pricePerSlot, uint256 _bookingDuration) {
        owner = msg.sender;
        pricePerSlot = _pricePerSlot;
        bookingDuration = _bookingDuration;
    }

    /// @notice Book a parking slot by paying at least `pricePerSlot`.
    function bookSlot(uint256 slotId) external payable {
        require(msg.value >= pricePerSlot, "Insufficient payment");
        Booking storage b = bookings[slotId];

        // Allow rebooking if previous booking expired
        bool expired = b.active && (block.timestamp >= b.timestamp + bookingDuration);
        require(!b.active || expired, "Slot already booked");

        bookings[slotId] = Booking({
            user: msg.sender,
            slotId: slotId,
            timestamp: block.timestamp,
            active: true
        });

        emit SlotBooked(msg.sender, slotId, msg.value, block.timestamp);
    }

    /// @notice Release a slot you previously booked.
    function releaseSlot(uint256 slotId) external {
        Booking storage b = bookings[slotId];
        require(b.active, "Slot not booked");
        require(b.user == msg.sender || msg.sender == owner, "Not authorized");

        b.active = false;
        emit SlotReleased(b.user, slotId, block.timestamp);
    }

    /// @notice Read booking details for a slot.
    function getBooking(uint256 slotId)
        external
        view
        returns (address user, uint256 slotId_, uint256 timestamp, bool active)
    {
        Booking memory b = bookings[slotId];
        bool stillActive = b.active && (block.timestamp < b.timestamp + bookingDuration);
        return (b.user, b.slotId, b.timestamp, stillActive);
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        pricePerSlot = newPrice;
        emit PriceUpdated(newPrice);
    }

    function withdraw(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "Withdraw failed");
        emit Withdrawn(to, bal);
    }
}
