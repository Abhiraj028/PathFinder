import { Graph } from '../data_structures/Graph';
import { AlgorithmResult } from './dijkstra'; 


export function breadthFirstSearch(
  graph: Graph,
  startNode: number,
  endNode: number
): AlgorithmResult {
  
  const queue: number[] = [];
  const visited: Set<number> = new Set();
  const prev: { [key: number]: number | null } = {};
  const visitedInOrder: number[] = [];

  for (const [nodeId] of graph.getNodes().entries()) {
    prev[nodeId] = null;
  }

  queue.push(startNode);
  visited.add(startNode);
  
  let found = false;

  while (queue.length > 0) {
    const currentNode = queue.shift()!; 

    visitedInOrder.push(currentNode);

    if (currentNode === endNode) {
      found = true;
      break; 
    }

    const neighbors = graph.getNeighbors(currentNode);
    for (const edge of neighbors) {
      const { target: neighborId } = edge;
      
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        prev[neighborId] = currentNode;
        queue.push(neighborId); // Add to back of queue
      }
    }
  }

  const path: number[] = [];
  if (found) {
    let current: number | null = endNode;
    while (current !== null) {
      path.push(current);
      current = prev[current];
    }
  }

  return { 
    path: found ? path.reverse() : [], 
    visitedInOrder, 
    prev 
  };
}