'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function Globe() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Use provided token or fallback to env variable
    const token =
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      'pk.eyJ1IjoibWF0cm93eSIsImEiOiJjbHdjNm91aHYwdG9uMmpwNTcxeXhqeWNwIn0.TjvcVEr5Zyn7Gu2H3bSnmw';

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      zoom: 1.5,
      center: [-90, 40],
    });

    map.current.on('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({}); // Set the default atmosphere style

      // Enable 3D buildings and make them black and white
      const layers = map.current.getStyle().layers;
      
      // Process layers in reverse order to maintain proper layering
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        
        // Check if this is a building layer
        if (layer.id.includes('building') || layer['source-layer'] === 'building') {
          if (layer.type === 'fill') {
            // Convert 2D fill buildings to 3D fill-extrusion
            const sourceLayer = layer['source-layer'];
            const source = layer.source;
            
            // Remove the old fill layer
            if (map.current.getLayer(layer.id)) {
              map.current.removeLayer(layer.id);
            }
            
            // Add as 3D fill-extrusion layer with black color
            map.current.addLayer({
              id: layer.id + '-3d',
              type: 'fill-extrusion',
              source: source,
              'source-layer': sourceLayer,
              filter: layer.filter || ['has', 'height'],
              paint: {
                'fill-extrusion-color': '#000000',
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.9,
              },
            }, layers[i + 1]?.id); // Insert before the next layer
          } else if (layer.type === 'fill-extrusion') {
            // Update existing 3D buildings to black
            map.current.setPaintProperty(layer.id, 'fill-extrusion-color', '#000000');
            map.current.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.9);
          }
        }
      }

      // Buildings are now 3D and black/white
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen">
      <div
        ref={mapContainer}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  );
}
