import osmnx as ox
import networkx as nx
import json
import os

CITY_NAMES = ["Kolkata, West Bengal, India", "Howrah, West Bengal, India"]
OUTPUT_FILE = "public/kolkata_graph.json"   
NETWORK_TYPE = "drive"

def create_graph_from_osm():
    print(f"Downloading graph data for {', '.join(CITY_NAMES)}...")
    
    G = ox.graph_from_place(CITY_NAMES, network_type=NETWORK_TYPE, simplify=True)
    
    print("Graph downloaded. Converting to simple JSON format...")
    
    G_simple = nx.convert_node_labels_to_integers(G, first_label=0)
    
    output_graph = {
        "nodes": {},
        "edges": []
    }

    for node, data in G_simple.nodes(data=True):
        output_graph["nodes"][node] = {
            "id": node,
            "lat": data['y'], 
            "lon": data['x']  
        }

    for u, v, data in G_simple.edges(data=True):
        output_graph["edges"].append({
            "source": u,
            "target": v,
            "weight": data['length'] 
        })
        
    print(f"Graph has {len(output_graph['nodes'])} nodes and {len(output_graph['edges'])} edges.")
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output_graph, f)
        
    print(f"Successfully saved graph to {OUTPUT_FILE}")
    print("You can now run 'npm run dev'")


if __name__ == "__main__":
    create_graph_from_osm()