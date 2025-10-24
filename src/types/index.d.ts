export interface GraphNode {
  id: number;
  lat: number;
  lon: number;
}

// road segment
export interface GraphEdge {
  source: number;
  target: number;
  weight: number; 
}

export interface GraphJSON {
  nodes: { [id: string]: GraphNode };
  edges: GraphEdge[];
}