import { findNearestAvailableSlot } from './src/lib/astar';

const result = findNearestAvailableSlot([1, 2, 3, 4, 5, 6]);
console.log(JSON.stringify(result));
