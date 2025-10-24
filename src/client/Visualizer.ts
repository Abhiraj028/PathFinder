import L from 'leaflet';
import { Graph } from '../core/data_structures/Graph';
import { AlgorithmResult } from '../core/algorithms/dijkstra';

export class Visualizer {
  private map: L.Map;
  private graph: Graph;
  private visitedLayer: L.LayerGroup;
  private pathLayer: L.LayerGroup;
  
  // Animation state variables
  private speed: number = 5; // Default speed in ms
  private animationTimer: number | null = null;
  private result: AlgorithmResult | null = null;
  private animationIndex: number = 0;

  constructor(map: L.Map, graph: Graph) {
    this.map = map;
    this.graph = graph;
    this.visitedLayer = L.layerGroup().addTo(this.map);
    this.pathLayer = L.layerGroup().addTo(this.map);
  }

  // Clears all drawings and stops any running animation.
  public clearLayers() {
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    this.visitedLayer.clearLayers();
    this.pathLayer.clearLayers();
    this.result = null;
    this.animationIndex = 0;
  }

  // Kicks off a new animation.
  public animate(result: AlgorithmResult, speed: number) {
    this.clearLayers(); // Clear any previous animation artifacts
    this.result = result;
    this.animationIndex = 0;
    this.setSpeed(speed); // Starts the animation loop with the given speed
  }
  
  // Changes the speed of the animation.
  // Restarts the animation loop with the new speed if one is active.
  public setSpeed(newSpeed: number) {
    this.speed = newSpeed;

    // Clear the existing timer if the animation is already running
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
    }
    
    // Start or restart the animation loop
    this.startAnimationLoop();
  }

  // The main animation loop, controlled by setInterval.
  private startAnimationLoop() {
    // Prevent starting if no algorithm result is loaded
    if (!this.result) {
      return;
    }

    this.animationTimer = window.setInterval(() => {
      // Safety check in case the result was cleared externally
      if (!this.result) {
        clearInterval(this.animationTimer!);
        return;
      }
      
      const visitedNodes = this.result.visitedInOrder;
      const prevMap = this.result.prev;

      // Check if animation is complete
      if (this.animationIndex >= visitedNodes.length) {
        clearInterval(this.animationTimer!);
        this.animationTimer = null;
        this.drawFinalPath(this.result.path); // Draw the final path once done
        return;
      }

      // Draw multiple segments at once for "fast" speed (0ms) to avoid browser freezing
      const batchSize = this.speed === 0 ? 100 : 1;

      // Process a batch of nodes for drawing
      for (let i = 0; i < batchSize && this.animationIndex < visitedNodes.length; i++) {
        const nodeId = visitedNodes[this.animationIndex];
        const parentId = prevMap[nodeId];
        this.animationIndex++;

        // Only draw a line if the node has a parent (it's not the start node)
        if (parentId !== null) {
          const node = this.graph.getNode(nodeId);
          const parent = this.graph.getNode(parentId);

          // Ensure both nodes exist before drawing
          if (node && parent) {
            L.polyline(
              [
                [parent.lat, parent.lon],
                [node.lat, node.lon],
              ],
              {
                color: '#2D6A4F', 
                weight: 2,
                opacity: 0.7,
              }
            ).addTo(this.visitedLayer);
          }
        }
      }
    }, this.speed); // Interval delay based on current speed setting
  }

  // Draws the final calculated shortest path in red.
  private drawFinalPath(pathNodeIds: number[]) {
    const latLngs: L.LatLngExpression[] = [];

    // Convert node IDs to coordinates
    for (const nodeId of pathNodeIds) {
      const node = this.graph.getNode(nodeId);
      if (node) {
        latLngs.push([node.lat, node.lon]);
      }
    }

    // Add the polyline to the dedicated path layer
    L.polyline(latLngs, {
      color: '#e63946', // Red color for the final path
      weight: 4,
      opacity: 0.8,
    }).addTo(this.pathLayer);
  }
}