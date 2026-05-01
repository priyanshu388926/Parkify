import React from 'react';
import { motion } from 'framer-motion';
import { SLOT_COORDINATES, ENTRANCE, GRID_WIDTH, GRID_HEIGHT, type Point, isWalkable } from '../lib/astar';

interface ParkingMapProps {
  slots: { slotId: number; status: string }[];
  nearestSlotId: number | null;
  path: Point[] | null;
}

const ParkingMap: React.FC<ParkingMapProps> = ({ slots, nearestSlotId, path }) => {
  const getCellType = (x: number, y: number) => {
    if (x === ENTRANCE.x && y === ENTRANCE.y) return 'entrance';

    const slotIdStr = Object.keys(SLOT_COORDINATES).find(
      key => SLOT_COORDINATES[Number(key)].x === x && SLOT_COORDINATES[Number(key)].y === y
    );
    
    if (slotIdStr) {
      const slotId = Number(slotIdStr);
      const slotData = slots.find(s => s.slotId === slotId);
      const isNearest = nearestSlotId === slotId;
      return {
        type: 'slot',
        id: slotId,
        status: slotData?.status || 'available',
        isNearest
      };
    }

    const allSlots = Object.values(SLOT_COORDINATES);
    if (isWalkable(x, y, allSlots)) return 'road';

    return 'empty';
  };

  const getPathIndex = (x: number, y: number) => {
    if (!path) return -1;
    return path.findIndex(p => p.x === x && p.y === y);
  };

  return (
    <div className="parking-map-container" style={{ flexDirection: 'column', alignItems: 'center' }}>
      {nearestSlotId && (
        <div style={{ marginBottom: '1rem', color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>📍</motion.div>
          Navigating to Slot #{nearestSlotId}
        </div>
      )}
      <div className="map-grid" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)` }}>
        {Array.from({ length: GRID_HEIGHT }).map((_, y) => (
          Array.from({ length: GRID_WIDTH }).map((_, x) => {
            const cell = getCellType(x, y);
            const pathIndex = getPathIndex(x, y);
            const inPath = pathIndex !== -1;
            const delay = (x + y) * 0.03;

            const isEntrance = cell === 'entrance';
            const isSlot = typeof cell === 'object' && cell.type === 'slot';
            const isTargetSlot = isSlot && (cell as any).isNearest;
            const isReserved = isSlot && (cell as any).status === 'reserved';
            const slotInfo = isSlot ? cell : null;

            return (
              <motion.div
                key={`${x}-${y}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
                className={`grid-cell ${isEntrance ? 'entrance' : ''} ${
                  isSlot ? 'slot' : isEntrance ? '' : 'road'
                } ${isSlot && isReserved ? 'reserved' : ''} ${
                  isSlot && !isReserved ? 'available' : ''
                } ${isTargetSlot ? 'nearest' : ''}`}
              >
                {isEntrance && 'IN'}
                {isSlot && !isTargetSlot && (slotInfo as any).id}
                
                {isTargetSlot && (
                  <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, repeat: Infinity, repeatType: "reverse", duration: 0.8 }}
                    className="park-here-badge"
                  >
                    Park Here
                  </motion.div>
                )}

                {inPath && !isEntrance && !isSlot && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: pathIndex * 0.05, type: 'spring' }}
                    className="path-indicator" 
                  />
                )}
              </motion.div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default ParkingMap;
