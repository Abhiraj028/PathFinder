import { Graph } from '../data_structures/Graph';
import { AlgorithmResult } from './dijkstra'; 


export function depthFirstSearch(
  graph: Graph,
  startNode: number,
  endNode: number
): AlgorithmResult {
  
  const stack: number[] = []; 
  const prev: { [key: number]: number | null } = {};
  const visitedInOrder: number[] = [];

  for (const [nodeId] of graph.getNodes().entries()) {
    prev[nodeId] = null;
  }

  stack.push(startNode); 
  prev[startNode] = -1; 
  
  let found = false;

  while (stack.length > 0) {
    const currentNode = stack.pop()!; 

    visitedInOrder.push(currentNode);

    if (currentNode === endNode) {
      found = true;
      break; 
    }

    const neighbors = graph.getNeighbors(currentNode);
    for (const edge of neighbors) {
      const { target: neighborId } = edge;
      
      if (prev[neighborId] === null) { 
        prev[neighborId] = currentNode; 
        stack.push(neighborId); 
      }
    }
  }

  const path: number[] = [];
  if (found) {
    let current: number | null = endNode;
    while (current !== null && current !== -1) {
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