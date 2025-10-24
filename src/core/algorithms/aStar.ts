import { Graph } from '../data_structures/Graph';
import { PriorityQueue } from '../data_structures/PriorityQueue';
import { haversineDistance } from '../utils/haversine';

export interface AlgorithmResult {
  path: number[];
  visitedInOrder: number[];
  prev: { [key: number]: number | null }; 
}

export function aStar(
  graph: Graph,
  startNode: number,
  endNode: number
): AlgorithmResult {
  const gScore: { [key: number]: number } = {};
  const fScore: { [key: number]: number } = {};
  const prev: { [key: number]: number | null } = {};
  const pq = new PriorityQueue<number>();

  const visitedInOrder: number[] = [];

  const endNodeData = graph.getNode(endNode);
  if (!endNodeData) {
    return { path: [], visitedInOrder, prev: {} }; 
  }

  // 1. Initialize scores
  for (const [nodeId] of graph.getNodes().entries()) {
    gScore[nodeId] = Infinity;
    fScore[nodeId] = Infinity;
    prev[nodeId] = null;
  }

  gScore[startNode] = 0;
  const startNodeData = graph.getNode(startNode)!;

  const hScore = haversineDistance(
    startNodeData.lat,
    startNodeData.lon,
    endNodeData.lat,
    endNodeData.lon
  );

  fScore[startNode] = hScore;
  pq.enqueue(startNode, fScore[startNode]);

  while (!pq.isEmpty()) {
    const currentNodeId = pq.dequeue()!.element;

    visitedInOrder.push(currentNodeId);

    if (currentNodeId === endNode) {
      break;
    }

    const neighbors = graph.getNeighbors(currentNodeId);
    for (const edge of neighbors) {
      const { target: neighborId, weight } = edge;

      const tentativeGScore = gScore[currentNodeId] + weight;

      if (tentativeGScore < gScore[neighborId]) {
        const neighborNodeData = graph.getNode(neighborId)!;

        const hScoreNeighbor = haversineDistance(
          neighborNodeData.lat,
          neighborNodeData.lon,
          endNodeData.lat,
          endNodeData.lon
        );

        prev[neighborId] = currentNodeId; 
        gScore[neighborId] = tentativeGScore;
        fScore[neighborId] = tentativeGScore + hScoreNeighbor;

        pq.enqueue(neighborId, fScore[neighborId]);
      }
    }
  }

  const path: number[] = [];
  let current: number | null = endNode;

  while (current !== null) {
    path.push(current);
    current = prev[current];
  }

  if (path[path.length - 1] !== startNode) {
    return { path: [], visitedInOrder, prev }; 
  }

  return { path: path.reverse(), visitedInOrder, prev }; 
}