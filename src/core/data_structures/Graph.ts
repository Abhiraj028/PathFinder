import { GraphNode, GraphEdge, GraphJSON } from '../../types';
import { haversineDistance } from '../utils/haversine'; 

export class Graph {
  private nodes: Map<number, GraphNode>;
  
  private adj: Map<number, GraphEdge[]>;

  constructor() {
    this.nodes = new Map();
    this.adj = new Map();
  }

  public buildFromJSON(data: GraphJSON) {
    console.log("Building graph from JSON...");

    for (const nodeId in data.nodes) {
      const node = data.nodes[nodeId];
      this.nodes.set(node.id, node);
      this.adj.set(node.id, []);
    }

    for (const edge of data.edges) {
      this.adj.get(edge.source)?.push(edge);

      const reverseEdge: GraphEdge = {
        source: edge.target,
        target: edge.source,
        weight: edge.weight,
      };
      this.adj.get(edge.target)?.push(reverseEdge);
    }
    
    console.log(`Graph built: ${this.nodes.size} nodes.`);
  }

  public getNode(id: number): GraphNode | undefined {
    return this.nodes.get(id);
  }
  

  public getNodes(): Map<number, GraphNode> {
    return this.nodes;
  }

  public getNeighbors(id: number): GraphEdge[] {
    return this.adj.get(id) || [];
  }

  public getEdgeWeight(nodeA: GraphNode, nodeB: GraphNode): number {
    const edge = this.adj.get(nodeA.id)?.find(e => e.target === nodeB.id);
    if (edge) {
      return edge.weight;
    }
    
    return haversineDistance(nodeA.lat, nodeA.lon, nodeB.lat, nodeB.lon);
  }
}