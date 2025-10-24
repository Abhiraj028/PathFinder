import 'leaflet/dist/leaflet.css';

import { Graph } from '../core/data_structures/Graph';
import { AlgorithmResult, dijkstra } from '../core/algorithms/dijkstra';
import { aStar } from '../core/algorithms/aStar';
import { breadthFirstSearch } from '../core/algorithms/bfs';
import { greedyBestFirstSearch } from '../core/algorithms/gbfs';
import { depthFirstSearch } from '../core/algorithms/dfs';
import { GraphJSON, GraphNode } from '../types';
import { MapManager } from './MapManager';
import { Visualizer } from './Visualizer';

class App {
  private graph: Graph;
  private mapManager: MapManager;
  private visualizer: Visualizer;

  private algoSelector: HTMLSelectElement;
  private statsPanel: HTMLElement;
  private resetButton: HTMLButtonElement;
  private speedSlow: HTMLButtonElement;
  private speedNormal: HTMLButtonElement;
  private speedFast: HTMLButtonElement;

  private startNode: GraphNode | null = null;
  private endNode: GraphNode | null = null;
  private currentSpeed: number = 5;

  private lastResults: Map<string, AlgorithmResult> = new Map();
  private lastTimes: Map<string, number> = new Map();

  constructor() {
    this.graph = new Graph();
    this.mapManager = new MapManager(this.graph);
    this.visualizer = new Visualizer(this.mapManager.map, this.graph);

    this.algoSelector = document.getElementById('algo-select') as HTMLSelectElement;
    this.statsPanel = document.getElementById('stats-panel') as HTMLElement;
    this.resetButton = document.getElementById('reset-button') as HTMLButtonElement;
    this.speedSlow = document.getElementById('speed-slow') as HTMLButtonElement;
    this.speedNormal = document.getElementById('speed-normal') as HTMLButtonElement;
    this.speedFast = document.getElementById('speed-fast') as HTMLButtonElement;
  }

  public async start() {
    console.log('Fetching map data...');
    const loadingMessage = this.showLoadingMessage(
      'Loading Kolkata graph (this may take a minute)...'
    );

    try {
      const response = await fetch('/kolkata_graph.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch graph: ${response.statusText}`);
      }
      const data: GraphJSON = await response.json();

      loadingMessage.textContent = 'Building graph...';
      this.graph.buildFromJSON(data);

      console.log('Graph is built. App is ready.');
      this.hideLoadingMessage(loadingMessage);

      this.mapManager.onMapClick(this.handleMapClick.bind(this));
      this.algoSelector.addEventListener(
        'change',
        () => this.runVisualization(false)
      );

      this.resetButton.addEventListener('click', this.handleReset.bind(this));

      this.speedSlow.addEventListener('click', () => {
        this.currentSpeed = 50;
        this.runVisualization(false);
      });
      this.speedNormal.addEventListener('click', () => {
        this.currentSpeed = 5;
        this.runVisualization(false);
      });
      this.speedFast.addEventListener('click', () => {
        this.currentSpeed = 0;
        this.runVisualization(false);
      });

    } catch (err) {
      console.error(err);
      loadingMessage.textContent = 'Error loading map data. Please refresh.';
    }
  }

  private handleReset() {
    console.log('Resetting application state.');
    this.visualizer.clearLayers();
    this.mapManager.clearMarkers();
    this.startNode = null;
    this.endNode = null;
    this.lastResults.clear();
    this.lastTimes.clear();
    this.updateStatsPanel('Click on the map to set a start point.');
  }

  private handleMapClick(node: GraphNode) {
    this.visualizer.clearLayers();

    if (!this.startNode) {
      this.startNode = node;
      this.mapManager.clearMarkers();
      this.mapManager.setMarker(node, 'start');
      this.updateStatsPanel('Click on the map to set an end point.');

    } else if (!this.endNode) {
      this.endNode = node;
      this.mapManager.setMarker(node, 'end');
      this.runVisualization(true);

    } else {
      this.handleReset();
      this.startNode = node;
      this.mapManager.setMarker(node, 'start');
      this.updateStatsPanel('Click on the map to set an end point.');
    }
  }

  private runVisualization(recalculate: boolean = false) {
    if (!this.startNode || !this.endNode) {
      return;
    }

    this.visualizer.clearLayers();

    if (recalculate) {
      this.lastResults.clear();
      this.lastTimes.clear();
    }

    const selectedAlgo = this.algoSelector.value;
    const speed = this.currentSpeed;

    if (this.lastResults.size === 0) {
      console.log('Calculating all algorithm paths...');

      let startTime = performance.now();
      this.lastResults.set('dijkstra', dijkstra(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('dijkstra', performance.now() - startTime);

      startTime = performance.now();
      this.lastResults.set('astar', aStar(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('astar', performance.now() - startTime);

      startTime = performance.now();
      this.lastResults.set('gbfs', greedyBestFirstSearch(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('gbfs', performance.now() - startTime);

      startTime = performance.now();
      this.lastResults.set('bfs', breadthFirstSearch(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('bfs', performance.now() - startTime);

      startTime = performance.now();
      this.lastResults.set('dfs', depthFirstSearch(this.graph, this.startNode.id, this.endNode.id));
      this.lastTimes.set('dfs', performance.now() - startTime);
    }

    const result = this.lastResults.get(selectedAlgo)!;
    const time = this.lastTimes.get(selectedAlgo)!;

    console.log(`Animating ${selectedAlgo}...`);
    this.visualizer.animate(result, speed);

    this.updateStatsPanel(
      `<strong>${this.algoSelector.options[this.algoSelector.selectedIndex].text}</strong>`,
      result,
      time
    );
  }

  private updateStatsPanel(
    title: string,
    result?: AlgorithmResult,
    time?: number
  ) {
    if (!result || time === undefined) {
      this.statsPanel.innerHTML = `<p>${title}</p>`;
      return;
    }

    const distance =
      result.path.length > 0
        ? this.calculatePathDistance(result.path) / 1000
        : 0;

    const pathSegments = result.path.length > 0 ? result.path.length - 1 : 0;

    this.statsPanel.innerHTML = `
      <h4>${title}</h4>
      <p>Time: <strong>${time.toFixed(2)} ms</strong></p>
      <p>Nodes Explored: <strong>${result.visitedInOrder.length.toLocaleString()}</strong></p>
      <p>Path Distance: <strong>${distance.toFixed(2)} km</strong></p>
      <p>Path Segments: <strong>${pathSegments.toLocaleString()}</strong></p>
    `;
  }

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

  private hideLoadingMessage(element: HTMLElement) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }
}

const app = new App();
app.start();