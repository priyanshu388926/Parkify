const SLOT_COORDINATES = {
  1: { x: 2, y: 0 },
  2: { x: 3, y: 0 },
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

  while (openSet.length > 0) {
    console.log("OpenSet length:", openSet.length);
    openSet.sort((a, b) => (fScore.get(`${a.x},${a.y}`) || Infinity) - (fScore.get(`${b.x},${b.y}`) || Infinity));
    const current = openSet.shift();
    console.log("Visiting:", current);
    
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
      console.log("Neighbor:", neighborStr, "tentativeGScore:", tentativeGScore, "current gScore:", gScore.get(neighborStr));
      
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

console.log("Path to 1: ", findShortestPath(ENTRANCE, SLOT_COORDINATES[1]));
