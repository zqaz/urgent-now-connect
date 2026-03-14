/**
 * Opens directions to a destination in Google Maps.
 * Uses the clinic address string so the destination matches the clinic card.
 */
export const openDirections = (lat: number, lng: number, name?: string, address?: string) => {
  // Prefer address string so Google Maps shows the same address as the clinic card.
  // Fall back to coordinates if no address is provided.
  const destination = address
    ? encodeURIComponent(address)
    : `${lat},${lng}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

  // Use a programmatic <a> click instead of window.open() to avoid
  // Chrome's popup blocker which can intercept window.open with features.
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

