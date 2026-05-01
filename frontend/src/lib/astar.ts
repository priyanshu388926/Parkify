export type Point = { x: number; y: number };

// Slot ID to Grid Coordinate Mapping
export const SLOT_COORDINATES: Record<number, Point> = {
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

export const ENTRANCE: Point = { x: 0, y: 0 };

// Grid dimensions
export const GRID_WIDTH = 6;
export const GRID_HEIGHT = 5;

// Helper to check if a point is a road
export const isWalkable = (x: number, y: number, slotCoordinates: Point[], target?: Point): boolean => {
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
  
  // Target slot is always walkable for its specific path search
  if (target && target.x === x && target.y === y) return true;

  // Check if it's another slot (slots are not walkable roads)
  for (const slot of slotCoordinates) {
    if (slot.x === x && slot.y === y) return false;
  }

  return true;
};

// Manhattan distance heuristic
const heuristic = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// A* Implementation
export const findShortestPath = (start: Point, target: Point): Point[] | null => {
  const allSlots = Object.values(SLOT_COORDINATES);
  
  const openSet = [start];
  const cameFrom = new Map<string, Point>();
  
  const gScore = new Map<string, number>();
  gScore.set(`${start.x},${start.y}`, 0);
  
  const fScore = new Map<string, number>();
  fScore.set(`${start.x},${start.y}`, heuristic(start, target));

  while (openSet.length > 0) {
    // Get node in openSet with lowest fScore
    openSet.sort((a, b) => {
      const scoreA = fScore.get(`${a.x},${a.y}`) ?? Infinity;
      const scoreB = fScore.get(`${b.x},${b.y}`) ?? Infinity;
      return scoreA - scoreB;
    });
    
    const current = openSet.shift()!;
    
    if (current.x === target.x && current.y === target.y) {
      // Reconstruct path
      const path = [current];
      let currStr = `${current.x},${current.y}`;
      while (cameFrom.has(currStr)) {
        const prev = cameFrom.get(currStr)!;
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
      const currentGScore = gScore.get(`${current.x},${current.y}`);
      const tentativeGScore = (currentGScore !== undefined ? currentGScore : Infinity) + 1;
      
      const neighborGScore = gScore.get(neighborStr);
      if (tentativeGScore < (neighborGScore !== undefined ? neighborGScore : Infinity)) {
        cameFrom.set(neighborStr, current);
        gScore.set(neighborStr, tentativeGScore);
        fScore.set(neighborStr, tentativeGScore + heuristic(neighbor, target));
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null; // No path found
};

export const findNearestAvailableSlot = (availableSlotIds: number[]): { id: number, path: Point[] } | null => {
  let shortestPathLength = Infinity;
  let bestSlotId: number | null = null;
  let bestPath: Point[] | null = null;

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
