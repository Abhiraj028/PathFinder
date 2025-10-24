// Import Leaflet CSS for map styling
import 'leaflet/dist/leaflet.css';

// Import core data structures and algorithms
import { Graph } from '../core/data_structures/Graph';
import { AlgorithmResult, dijkstra } from '../core/algorithms/dijkstra';
import { aStar } from '../core/algorithms/aStar';
import { breadthFirstSearch } from '../core/algorithms/bfs';
import { greedyBestFirstSearch } from '../core/algorithms/gbfs';
import { depthFirstSearch } from '../core/algorithms/dfs';

// Import types and utility classes
import { GraphJSON, GraphNode } from '../types';
import { MapManager } from './MapManager';
import { Visualizer } from './Visualizer';

class App {
  private graph: Graph;
  private mapManager: MapManager;
  private visualizer: Visualizer;

  // UI Element References
  private algoSelector: HTMLSelectElement;
  private statsPanel: HTMLElement;
  private resetButton: HTMLButtonElement;
  private speedSlow: HTMLButtonElement;
  private speedNormal: HTMLButtonElement;
  private speedFast: HTMLButtonElement;

  // Application State
  private startNode: GraphNode | null = null;
  private endNode: GraphNode | null = null;
  private currentSpeed: number = 5; // Default animation speed

  // Cache for algorithm results and performance times
  private lastResults: Map<string, AlgorithmResult> = new Map();
  private lastTimes: Map<string, number> = new Map();

  constructor() {
    this.graph = new Graph();
    this.mapManager = new MapManager(this.graph);
    this.visualizer = new Visualizer(this.mapManager.map, this.graph);

    // Get references to DOM elements
    this.algoSelector = document.getElementById('algo-select') as HTMLSelectElement;
    this.statsPanel = document.getElementById('stats-panel') as HTMLElement;
    this.resetButton = document.getElementById('reset-button') as HTMLButtonElement;
    this.speedSlow = document.getElementById('speed-slow') as HTMLButtonElement;
    this.speedNormal = document.getElementById('speed-normal') as HTMLButtonElement;
    this.speedFast = document.getElementById('speed-fast') as HTMLButtonElement;
  }

  // Initializes the application: loads data and sets up listeners
  public async start() {
    console.log('Fetching map data...');
    const loadingMessage = this.showLoadingMessage(
      'Loading Kolkata graph (this may take a minute)...'
    );

    try {
      // Fetch graph data from the JSON file
      const response = await fetch('/kolkata_graph.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch graph: ${response.statusText}`);
      }
      const data: GraphJSON = await response.json();

      loadingMessage.textContent = 'Building graph...';
      // Construct the graph object from the loaded JSON data
      this.graph.buildFromJSON(data);

      console.log('Graph is built. App is ready.');
      this.hideLoadingMessage(loadingMessage); // Remove loading overlay

      // Set up event listeners for user interactions
      this.mapManager.onMapClick(this.handleMapClick.bind(this));
      this.algoSelector.addEventListener(
        'change',
        () => this.runVisualization(false) // Re-run visualization without recalculating paths
      );
      this.resetButton.addEventListener('click', this.handleReset.bind(this));

      // Speed control listeners: update speed and restart visualization
      this.speedSlow.addEventListener('click', () => {
        this.currentSpeed = 50; // Slow speed
        this.runVisualization(false);
      });
      this.speedNormal.addEventListener('click', () => {
        this.currentSpeed = 5; // Normal speed
        this.runVisualization(false);
      });
      this.speedFast.addEventListener('click', () => {
        this.currentSpeed = 0; // Fast speed
        this.runVisualization(false);
      });

    } catch (err) {
      console.error('Error during app initialization:', err);
      loadingMessage.textContent = 'Error loading map data. Please refresh.';
    }
  }

  // Resets the application state completely
  private handleReset() {
    console.log('Resetting application state.');
    this.visualizer.clearLayers();
    this.mapManager.clearMarkers();
    this.startNode = null;
    this.endNode = null;
    this.lastResults.clear(); // Clear cached algorithm results
    this.lastTimes.clear();   // Clear cached algorithm times
    this.updateStatsPanel('Click on the map to set a start point.'); // Reset stats display
  }

  // Handles clicks on the map to set start/end points or trigger a reset
  private handleMapClick(node: GraphNode) {
    this.visualizer.clearLayers(); // Clear any existing animation layers

    if (!this.startNode) {
      // First click sets the start node
      this.startNode = node;
      this.mapManager.clearMarkers();
      this.mapManager.setMarker(node, 'start');
      this.updateStatsPanel('Click on the map to set an end point.');
    } else if (!this.endNode) {
      // Second click sets the end node and runs the algorithms
      this.endNode = node;
      this.mapManager.setMarker(node, 'end');
      this.runVisualization(true); // Recalculate paths for the new points
    } else {
      // Third click resets the state and sets a new start node
      this.handleReset();
      this.startNode = node;
      this.mapManager.setMarker(node, 'start');
      this.updateStatsPanel('Click on the map to set an end point.');
    }
  }

  // Executes algorithms (if needed) and starts the visualization for the selected one
  private runVisualization(recalculate: boolean = false) {
    // Ensure both start and end nodes are defined
    if (!this.startNode || !this.endNode) {
      return;
    }

    this.visualizer.clearLayers(); // Clear previous animation paths

    // Clear cached results if new points were selected
    if (recalculate) {
      this.lastResults.clear();
      this.lastTimes.clear();
    }

    const selectedAlgo = this.algoSelector.value; // Get the currently selected algorithm
    const speed = this.currentSpeed; // Use the currently set animation speed

    // Run all algorithms if the cache is empty
    if (this.lastResults.size === 0) {
      console.log('Calculating all algorithm paths...');
      let startTime; // Variable to store start time for performance measurement

      // Execute Dijkstra and store result/time
      startTime = performance.now();
      this.lastResults.set('dijkstra', dijkstra(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('dijkstra', performance.now() - startTime);

      // Execute A* and store result/time
      startTime = performance.now();
      this.lastResults.set('astar', aStar(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('astar', performance.now() - startTime);

      // Execute Greedy Best-First Search and store result/time
      startTime = performance.now();
      this.lastResults.set('gbfs', greedyBestFirstSearch(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('gbfs', performance.now() - startTime);

      // Execute Breadth-First Search and store result/time
      startTime = performance.now();
      this.lastResults.set('bfs', breadthFirstSearch(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('bfs', performance.now() - startTime);

      // Execute Depth-First Search and store result/time
      startTime = performance.now();
      this.lastResults.set('dfs', depthFirstSearch(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('dfs', performance.now() - startTime);
    }

    // Retrieve the cached result and time for the selected algorithm
    const result = this.lastResults.get(selectedAlgo)!;
    const time = this.lastTimes.get(selectedAlgo)!;

    // Start the animation process
    console.log(`Animating ${selectedAlgo}...`);
    this.visualizer.animate(result, speed);

    // Update the statistics display panel
    this.updateStatsPanel(
      `<strong>${this.algoSelector.options[this.algoSelector.selectedIndex].text}</strong>`, // Use the display name from the dropdown
      result,
      time
    );
  }

  // Updates the HTML content of the statistics panel
  private updateStatsPanel(
    title: string,
    result?: AlgorithmResult,
    time?: number
  ) {
    // Display initial message if no results are available
    if (!result || time === undefined) {
      this.statsPanel.innerHTML = `<p>${title}</p>`;
      return;
    }

    // Calculate path distance in kilometers
    const distance =
      result.path.length > 0
        ? this.calculatePathDistance(result.path) / 1000 // Convert meters to km
        : 0;

    // Calculate the number of segments in the path
    const pathSegments = result.path.length > 0 ? result.path.length - 1 : 0;

    // Update the panel with formatted statistics
    this.statsPanel.innerHTML = `
      <h4>${title}</h4>
      <p>Time: <strong>${time.toFixed(2)} ms</strong></p>
      <p>Nodes Explored: <strong>${result.visitedInOrder.length.toLocaleString()}</strong></p>
      <p>Path Distance: <strong>${distance.toFixed(2)} km</strong></p>
      <p>Path Segments: <strong>${pathSegments.toLocaleString()}</strong></p>
    `;
  }

  // Calculates the total distance (sum of edge weights) for a given path
  private calculatePathDistance(path: number[]): number {
    let totalDistance = 0;
    // Sum weights of edges between consecutive nodes in the path
    for (let i = 0; i < path.length - 1; i++) {
      const nodeAId = path[i];
      const nodeBId = path[i + 1];
      const nodeA_data = this.graph.getNode(nodeAId)!;
      const nodeB_data = this.graph.getNode(nodeBId)!;
      // Use the graph's helper method to get edge weight (or approximation)
      totalDistance += this.graph.getEdgeWeight(nodeA_data, nodeB_data);
    }
    return totalDistance;
  }

  // Displays the loading overlay
  private showLoadingMessage(message: string): HTMLElement {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-screen';
    // Basic CSS for the loading overlay
    loadingDiv.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7); color: white; display: flex;
      justify-content: center; align-items: center; font-size: 2em; z-index: 10000;
      font-family: sans-serif; text-align: center;
    `;
    loadingDiv.textContent = message;
    document.body.appendChild(loadingDiv);
    return loadingDiv;
  }

  // Removes the loading overlay
  private hideLoadingMessage(element: HTMLElement) {
    // Check if the element exists and has a parent before attempting removal
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

// Create an instance of the App class and start the application
const app = new App();
app.start();