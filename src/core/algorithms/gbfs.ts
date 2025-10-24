import { Graph } from '../data_structures/Graph';
import { PriorityQueue } from '../data_structures/PriorityQueue';
import { haversineDistance } from '../utils/haversine';
import { AlgorithmResult } from './dijkstra'; 

export function greedyBestFirstSearch(
  graph: Graph,
  startNode: number,
  endNode: number
): AlgorithmResult {
  
  const prev: { [key: number]: number | null } = {};
  const pq = new PriorityQueue<number>();
  const visitedInOrder: number[] = [];
  
  const endNodeData = graph.getNode(endNode);
  if (!endNodeData) {
    return { path: [], visitedInOrder, prev: {} };
  }

  for (const [nodeId] of graph.getNodes().entries()) {
    prev[nodeId] = null;
  }

  const startNodeData = graph.getNode(startNode)!;
  const hScore = haversineDistance(
    startNodeData.lat,
    startNodeData.lon,
    endNodeData.lat,
    endNodeData.lon
  );
  
  pq.enqueue(startNode, hScore);
  prev[startNode] = startNode; 

  while (!pq.isEmpty()) {
    const currentNodeId = pq.dequeue()!.element;

    visitedInOrder.push(currentNodeId);

    if (currentNodeId === endNode) {
      break; 
    }

    const neighbors = graph.getNeighbors(currentNodeId);
    for (const edge of neighbors) {
      const { target: neighborId } = edge;

      if (prev[neighborId] === null) {
        prev[neighborId] = currentNodeId; 
        
        const neighborNodeData = graph.getNode(neighborId)!;
        
        const hScoreNeighbor = haversineDistance(
          neighborNodeData.lat,
          neighborNodeData.lon,
          endNodeData.lat,
          endNodeData.lon
        );

        pq.enqueue(neighborId, hScoreNeighbor);
      }
    }
  }

  const path: number[] = [];
  let current: number | null = endNode;
  
  while (current !== null) {
    path.push(current);
    if (current === startNode) break; 
    current = prev[current];
  }
  
  const pathFound = path[path.length - 1] === startNode;

  return { 
    path: pathFound ? path.reverse() : [], 
    visitedInOrder, 
    prev 
  };
}