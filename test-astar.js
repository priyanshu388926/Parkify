const SLOT_COORDINATES = {
  1: { x: 2, y: 0 },
  2: { x: 3, y: 0 },
  3: { x: 4, y: 0 },
  4: { x: 5, y: 0 },
  5: { x: 2, y: 2 },
  6: { x: 3, y: 2 },
  7: { x: 4, y: 2 },
  8: { x: 5, y: 2 },
  9: { x: 2, y: 4 },
  10: { x: 3, y: 4 },
  11: { x: 4, y: 4 },
  12: { x: 5, y: 4 },
};

const ENTRANCE = { x: 0, y: 0 };
const GRID_WIDTH = 6;
const GRID_HEIGHT = 5;

const isWalkable = (x, y, slotCoordinates, target) => {
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
  if (target && target.x === x && target.y === y) return true;
  for (const slot of slotCoordinates) {
    if (slot.x === x && slot.y === y) return false;
  }
  return true;
};

const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const findShortestPath = (start, target) => {
  const allSlots = Object.values(SLOT_COORDINATES);
  const openSet = [start];
  const cameFrom = new Map();
  const gScore = new Map();
  gScore.set(`${start.x},${start.y}`, 0);
  const fScore = new Map();
  fScore.set(`${start.x},${start.y}`, heuristic(start, target));

  let loops = 0;
  while (openSet.length > 0 && loops < 1000) {
    loops++;
    openSet.sort((a, b) => (fScore.get(`${a.x},${a.y}`) || Infinity) - (fScore.get(`${b.x},${b.y}`) || Infinity));
    const current = openSet.shift();
    
    if (current.x === target.x && current.y === target.y) {
      const path = [current];
      let currStr = `${current.x},${current.y}`;
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr);
        path.unshift(prev);
        currStr = `${prev.x},${prev.y}`;
      }
      return path;
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      if (!isWalkable(neighbor.x, neighbor.y, allSlots, target)) continue;
      
      const neighborStr = `${neighbor.x},${neighbor.y}`;
      const tentativeGScore = (gScore.get(`${current.x},${current.y}`) || Infinity) + 1;
      
      if (tentativeGScore < (gScore.get(neighborStr) || Infinity)) {
        cameFrom.set(neighborStr, current);
        gScore.set(neighborStr, tentativeGScore);
        fScore.set(neighborStr, tentativeGScore + heuristic(neighbor, target));
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  return null;
};

const findNearestAvailableSlot = (availableSlotIds) => {
  let shortestPathLength = Infinity;
  let bestSlotId = null;
  let bestPath = null;

  for (const id of availableSlotIds) {
    const targetCoord = SLOT_COORDINATES[id];
    if (!targetCoord) continue;
    const path = findShortestPath(ENTRANCE, targetCoord);
    if (path && path.length < shortestPathLength) {
      shortestPathLength = path.length;
      bestSlotId = id;
      bestPath = path;
    }
  }

  if (bestSlotId !== null && bestPath !== null) {
      return { id: bestSlotId, path: bestPath };
  }
  return null;
};

console.log(findNearestAvailableSlot([1, 2, 3, 4, 5, 6]));
