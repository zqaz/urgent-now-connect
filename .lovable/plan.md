

# Urgent Now — Emergency Medical Finder

## Overview
A clean, calm-themed app that helps users quickly find nearby medical facilities (urgent care, ERs, pharmacies) during emergencies, with directions, call buttons, and first aid tips.

## Pages & Features

### 1. Home Screen
- Large "Find Help Now" button that triggers location access and searches nearby facilities
- Quick-access category buttons: Urgent Care, Emergency Room, Pharmacy
- Emergency 911 call button always visible at the top

### 2. Results / Map View
- List of nearby facilities sorted by distance, with estimated drive time
- Each facility card shows: name, type (ER/Urgent Care/Pharmacy), distance, address, phone number
- "Call" button on each card for one-tap calling
- "Directions" button that opens Google Maps/Apple Maps with the address
- Placeholder for wait time display (noted as "coming soon" since real wait time APIs are limited)

### 3. First Aid Tips Page
- Categorized emergency first aid guides (CPR, choking, bleeding, burns, allergic reactions, seizures)
- Step-by-step instructions with clear formatting
- Accessible from the nav bar and from the results screen

### Design
- Clean white/light blue palette with calm, readable typography
- Large tap targets for use under stress
- Persistent red 911 button in the header
- Mobile-first responsive design

### Technical Notes
- Uses browser Geolocation API to get user's position
- Uses Google Places API (or similar) for finding nearby medical facilities — will use mock data initially, with option to integrate a real API later
- No backend needed for initial version

