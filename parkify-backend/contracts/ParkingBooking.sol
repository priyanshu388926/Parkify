// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ParkingBooking {
    struct Booking {
        address user;
        uint256 slotId;
        uint256 timestamp;
        uint256 expiresAt;
        bool active;
    }

    struct Slot {
        uint256 id;
        uint256 price;       // wei
        uint256 duration;    // seconds
        bool exists;
    }

    address public owner;
    mapping(uint256 => Slot) public slots;
    mapping(uint256 => Booking) public bookings;
    uint256[] public slotIds;

    event SlotAdded(uint256 indexed slotId, uint256 price, uint256 duration);
    event SlotBooked(uint256 indexed slotId, address indexed user, uint256 expiresAt, uint256 amount);
    event SlotReleased(uint256 indexed slotId, address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addSlot(uint256 slotId, uint256 price, uint256 duration) external onlyOwner {
        require(!slots[slotId].exists, "Slot exists");
        require(duration > 0, "Duration=0");
        slots[slotId] = Slot(slotId, price, duration, true);
        slotIds.push(slotId);
        emit SlotAdded(slotId, price, duration);
    }

    function updateSlot(uint256 slotId, uint256 price, uint256 duration) external onlyOwner {
        require(slots[slotId].exists, "No slot");
        slots[slotId].price = price;
        slots[slotId].duration = duration;
    }

    function bookSlot(uint256 slotId, uint256 hoursToBook) external payable {
        Slot memory s = slots[slotId];
        require(s.exists, "Invalid slot");
        require(hoursToBook > 0, "Must book at least 1 hour");
        
        uint256 totalPrice = s.price * hoursToBook;
        require(msg.value >= totalPrice, "Payment too low");

        Booking memory b = bookings[slotId];
        if (b.active && block.timestamp < b.expiresAt) {
            revert("Slot already booked");
        }

        bookings[slotId] = Booking({
            user: msg.sender,
            slotId: slotId,
            timestamp: block.timestamp,
            expiresAt: block.timestamp + (hoursToBook * 3600),
            active: true
        });

        (bool ok, ) = owner.call{value: msg.value}("");
        require(ok, "Transfer failed");

        emit SlotBooked(slotId, msg.sender, block.timestamp + (hoursToBook * 3600), msg.value);
    }

    function releaseSlot(uint256 slotId) external {
        Booking storage b = bookings[slotId];
        require(b.active, "Not active");
        require(b.user == msg.sender || msg.sender == owner || block.timestamp >= b.expiresAt, "Not allowed");
        b.active = false;
        emit SlotReleased(slotId, b.user);
    }

    function getBooking(uint256 slotId) external view returns (Booking memory) {
        return bookings[slotId];
    }

    function getAllSlotIds() external view returns (uint256[] memory) {
        return slotIds;
    }

    function isAvailable(uint256 slotId) external view returns (bool) {
        if (!slots[slotId].exists) return false;
        Booking memory b = bookings[slotId];
        if (!b.active) return true;
        return block.timestamp >= b.expiresAt;
    }
}
