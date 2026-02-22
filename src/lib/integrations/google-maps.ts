/**
 * Maps helpers powered by free OpenStreetMap APIs:
 * - Nominatim: geocoding & place lookup
 * - Overpass: POI / category search (restaurants, cafes, etc.)
 * - OSRM: routing / directions
 *
 * No API keys required.
 */

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const OSRM_API = 'https://router.project-osrm.org';
const USER_AGENT = 'Orca/1.0';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  type?: string;
  location?: { latitude: number; longitude: number };
}

interface DirectionsResult {
  distance: string;
  duration: string;
  startAddress: string;
  endAddress: string;
  steps: Array<{ instruction: string; distance: string; duration: string }>;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  type?: string;
  location?: { latitude: number; longitude: number };
  website?: string;
  phone?: string;
  hours?: string[];
}

// Map common search keywords to OSM tags for Overpass queries
const CATEGORY_TAGS: Record<string, string> = {
  restaurant: 'amenity=restaurant',
  restaurants: 'amenity=restaurant',
  food: 'amenity=restaurant',
  dining: 'amenity=restaurant',
  eat: 'amenity=restaurant',
  cafe: 'amenity=cafe',
  cafes: 'amenity=cafe',
  coffee: 'amenity=cafe',
  'coffee shop': 'amenity=cafe',
  'coffee shops': 'amenity=cafe',
  hotel: 'tourism=hotel',
  hotels: 'tourism=hotel',
  hostel: 'tourism=hostel',
  hostels: 'tourism=hostel',
  hospital: 'amenity=hospital',
  hospitals: 'amenity=hospital',
  clinic: 'amenity=clinic',
  pharmacy: 'amenity=pharmacy',
  pharmacies: 'amenity=pharmacy',
  school: 'amenity=school',
  schools: 'amenity=school',
  university: 'amenity=university',
  college: 'amenity=college',
  bank: 'amenity=bank',
  banks: 'amenity=bank',
  atm: 'amenity=atm',
  'gas station': 'amenity=fuel',
  fuel: 'amenity=fuel',
  petrol: 'amenity=fuel',
  parking: 'amenity=parking',
  supermarket: 'shop=supermarket',
  supermarkets: 'shop=supermarket',
  grocery: 'shop=supermarket',
  shop: 'shop=convenience',
  shops: 'shop=convenience',
  store: 'shop=convenience',
  bar: 'amenity=bar',
  bars: 'amenity=bar',
  pub: 'amenity=pub',
  pubs: 'amenity=pub',
  temple: 'amenity=place_of_worship',
  church: 'amenity=place_of_worship',
  mosque: 'amenity=place_of_worship',
  museum: 'tourism=museum',
  park: 'leisure=park',
  parks: 'leisure=park',
  gym: 'leisure=fitness_centre',
  'fast food': 'amenity=fast_food',
  bakery: 'shop=bakery',
  library: 'amenity=library',
  police: 'amenity=police',
  'post office': 'amenity=post_office',
  cinema: 'amenity=cinema',
  theater: 'amenity=theatre',
  theatre: 'amenity=theatre',
  dentist: 'amenity=dentist',
  doctor: 'amenity=doctors',
};

// Filler words to strip when extracting the location part
const FILLER_WORDS = ['near', 'in', 'at', 'around', 'nearby', 'close to', 'next to', 'by', 'find', 'search', 'show', 'get', 'list', 'best', 'top', 'good', 'popular', 'famous'];

/**
 * Try to match a category keyword in the query.
 * Returns { tag, location } if matched, null otherwise.
 */
function extractCategory(query: string): { tag: string; location: string } | null {
  const lower = query.toLowerCase().trim();

  // Sort keys by length descending so longer phrases match first (e.g. "coffee shop" before "coffee")
  const sortedKeys = Object.keys(CATEGORY_TAGS).sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeys) {
    if (lower.includes(keyword)) {
      // Remove the keyword and filler words to get the location part
      let location = lower.replace(keyword, '').trim();
      for (const filler of FILLER_WORDS) {
        location = location.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '').trim();
      }
      // Clean up extra spaces
      location = location.replace(/\s+/g, ' ').trim();

      if (location.length > 0) {
        return { tag: CATEGORY_TAGS[keyword], location };
      }
    }
  }

  return null;
}

/**
 * Geocode an address to coordinates using Nominatim.
 * Returns a single best match.
 */
async function geocode(address: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const results = await geocodeMultiple(address, 1);
  return results[0] || null;
}

/**
 * Geocode an address and return multiple candidate locations.
 * Tries the full string, then progressively broader terms.
 * Returns up to `limit` results per candidate query.
 */
async function geocodeMultiple(
  address: string,
  limitPerQuery: number = 5
): Promise<Array<{ lat: number; lon: number; displayName: string }>> {
  const words = address.trim().split(/[\s,]+/).filter(Boolean);
  const queries = [address.trim()];
  // Also try comma-separated
  if (words.length >= 2) {
    queries.push(words.join(', '));
  }
  // Drop leading words progressively
  for (let i = 1; i < words.length; i++) {
    queries.push(words.slice(i).join(' '));
  }

  const seen = new Set<string>();
  const results: Array<{ lat: number; lon: number; displayName: string }> = [];

  for (const q of queries) {
    const params = new URLSearchParams({
      q: q,
      format: 'json',
      limit: String(limitPerQuery),
    });

    const response = await fetch(`${NOMINATIM_API}/search?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await response.json();
    for (const item of data) {
      const key = `${parseFloat(item.lat).toFixed(2)},${parseFloat(item.lon).toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          displayName: item.display_name || address,
        });
      }
    }

    // Stop once we have enough candidates
    if (results.length >= 6) break;
  }

  return results;
}

/**
 * Search for POIs using the Overpass API.
 */
async function searchOverpass(
  tag: string,
  lat: number,
  lon: number,
  radiusMeters: number = 5000,
  limit: number = 10
): Promise<PlaceResult[]> {
  const [key, value] = tag.split('=');
  const filter = value === '*' ? `["${key}"]` : `["${key}"="${value}"]`;

  const query = `[out:json][timeout:10];(node${filter}(around:${radiusMeters},${lat},${lon});way${filter}(around:${radiusMeters},${lat},${lon}););out center body qt ${limit};`;

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) return [];

  const data = await response.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.elements || []).map((el: any) => {
    const tags = el.tags || {};
    const elLat = el.lat ?? el.center?.lat;
    const elLon = el.lon ?? el.center?.lon;

    return {
      placeId: String(el.id),
      name: tags['name:en'] || tags.name || tags.brand || 'Unnamed',
      address: [tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || '',
      type: tags.amenity || tags.tourism || tags.shop || tags.leisure || undefined,
      location: elLat && elLon ? { latitude: elLat, longitude: elLon } : undefined,
    };
  });
}

/**
 * Search for places. Uses Overpass for category queries, Nominatim for specific place names.
 */
export async function searchPlaces(
  query: string,
  maxResults: number = 5
): Promise<{ success: boolean; places?: PlaceResult[]; error?: string }> {
  try {
    // Step 1: Check if query matches a category (e.g., "restaurants near Jamsikhel")
    const category = extractCategory(query);

    if (category) {
      // Get multiple geocode candidates and try Overpass with each.
      // Pick the candidate with the most results (most relevant location).
      const candidates = await geocodeMultiple(category.location, 5);

      let bestPlaces: PlaceResult[] = [];

      // Query all candidates in parallel for speed
      const overpassResults = await Promise.all(
        candidates.map(async (coords) => {

          return searchOverpass(category.tag, coords.lat, coords.lon, 5000, maxResults);
        })
      );

      for (const places of overpassResults) {
        if (places.length > bestPlaces.length) {
          bestPlaces = places;
        }
      }

      if (bestPlaces.length > 0) {

        return { success: true, places: bestPlaces };
      }

      if (candidates.length === 0) {
        return { success: false, error: `Could not find location: ${category.location}` };
      }
      // All candidates returned 0 Overpass results, fall through to Nominatim
    }

    // Step 2: Fall back to Nominatim for specific place name searches
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      extratags: '1',
      limit: String(maxResults),
    });

    const response = await fetch(`${NOMINATIM_API}/search?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return { success: false, error: `Search error: ${response.status}` };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await response.json();

    const places: PlaceResult[] = data.map((r) => ({
      placeId: String(r.place_id),
      name: r.name || r.display_name?.split(',')[0] || '',
      address: r.display_name || '',
      type: r.type || r.class || undefined,
      location: r.lat && r.lon
        ? { latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) }
        : undefined,
    }));

    return { success: true, places };
  } catch (err) {
    console.error('Place search error:', err);
    return { success: false, error: 'Failed to search places' };
  }
}

/**
 * Get directions between two locations using Nominatim geocoding + OSRM routing.
 */
export async function getDirections(
  origin: string,
  destination: string,
  travelMode: string = 'driving'
): Promise<{ success: boolean; directions?: DirectionsResult; error?: string }> {
  try {
    const [originCoords, destCoords] = await Promise.all([
      geocode(origin),
      geocode(destination),
    ]);

    if (!originCoords) {
      return { success: false, error: `Could not find location: ${origin}` };
    }
    if (!destCoords) {
      return { success: false, error: `Could not find location: ${destination}` };
    }

    const profileMap: Record<string, string> = {
      driving: 'driving',
      drive: 'driving',
      walking: 'foot',
      walk: 'foot',
      cycling: 'bike',
      bicycle: 'bike',
      bike: 'bike',
    };
    const profile = profileMap[travelMode.toLowerCase()] || 'driving';

    const url = `${OSRM_API}/route/v1/${profile}/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=full&steps=true&geometries=geojson`;

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return { success: false, error: `Routing error: ${response.status}` };
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      return { success: false, error: 'No route found between those locations' };
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    const formatDistance = (meters: number): string => {
      if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
      return `${Math.round(meters)} m`;
    };

    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      if (hours > 0) return `${hours} hr ${minutes} min`;
      return `${minutes} min`;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const steps = (leg.steps || []).filter((s: any) => s.maneuver?.type !== 'arrive' || s.distance > 0).map((s: any) => ({
      instruction: s.name ? `${s.maneuver?.modifier || ''} on ${s.name}`.trim() : s.maneuver?.type || 'Continue',
      distance: formatDistance(s.distance),
      duration: formatDuration(s.duration),
    }));

    return {
      success: true,
      directions: {
        distance: formatDistance(route.distance),
        duration: formatDuration(route.duration),
        startAddress: originCoords.displayName,
        endAddress: destCoords.displayName,
        steps,
      },
    };
  } catch (err) {
    console.error('Directions error:', err);
    return { success: false, error: 'Failed to get directions' };
  }
}

/**
 * Get details about a place by its OSM node/way ID (from Overpass) or Nominatim place_id.
 */
export async function getPlaceDetails(
  placeId: string
): Promise<{ success: boolean; place?: PlaceDetails; error?: string }> {
  try {
    // Try Nominatim details first
    const params = new URLSearchParams({
      place_id: placeId,
      format: 'json',
      addressdetails: '1',
      extratags: '1',
    });

    const response = await fetch(`${NOMINATIM_API}/details?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      // If Nominatim doesn't recognize the ID, try looking it up as an OSM node
      return await getPlaceDetailsFromOsm(placeId);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();

    const extratags = data.extratags || {};

    const addrParts: string[] = [];
    if (data.localname) addrParts.push(data.localname);
    if (data.address) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.address.forEach((a: any) => {
        if (a.localname && !addrParts.includes(a.localname)) {
          addrParts.push(a.localname);
        }
      });
    }

    const hours: string[] = [];
    if (extratags.opening_hours) {
      hours.push(extratags.opening_hours);
    }

    return {
      success: true,
      place: {
        placeId: String(data.place_id || placeId),
        name: data.localname || data.names?.name || '',
        address: addrParts.join(', ') || data.localname || '',
        type: data.type || data.category || undefined,
        location: data.centroid?.coordinates
          ? { latitude: data.centroid.coordinates[1], longitude: data.centroid.coordinates[0] }
          : undefined,
        website: extratags.website || extratags.url || undefined,
        phone: extratags.phone || extratags['contact:phone'] || undefined,
        hours: hours.length > 0 ? hours : undefined,
      },
    };
  } catch (err) {
    console.error('Place details error:', err);
    return { success: false, error: 'Failed to get place details' };
  }
}

/**
 * Look up an OSM element by node ID via Overpass (for Overpass-sourced placeIds).
 */
async function getPlaceDetailsFromOsm(
  osmId: string
): Promise<{ success: boolean; place?: PlaceDetails; error?: string }> {
  const query = `[out:json][timeout:10];node(${osmId});out body;`;
  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    return { success: false, error: `Lookup error: ${response.status}` };
  }

  const data = await response.json();
  const el = data.elements?.[0];
  if (!el) {
    return { success: false, error: 'Place not found' };
  }

  const tags = el.tags || {};
  return {
    success: true,
    place: {
      placeId: String(el.id),
      name: tags['name:en'] || tags.name || 'Unknown',
      address: [tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || '',
      type: tags.amenity || tags.tourism || tags.shop || tags.leisure || undefined,
      location: el.lat && el.lon ? { latitude: el.lat, longitude: el.lon } : undefined,
      website: tags.website || tags.url || undefined,
      phone: tags.phone || tags['contact:phone'] || undefined,
      hours: tags.opening_hours ? [tags.opening_hours] : undefined,
    },
  };
}
