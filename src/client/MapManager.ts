import L from 'leaflet';
import { Graph } from '../core/data_structures/Graph';
import { GraphNode } from '../types';
import { haversineDistance } from '../core/utils/haversine';

export class MapManager {
  public map: L.Map;
  private graph: Graph;
  private markers: L.Marker[] = [];
  private startMarker: L.Marker | null = null;

  constructor(graph: Graph) {
    this.graph = graph;
    this.map = this.initMap();
  }

  private initMap(): L.Map {
    const southWest = L.latLng(22.4, 88.2);
    const northEast = L.latLng(22.8, 88.5);
    const bounds = L.latLngBounds(southWest, northEast);

    const map = L.map('map', {
      maxBounds: bounds,
      minZoom: 11,
    }).setView([22.5726, 88.3639], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.fitBounds(bounds);
    return map;
  }

  // Sets up a click listener that reports the nearest node.
  public onMapClick(callback: (node: GraphNode) => void) {
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const nearestNode = this.findNearestNode(lat, lng);
      callback(nearestNode);
    });
  }

  // Finds the closest graph node to the given coordinates.
  public findNearestNode(lat: number, lon: number): GraphNode {
    let minDistance = Infinity;
    let nearestNode: GraphNode | null = null;

    // Brute-force search: check distance to all nodes.
    for (const node of this.graph.getNodes().values()) {
      const distance = haversineDistance(lat, lon, node.lat, node.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }
    // Assumes a node will always be found.
    return nearestNode!; 
  }

  // Clears all start/end markers from the map.
  public clearMarkers() {
    for (const marker of this.markers) {
      this.map.removeLayer(marker);
    }
    this.markers = [];
    this.startMarker = null;
  }

  // Adds a start or end marker at the specified node's location. 
  public setMarker(node: GraphNode, type: 'start' | 'end') {
    const marker = L.marker([node.lat, node.lon]).addTo(this.map);

    if (type === 'start') {
      marker.bindPopup('<b>Start Point</b>');
      marker.openPopup(); // Only open popup for the start marker
      this.startMarker = marker;
    } else {
      marker.bindPopup('<b>End Point</b>');
      // Close the start popup when the end marker is set.
      this.startMarker?.closePopup(); 
      // Do not automatically open the end popup.
    }

    this.markers.push(marker);
  }
}