# Pathfinding Algorithm Visualizer (Kolkata)

This project visualizes various pathfinding algorithms (Dijkstra, A*, BFS, GBFS, DFS) on a real-world street map of Kolkata and Howrah, India, using data from OpenStreetMap. It allows users to select start and end points on the map and see the algorithm's exploration process unfold in real-time.

## Features

* Visualizes multiple pathfinding algorithms: Dijkstra, A\* (A-Star), Breadth-First Search (BFS), Greedy Best-First Search (GBFS), and Depth-First Search (DFS).
* Uses real-world road network data for Kolkata and Howrah from OpenStreetMap.
* Interactive map interface using Leaflet.js.
* Real-time animation of the algorithm's node exploration process.
* Displays performance statistics for each algorithm (time, nodes explored, path distance, path segments).
* User controls for selecting algorithms, resetting the visualization, and adjusting animation speed.
* Map boundaries restricted to the relevant Kolkata/Howrah area.

## Setup Instructions

Follow these steps to set up the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd PathFinder 
    ```

2.  **Install Node.js Dependencies:**
    This installs Vite, TypeScript, Leaflet, and other necessary frontend packages.
    ```bash
    npm install
    ```

3.  **Set Up Python Environment:**
    ```bash
    python3 -m venv venv

    source venv/bin/activate
    ```

4.  **Install Python Dependencies:**
    This installs `osmnx` and `networkx`, which are needed for processing the map data.
    ```bash
    pip install osmnx networkx
    ```

5.  **Process the Map Data:**
    This script downloads the latest road network data for Kolkata and Howrah using `osmnx` and processes it into a JSON graph file (`public/kolkata_graph.json`) that the web application uses. This step only needs to be run once (or whenever you want to update the map data).
    ```bash
    python process_map.py
    ```

## Running the Application

Once the setup is complete, you can start:

```bash
npm run dev