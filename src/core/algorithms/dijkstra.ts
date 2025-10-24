import { Graph } from '../data_structures/Graph';
import { PriorityQueue } from '../data_structures/PriorityQueue';

export interface AlgorithmResult {
  path: number[];
  visitedInOrder: number[];
  prev: { [key: number]: number | null }; 
}

export function dijkstra(
  graph: Graph,
  startNode: number,
  endNode: number
): AlgorithmResult {
  const distances: { [key: number]: number } = {};
  const prev: { [key: number]: number | null } = {};
  const pq = new PriorityQueue<number>();

  const visitedInOrder: number[] = [];

  for (const [nodeId] of graph.getNodes().entries()) {
    distances[nodeId] = Infinity;
    prev[nodeId] = null;
  }

  distances[startNode] = 0;
  pq.enqueue(startNode, 0);

  while (!pq.isEmpty()) {
    const currentNode = pq.dequeue()!.element;

    visitedInOrder.push(currentNode);

    if (currentNode === endNode) {
      break;
    }

    const neighbors = graph.getNeighbors(currentNode);
    for (const edge of neighbors) {
      const { target, weight } = edge;
      const newDist = distances[currentNode] + weight;

      if (newDist < distances[target]) {
        distances[target] = newDist;
        prev[target] = currentNode; 
        pq.enqueue(target, newDist);
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