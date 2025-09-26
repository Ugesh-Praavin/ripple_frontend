import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabase';

declare global {
  interface Window {
    L: any;
  }
}

type ReportPoint = { lat: number; lng: number };

function parseCoords(coords: string): ReportPoint | null {
  try {
    if (coords && coords.includes(',')) {
      const [latStr, lngStr] = coords.split(',');
      const lat = parseFloat(latStr.trim());
      const lng = parseFloat(lngStr.trim());
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }
    const obj = JSON.parse(coords);
    if (obj && typeof obj.lat === 'number' && typeof obj.lng === 'number') return { lat: obj.lat, lng: obj.lng };
    return null;
  } catch {
    return null;
  }
}

async function loadLeafletAssets(): Promise<void> {
  // CSS
  if (!document.querySelector('link[data-leaflet]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.setAttribute('data-leaflet', 'true');
    document.head.appendChild(link);
  }
  // Leaflet JS
  if (!window.L) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }
  // Heat plugin
  if (!document.querySelector('script[data-leaflet-heat]')) {
    await new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js';
      script.async = true;
      script.setAttribute('data-leaflet-heat', 'true');
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }
}

export default function HotspotMap() {
  const mapRef = useRef<any | null>(null);
  const markerLayerRef = useRef<any | null>(null);
  const heatLayerRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isHeatmap, setIsHeatmap] = useState(false);
  const [points, setPoints] = useState<ReportPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const grouped = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number; count: number }>();
    for (const p of points) {
      const key = `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
      const prev = map.get(key);
      if (prev) prev.count += 1;
      else map.set(key, { ...p, count: 1 });
    }
    return Array.from(map.values());
  }, [points]);

  const heatData = useMemo(() => {
    if (grouped.length === 0) return [] as any[];
    const max = Math.max(...grouped.map((g) => g.count), 1);
    return grouped.map((g) => [g.lat, g.lng, Math.max(0.2, g.count / max)]);
  }, [grouped]);

  

  const fetchPoints = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('coords')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const pts: ReportPoint[] = [];
      (data || []).forEach((row: any) => {
        const pt = row?.coords ? parseCoords(row.coords) : null;
        if (pt) pts.push(pt);
      });
      setPoints(pts);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Hotspot] Fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
    // realtime updates when new reports are inserted
    const channel = supabase
      .channel('realtime:reports-hotspot')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, () => {
        fetchPoints();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPoints]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadLeafletAssets();
      if (cancelled) return;
      if (!containerRef.current) return;
      const L = window.L;
      if (!mapRef.current) {
        const center = points[0] || { lat: 12.9716, lng: 77.5946 };
        const map = L.map(containerRef.current).setView([center.lat, center.lng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapRef.current = map;
        markerLayerRef.current = L.layerGroup().addTo(map);
      }
      renderLayers();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  useEffect(() => {
    renderLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHeatmap, heatData]);

  const renderLayers = () => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;

    // clear marker layer
    if (markerLayerRef.current) {
      markerLayerRef.current.clearLayers();
    }
    // remove heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (isHeatmap) {
      if (heatData.length > 0) {
        const heat = (L as any).heatLayer(heatData, { radius: 25, blur: 15, maxZoom: 17 });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    } else {
      grouped.forEach((g) => {
        const marker = L.circleMarker([g.lat, g.lng], {
          radius: Math.min(14, 6 + Math.log2(g.count + 1)),
          color: '#2563eb',
          weight: 1,
          fillColor: '#60a5fa',
          fillOpacity: 0.6,
        }).bindTooltip(`${g.count} report${g.count > 1 ? 's' : ''}`);
        markerLayerRef.current.addLayer(marker);
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hotspot Detection</h3>
          <p className="text-sm text-gray-500">Visualize report density as a heatmap</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHeatmap(false)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${!isHeatmap ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Markers
          </button>
          <button
            onClick={() => setIsHeatmap(true)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${isHeatmap ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Heatmap
          </button>
        </div>
      </div>
      {loading && (
        <div className="px-4 pb-2 text-sm text-gray-500">Loading map data…</div>
      )}
      <div ref={containerRef} className="h-96 w-full rounded-b-lg" />
    </div>
  );
}



