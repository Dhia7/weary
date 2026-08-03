'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type DeliveryRouteMapLeafletProps = {
  reduceMotion: boolean;
  genevaLabel: string;
  swissHint: string;
  tunisiaLabel: string;
  destinationHint: string;
};

const GENEVA: L.LatLngExpression = [46.2044, 6.1432];
const TUNIS: L.LatLngExpression = [36.8065, 10.1815];
const ARC_CONTROL: L.LatLngExpression = [42.2, 8.6];

const GOLD = '#c5a059';
const INK = '#2d2416';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setBp('mobile');
      else if (w < 1024) setBp('tablet');
      else setBp('desktop');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return bp;
}

function toLatLng(p: L.LatLngExpression): L.LatLng {
  return L.latLng(p);
}

function pointOnRoute(t: number): L.LatLng {
  const p0 = toLatLng(GENEVA);
  const p1 = toLatLng(ARC_CONTROL);
  const p2 = toLatLng(TUNIS);
  const u = 1 - t;
  return L.latLng(
    u * u * p0.lat + 2 * u * t * p1.lat + t * t * p2.lat,
    u * u * p0.lng + 2 * u * t * p1.lng + t * t * p2.lng
  );
}

function buildRouteLatLngs(steps = 48): L.LatLngExpression[] {
  return Array.from({ length: steps + 1 }, (_, i) => pointOnRoute(i / steps));
}

function FitRouteBounds({
  positions,
  breakpoint,
}: {
  positions: L.LatLngExpression[];
  breakpoint: Breakpoint;
}) {
  const map = useMap();

  useEffect(() => {
    const fit = () => {
      map.invalidateSize();

      // Wider context on mobile so both cities stay readable in a tall frame
      const context: L.LatLngExpression[] =
        breakpoint === 'mobile'
          ? [
              [49.2, 0.5],
              [32.8, 15.2],
            ]
          : breakpoint === 'tablet'
            ? [
                [48.8, 1.2],
                [33.2, 14.8],
              ]
            : [
                [48.5, 1.5],
                [33.5, 14.5],
              ];

      const bounds = L.latLngBounds([
        ...context.map((p) => toLatLng(p)),
        ...positions.map((p) => toLatLng(p)),
      ]);

      const padding: L.PointExpression =
        breakpoint === 'mobile'
          ? [28, 56]
          : breakpoint === 'tablet'
            ? [40, 48]
            : [44, 44];

      map.fitBounds(bounds, {
        padding,
        maxZoom: breakpoint === 'mobile' ? 5 : 6,
      });
    };

    fit();
    const t1 = window.setTimeout(fit, 120);
    const t2 = window.setTimeout(fit, 400);

    const container = map.getContainer();
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            fit();
          })
        : null;
    ro?.observe(container);

    const onOrient = () => window.setTimeout(fit, 200);
    window.addEventListener('orientationchange', onOrient);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro?.disconnect();
      window.removeEventListener('orientationchange', onOrient);
    };
  }, [map, positions, breakpoint]);

  return null;
}

function planeIcon(size: number): L.DivIcon {
  const half = size / 2;
  const svg = Math.round(size * 0.78);
  // Classic flight icon — nose points UP (north). Rotate by geographic bearing.
  return L.divIcon({
    className: 'swisia-plane-icon',
    iconSize: [size, size],
    iconAnchor: [half, half],
    html: `<div class="swisia-plane-rotator" style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;transform-origin:50% 50%;filter:drop-shadow(0 2px 5px rgba(45,36,22,0.35));">
      <svg width="${svg}" height="${svg}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="${GOLD}" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    </div>`,
  });
}

function destinationPinIcon(
  label: string,
  hint: string,
  compact: boolean
): L.DivIcon {
  const pinW = compact ? 24 : 28;
  const pinH = compact ? 32 : 36;
  const badge = compact
    ? ''
    : `<div style="background:#c5a059;color:#fff;font-family:var(--font-satoshi),system-ui,sans-serif;font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:3px 7px;white-space:nowrap;margin-bottom:4px;">${hint}</div>`;

  return L.divIcon({
    className: 'swisia-destination-icon',
    iconSize: [pinW, compact ? pinH : pinH + 22],
    iconAnchor: [pinW / 2, compact ? pinH : pinH + 22],
    html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 8px rgba(45,36,22,0.28));">
      ${badge}
      <svg width="${pinW}" height="${pinH}" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 0C7.4 0 2 5.4 2 12c0 9 12 24 12 24s12-15 12-24C26 5.4 20.6 0 14 0z" fill="${GOLD}"/>
        <circle cx="14" cy="12" r="5" fill="#faf8f5"/>
      </svg>
      <span style="position:absolute;width:1px;height:1px;overflow:hidden;">${label}</span>
    </div>`,
  });
}

function AnimatedPlane({
  reduceMotion,
  active,
  breakpoint,
}: {
  reduceMotion: boolean;
  active: boolean;
  breakpoint: Breakpoint;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const initial = reduceMotion ? pointOnRoute(0.45) : pointOnRoute(0);
  const icon = useMemo(
    () => planeIcon(breakpoint === 'mobile' ? 32 : 40),
    [breakpoint]
  );

  useEffect(() => {
    const applyPose = (t: number) => {
      const marker = markerRef.current;
      if (!marker) return;

      const position = pointOnRoute(t);
      const from = pointOnRoute(Math.max(0, t - 0.05));
      const to = pointOnRoute(Math.min(1, t + 0.05));

      // Screen-space heading so the nose tracks the visible path (Geneva → Tunis)
      const a = map.latLngToLayerPoint(from);
      const b = map.latLngToLayerPoint(to);
      const rotation =
        (Math.atan2(b.x - a.x, a.y - b.y) * 180) / Math.PI;

      marker.setLatLng(position);
      const rotator = marker
        .getElement()
        ?.querySelector('.swisia-plane-rotator') as HTMLElement | null;
      if (rotator) {
        rotator.style.transform = `rotate(${rotation}deg)`;
      }
    };

    if (reduceMotion || !active) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      applyPose(reduceMotion ? 0.45 : 0);
      return;
    }

    const DURATION_MS = 6000;
    const PAUSE_MS = 1200;

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const elapsed = (now - startRef.current) % (DURATION_MS + PAUSE_MS);
      if (elapsed <= DURATION_MS) {
        const p = elapsed / DURATION_MS;
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        applyPose(eased);
      } else {
        applyPose(1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [reduceMotion, active, icon, map]);

  return (
    <Marker
      ref={markerRef}
      position={initial}
      icon={icon}
      interactive={false}
      zIndexOffset={500}
    />
  );
}

export default function DeliveryRouteMapLeaflet({
  reduceMotion,
  genevaLabel,
  swissHint,
  tunisiaLabel,
  destinationHint,
}: DeliveryRouteMapLeafletProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const route = useMemo(() => buildRouteLatLngs(56), []);
  const [active, setActive] = useState(false);
  const destIcon = useMemo(
    () => destinationPinIcon(tunisiaLabel, destinationHint, isMobile),
    [tunisiaLabel, destinationHint, isMobile]
  );

  useEffect(() => {
    const id = window.setTimeout(() => setActive(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const lineWeight = isMobile ? 3.5 : 3;
  const originRadius = isMobile ? 9 : 8;
  const pulseRadius = isMobile ? 16 : 18;

  return (
    <MapContainer
      center={[41.5, 8.5]}
      zoom={5}
      className="h-full w-full"
      scrollWheelZoom={false}
      dragging
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      zoomControl={false}
      attributionControl
      style={{ background: '#f5f0e8', height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="/map-tiles/{z}/{x}/{y}{r}.png"
        maxZoom={18}
      />
      <FitRouteBounds positions={route} breakpoint={breakpoint} />
      <Polyline
        positions={route}
        pathOptions={{
          color: GOLD,
          weight: lineWeight,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <Polyline
        positions={route}
        pathOptions={{
          color: GOLD,
          weight: 1.5,
          opacity: 0.35,
          dashArray: '4 8',
        }}
      />

      <CircleMarker
        center={GENEVA}
        radius={originRadius}
        pathOptions={{
          color: '#faf8f5',
          fillColor: GOLD,
          fillOpacity: 1,
          weight: 2,
        }}
      >
        <Tooltip
          permanent
          direction={isMobile ? 'right' : 'top'}
          offset={isMobile ? [12, 0] : [0, -12]}
          className="swisia-map-label"
        >
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-swisse-ink sm:tracking-[0.14em]">
            {genevaLabel}
          </span>
          <span className="mt-0.5 block font-sans text-[8px] font-semibold uppercase tracking-[0.14em] text-swisse-gold">
            {swissHint}
          </span>
        </Tooltip>
      </CircleMarker>

      <CircleMarker
        center={TUNIS}
        radius={pulseRadius}
        pathOptions={{
          color: GOLD,
          fillColor: GOLD,
          fillOpacity: 0.15,
          weight: 1,
        }}
      />
      <Marker
        position={TUNIS}
        icon={destIcon}
        interactive={false}
        zIndexOffset={400}
      >
        <Tooltip
          permanent
          direction={isMobile ? 'left' : 'right'}
          offset={isMobile ? [-14, -8] : [16, -12]}
          className="swisia-map-label"
        >
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-swisse-ink sm:tracking-[0.14em]">
            {tunisiaLabel}
          </span>
          <span className="mt-0.5 block font-sans text-[8px] font-semibold uppercase tracking-[0.14em] text-swisse-gold">
            {destinationHint}
          </span>
        </Tooltip>
      </Marker>

      <AnimatedPlane
        reduceMotion={reduceMotion}
        active={active}
        breakpoint={breakpoint}
      />
    </MapContainer>
  );
}
