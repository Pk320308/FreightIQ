'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RouteMapProps {
  origin: [number, number];
  destination: [number, number];
  originLabel?: string;
  destinationLabel?: string;
  className?: string;
  intermediatePoints?: [number, number][];
}

export function RouteMap({
  origin,
  destination,
  originLabel = 'Origin',
  destinationLabel = 'Destination',
  className,
  intermediatePoints = [],
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    // Destroy existing instance safely if any
    if (mapInstance.current) {
      try {
        mapInstance.current.stop();
        mapInstance.current.remove();
      } catch {
        // ignore cleanup error
      }
      mapInstance.current = null;
    }

    let map: L.Map | null = null;

    try {
      map = L.map(container, {
        center: [(origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
        zoomAnimation: false, // Prevents _leaflet_pos animation race condition
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      const createIcon = (color: string, pulse = false) =>
        L.divIcon({
          className: '',
          html: `<div style="
            width: 14px; height: 14px; border-radius: 50%;
            background: ${color}; border: 2px solid white; box-shadow: 0 0 8px ${color};
            ${pulse ? 'animation: pulse-ring 2s ease-out infinite;' : ''}
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

      L.marker(origin, { icon: createIcon('hsl(217, 91%, 60%)', true) })
        .addTo(map)
        .bindPopup(`<b>${originLabel}</b>`);

      L.marker(destination, { icon: createIcon('hsl(142, 71%, 45%)', true) })
        .addTo(map)
        .bindPopup(`<b>${destinationLabel}</b>`);

      const routePoints = [origin, ...intermediatePoints, destination];
      const polyline = L.polyline(routePoints, {
        color: 'hsl(217, 91%, 60%)',
        weight: 2.5,
        opacity: 0.8,
        dashArray: '8 6',
      }).addTo(map);

      intermediatePoints.forEach((point, i) => {
        if (map) {
          L.marker(point, { icon: createIcon('hsl(38, 92%, 50%)') })
            .addTo(map)
            .bindPopup(`<b>Waypoint ${i + 1}</b>`);
        }
      });

      if (polyline.getBounds().isValid()) {
        map.fitBounds(polyline.getBounds(), { padding: [50, 50], animate: false });
      }
    } catch {
      // guard against SSR or leaflet container initialization error
    }

    return () => {
      if (map) {
        try {
          map.stop();
          map.remove();
        } catch {
          // ignore
        }
        map = null;
        mapInstance.current = null;
      }
    };
  }, [origin, destination, originLabel, destinationLabel, intermediatePoints]);

  return <div ref={mapRef} className={className} style={{ height: '100%', minHeight: '400px', borderRadius: '0.75rem' }} />;
}
