
# Google Maps-Style Map View

## Overview

Replace the current placeholder SVG map with a real, interactive map using **Leaflet** (free, open-source) with **OpenStreetMap** tiles -- the closest free alternative to Google Maps visuals. This gives real streets, labels, terrain, and proper zoom/pan behavior.

## Changes

### 1. Add Leaflet Dependencies

Install `leaflet` and `react-leaflet` for rendering a real tile-based map, plus `@types/leaflet` for TypeScript support.

### 2. Rewrite `src/components/MapView.tsx`

Replace the entire SVG-based fake map with a Leaflet `MapContainer`:

- **Tile layer**: Use OpenStreetMap tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) for a Google Maps-like appearance
- **Auto-fit bounds**: Calculate a `LatLngBounds` from all clinic coordinates + user location and fit the map to those bounds with padding
- **User marker**: Blue pulsing dot (CSS-animated) at the user's current location
- **Clinic markers**: Custom colored markers -- green for the recommended clinic, red for others
- **Popups**: Clicking a clinic pin shows name, wait time, and travel time
- **Disable scroll zoom** on mobile to prevent accidental zoom while scrolling the page
- **Static height**: Keep the current `h-52` (208px) rounded card appearance

### 3. Pass User Location to MapView

Update the `MapView` interface to accept a `userLocation` prop instead of importing the hardcoded `USER_LOCATION` constant. Update `Dashboard.tsx` and `ERDashboard.tsx` to pass this through.

### 4. Add Leaflet CSS

Import Leaflet's required CSS in the component to ensure tiles and markers render correctly.

### 5. Custom Marker Styling

Create custom CSS-based markers (no external image dependencies) for:
- **User location**: Blue dot with pulsing ring animation (similar to Google Maps' blue dot)
- **Winner clinic**: Green map pin with a subtle glow
- **Other clinics**: Red/muted map pins

---

## Technical Details

### Files to Modify
- `src/components/MapView.tsx` -- full rewrite to use react-leaflet
- `src/components/Dashboard.tsx` -- pass `userLocation` prop to MapView
- `src/components/ERDashboard.tsx` -- pass `userLocation` prop to MapView
- `src/pages/Index.tsx` -- pass `userLocation` down to Dashboard/ERDashboard

### New Dependencies
- `leaflet` -- map rendering engine
- `react-leaflet` -- React bindings for Leaflet
- `@types/leaflet` -- TypeScript definitions

### Key Implementation Details
- Use `react-leaflet`'s `MapContainer`, `TileLayer`, `Marker`, `Popup`, and `useMap` components
- Create a `FitBounds` helper component that uses `useMap()` to call `map.fitBounds()` on mount
- Use Leaflet's `divIcon` for custom HTML/CSS markers instead of default image markers (avoids missing marker icon issues common with bundlers)
- Import `leaflet/dist/leaflet.css` directly in the component
- The map will be non-interactive on scroll (dragging and pinch-zoom still work) to prevent hijacking page scroll on mobile
