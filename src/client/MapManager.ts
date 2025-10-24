import L from 'leaflet';
import { Graph } from '../core/data_structures/Graph';
import { GraphNode } from '../types';
import { haversineDistance } from '../core/utils/haversine';

export class MapManager {
  public map: L.Map;
  private graph: Graph;
  private markers: L.Marker[] = [];
  private startMarker: L.Marker | null = null;
  private bounds: L.LatLngBounds; // Define bounds as a class property

  constructor(graph: Graph) {
    this.graph = graph;
    // Initialize bounds here before initMap uses it
    const southWest = L.latLng(22.48, 88.25);
    const northEast = L.latLng(22.65, 88.45);
    this.bounds = L.latLngBounds(southWest, northEast);
    this.map = this.initMap();
  }

  private initMap(): L.Map {
    // Bounds are now defined in the constructor and accessed via 'this'
    const map = L.map('map', {
      maxBounds: this.bounds, // Use the class property
      minZoom: 12,
    }).setView(
      [22.5726, 88.3639], // Kolkata center coordinates
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Fit the map to the tighter bounds on load
    map.fitBounds(this.bounds); // Use the class property

    return map;
  }

  // Sets up a click listener that reports the nearest node.
  public onMapClick(callback: (node: GraphNode) => void) {
    this.map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      // Check if click is within the allowed bounds
      if (this.bounds.contains(e.latlng)) { // Use the class property 'this.bounds'
          const nearestNode = this.findNearestNode(lat, lng);
          callback(nearestNode);
      } else {
          console.log("Clicked outside defined map bounds.");
          // Optionally provide feedback to the user, e.g., using an alert or a temporary message on the UI
          // alert("Please click within the Kolkata/Howrah map area.");
      }
    });
  }


  // Finds the closest graph node to the given coordinates.
  public findNearestNode(lat: number, lon: number): GraphNode {
    let minDistance = Infinity;
    let nearestNode: GraphNode | null = null;

    for (const node of this.graph.getNodes().values()) {
      const distance = haversineDistance(lat, lon, node.lat, node.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }
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
      marker.openPopup();
      this.startMarker = marker;
    } else {
      marker.bindPopup('<b>End Point</b>');
      this.startMarker?.closePopup();
    }

    this.markers.push(marker);
  }
}