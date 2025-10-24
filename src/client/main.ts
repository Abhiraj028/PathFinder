// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Import core components
import { Graph } from '../core/data_structures/Graph';
import { AlgorithmResult, dijkstra } from '../core/algorithms/dijkstra';
import { aStar } from '../core/algorithms/aStar';
import { breadthFirstSearch } from '../core/algorithms/bfs';
import { greedyBestFirstSearch } from '../core/algorithms/gbfs';
import { depthFirstSearch } from '../core/algorithms/dfs';

// Import types and utilities
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
  private leaderboardContent: HTMLElement;
  private resetButton: HTMLButtonElement;
  private speedSlow: HTMLButtonElement;
  private speedNormal: HTMLButtonElement;
  private speedFast: HTMLButtonElement;

  // State
  private startNode: GraphNode | null = null;
  private endNode: GraphNode | null = null;
  private currentSpeed: number = 0; // Default speed set to Fast (0ms)

  // Caching
  private lastResults: Map<string, AlgorithmResult> = new Map();
  private lastTimes: Map<string, number> = new Map();

  // Leaderboard config
  private algoOrder: string[] = ['astar', 'gbfs', 'dijkstra', 'bfs', 'dfs'];
  private algoNames: { [key: string]: string } = {
    astar: 'A*', gbfs: 'Greedy BFS', dijkstra: 'Dijkstra', bfs: 'BFS', dfs: 'DFS',
  };

  constructor() {
    this.graph = new Graph();
    this.mapManager = new MapManager(this.graph);
    this.visualizer = new Visualizer(this.mapManager.map, this.graph);

    // Get DOM elements
    this.algoSelector = document.getElementById('algo-select') as HTMLSelectElement;
    this.statsPanel = document.getElementById('stats-panel') as HTMLElement;
    this.leaderboardContent = document.getElementById('leaderboard-content') as HTMLElement;
    this.resetButton = document.getElementById('reset-button') as HTMLButtonElement;
    this.speedSlow = document.getElementById('speed-slow') as HTMLButtonElement;
    this.speedNormal = document.getElementById('speed-normal') as HTMLButtonElement;
    this.speedFast = document.getElementById('speed-fast') as HTMLButtonElement;
  }

  // Initializes the application
  public async start() {
    console.log('Fetching map data...');
    const loadingMessage = this.showLoadingMessage('Loading Kolkata graph...');

    try {
      const response = await fetch('/kolkata_graph.json');
      if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
      const data: GraphJSON = await response.json();

      loadingMessage.textContent = 'Building graph...';
      this.graph.buildFromJSON(data);

      console.log('Graph built. App ready.');
      this.hideLoadingMessage(loadingMessage);

      // Setup event listeners
      this.mapManager.onMapClick(this.handleMapClick.bind(this));
      this.algoSelector.addEventListener('change', () => this.runVisualization(false)); // Don't recalculate on change
      this.resetButton.addEventListener('click', this.handleReset.bind(this));

      // --- CORRECTED SPEED LISTENERS ---
      // These should call runVisualization to restart the animation with the new speed.
      this.speedSlow.addEventListener('click', () => {
        this.currentSpeed = 50; // Slow speed
        this.runVisualization(false); // Restart animation with new speed
      });
      this.speedNormal.addEventListener('click', () => {
        this.currentSpeed = 5; // Normal speed
        this.runVisualization(false); // Restart animation with new speed
      });
      this.speedFast.addEventListener('click', () => {
        this.currentSpeed = 0; // Fast speed
        this.runVisualization(false); // Restart animation with new speed
      });
      // ------------------------------------

    } catch (err) {
      console.error('Initialization error:', err);
      loadingMessage.textContent = 'Error loading data. Refresh needed.';
    }
  }

  // --- Rest of the file (handleReset, handleMapClick, runVisualization, etc.) is unchanged ---
  // Resets the application state
  private handleReset() {
    console.log('Resetting state.');
    this.visualizer.clearLayers();
    this.mapManager.clearMarkers();
    this.startNode = null;
    this.endNode = null;
    this.lastResults.clear();
    this.lastTimes.clear();
    this.updateStatsPanel('Click map for start point.');
    this.updateLeaderboardPanel(true); // Clear leaderboard display
  }

  // Handles map clicks
  private handleMapClick(node: GraphNode) {
    this.visualizer.clearLayers();

    if (!this.startNode) {
      this.startNode = node;
      this.mapManager.clearMarkers();
      this.mapManager.setMarker(node, 'start');
      this.updateStatsPanel('Click map for end point.');
      this.updateLeaderboardPanel(true); // Clear leaderboard

    } else if (!this.endNode) {
      this.endNode = node;
      this.mapManager.setMarker(node, 'end');
      this.runVisualization(true); // Recalculate ONLY the selected algo

    } else {
      // Third click resets
      this.handleReset();
      this.startNode = node;
      this.mapManager.setMarker(node, 'start');
      this.updateStatsPanel('Click map for end point.');
    }
  }

  /**
   * Runs the selected algorithm (if needed) and starts visualization.
   * Updates leaderboard with currently available data.
   */
  private runVisualization(recalculate: boolean = false) {
    if (!this.startNode || !this.endNode) return;

    this.visualizer.clearLayers();

    // Clear caches only if new points were clicked
    if (recalculate) {
      this.lastResults.clear();
      this.lastTimes.clear();
    }

    const selectedAlgo = this.algoSelector.value;
    const speed = this.currentSpeed; // Use the currently set speed
    let result: AlgorithmResult | undefined = this.lastResults.get(selectedAlgo);
    let time: number | undefined = this.lastTimes.get(selectedAlgo);

    // Only run the algorithm if its results aren't cached
    if (result === undefined || time === undefined) {
      console.log(`Calculating path for ${selectedAlgo}...`);
      let startTime = performance.now();
      let calculatedResult: AlgorithmResult | null = null;

      // Select and run the specific algorithm
      switch (selectedAlgo) {
        case 'dijkstra':
          calculatedResult = dijkstra(this.graph, this.startNode.id, this.endNode.id);
          break;
        case 'astar':
          calculatedResult = aStar(this.graph, this.startNode.id, this.endNode.id);
          break;
        case 'gbfs':
          calculatedResult = greedyBestFirstSearch(this.graph, this.startNode.id, this.endNode.id);
          break;
        case 'bfs':
          calculatedResult = breadthFirstSearch(this.graph, this.startNode.id, this.endNode.id);
          break;
        case 'dfs':
          calculatedResult = depthFirstSearch(this.graph, this.startNode.id, this.endNode.id);
          break;
        default:
          console.error(`Unknown algorithm selected: ${selectedAlgo}`);
          return;
      }

      time = performance.now() - startTime;
      result = calculatedResult!; // Assume calculation was successful

      // Cache the new result
      this.lastResults.set(selectedAlgo, result);
      this.lastTimes.set(selectedAlgo, time);

      // Update the leaderboard now that new data is available
      this.updateLeaderboardPanel();
    }

    // Animate the result (either newly calculated or cached)
    if (result) {
      console.log(`Animating ${selectedAlgo}...`);
      this.visualizer.animate(result, speed); // Pass the current speed
      this.updateStatsPanel(
        `<strong>${this.algoSelector.options[this.algoSelector.selectedIndex].text}</strong>`,
        result,
        time
      );
    } else {
      console.error(`Result for ${selectedAlgo} could not be retrieved or calculated.`);
      this.updateStatsPanel(`Error: No result for ${selectedAlgo}.`);
    }
  }

  // Updates the stats panel
  private updateStatsPanel(
    title: string,
    result?: AlgorithmResult,
    time?: number
  ) {
    if (!result || time === undefined) {
      this.statsPanel.innerHTML = `<p>${title}</p>`;
      return;
    }
    const distance = result.path.length > 0 ? this.calculatePathDistance(result.path) / 1000 : 0;
    const pathSegments = result.path.length > 0 ? result.path.length - 1 : 0;
    this.statsPanel.innerHTML = `
      <h4>${title}</h4>
      <p>Time: <strong>${time.toFixed(2)} ms</strong></p>
      <p>Nodes Explored: <strong>${result.visitedInOrder.length.toLocaleString()}</strong></p>
      <p>Path Distance: <strong>${distance.toFixed(2)} km</strong></p>
      <p>Path Segments: <strong>${pathSegments.toLocaleString()}</strong></p>
    `;
  }

  // Updates the leaderboard panel
  private updateLeaderboardPanel(clear: boolean = false) {
    if (clear || this.lastResults.size === 0) {
      this.leaderboardContent.innerHTML = 'Set start and end points to see results.';
      return;
    }

    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Algo</th><th>Time (ms)</th><th>Nodes</th><th>Dist (km)</th><th>Segs</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Generate table rows based on cached results
    for (const algoKey of this.algoOrder) {
        const result = this.lastResults.get(algoKey);
        const time = this.lastTimes.get(algoKey);

        tableHTML += `<tr><td>${this.algoNames[algoKey] || algoKey}</td>`;
        // Check if results for this algorithm exist in the cache
        if (result && time !== undefined) {
            const distance = result.path.length > 0 ? this.calculatePathDistance(result.path) / 1000 : 0;
            const segments = result.path.length > 0 ? result.path.length - 1 : 0;
            tableHTML += `
              <td>${time.toFixed(2)}</td>
              <td>${result.visitedInOrder.length.toLocaleString()}</td>
              <td>${distance.toFixed(2)}</td>
              <td>${segments.toLocaleString()}</td>
            `;
        } else {
             // Display placeholders if results are not yet calculated
             tableHTML += `<td colspan="4" style="text-align:center;">-</td>`;
        }
        tableHTML += `</tr>`;
    }

    tableHTML += `</tbody></table>`;
    this.leaderboardContent.innerHTML = tableHTML;
  }

  // Calculates path distance
  private calculatePathDistance(path: number[]): number {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const nodeAId = path[i];
      const nodeBId = path[i + 1];
      const nodeA_data = this.graph.getNode(nodeAId)!;
      const nodeB_data = this.graph.getNode(nodeBId)!;
      totalDistance += this.graph.getEdgeWeight(nodeA_data, nodeB_data);
    }
    return totalDistance;
  }

  // Shows loading message
  private showLoadingMessage(message: string): HTMLElement {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-screen';
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

  // Hides loading message
  private hideLoadingMessage(element: HTMLElement) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

// Instantiate and start the application
const app = new App();
app.start();