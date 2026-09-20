import "dotenv/config";

// =====================================
// ENVIRONMENT VARIABLES
// =====================================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

const PHOTON_API_URL = "https://photon.komoot.io/api/";

const WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");

const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "";

// =====================================
// GENERAL HELPERS
// =====================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const addDays = (dateString, numberOfDays) => {
  const date = new Date(`${dateString}T12:00:00`);

  date.setDate(date.getDate() + numberOfDays);

  return date.toISOString().slice(0, 10);
};

export const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== "string") {
    return null;
  }

  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);

  const minutes = Number(match[2]);

  const modifier = match[3].toUpperCase();

  if (modifier === "PM" && hours !== 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const durationToMinutes = (duration) => {
  if (!duration || typeof duration !== "string") {
    return null;
  }

  const match = duration.match(/^([\d.]+)s$/);

  if (!match) {
    return null;
  }

  return Math.round(Number(match[1]) / 60);
};

// =====================================
// GOOGLE PLACES SEARCH
// =====================================

export const googlePlacesSearch = async (query) => {
  if (!GOOGLE_MAPS_API_KEY || !query) {
    return null;
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,

          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.regularOpeningHours",
            "places.googleMapsUri",
            "places.rating",
            "places.websiteUri",
            "places.photos",
          ].join(","),
        },

        body: JSON.stringify({
          textQuery: query,
          pageSize: 1,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Google Places error:", response.status, errorText);

      return null;
    }

    const data = await response.json();

    return data.places?.[0] || null;
  } catch (error) {
    console.error("Google Places failed:", error);

    return null;
  }
};

// =====================================
// AUTOCOMPLETE
// Google first, Photon fallback
// =====================================

const photonAutocompleteSuggestions = async ({
  input,
  mode = "destination",
  destination = "",
}) => {
  const cleanInput = String(input || "").trim();
  const cleanDestination = String(destination || "").trim();

  if (!cleanInput) {
    return [];
  }

  const query =
    (mode === "area" || mode === "mustVisit") && cleanDestination
      ? `${cleanInput}, ${cleanDestination}`
      : cleanInput;

  const params = new URLSearchParams({
    q: query,
    limit: "8",
    lang: "en",
  });

  try {
    const response = await fetch(`${PHOTON_API_URL}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`PHOTON_${response.status}: ${errorText}`);
    }

    const data = await response.json();

    const features = Array.isArray(data?.features) ? data.features : [];

    const regionTypes = new Set([
      "city",
      "town",
      "village",
      "suburb",
      "district",
      "county",
      "state",
      "locality",
      "neighbourhood",
      "neighborhood",
      "quarter",
      "borough",
    ]);

    const mapped = features
      .map((feature) => {
        const properties = feature?.properties || {};

        const parts = [
          properties.name,
          properties.street,
          properties.city,
          properties.district,
          properties.state,
          properties.country,
        ].filter(Boolean);

        const uniqueParts = [...new Set(parts)];

        const text = uniqueParts.join(", ");

        const mainText =
          properties.name ||
          properties.city ||
          properties.district ||
          properties.state ||
          text;

        const secondaryText = uniqueParts
          .filter((part) => part !== mainText)
          .join(", ");

        const photonType = properties.osm_value || properties.type || "";

        return {
          placeId: `photon-${
            properties.osm_type || properties.type || "place"
          }-${
            properties.osm_id ||
            feature?.geometry?.coordinates?.join("-") ||
            text
          }`,

          text,

          mainText,

          secondaryText,

          provider: "photon",

          photonType,
        };
      })
      .filter((item) => item.text);

    if (mode === "area") {
      const regional = mapped.filter((item) =>
        regionTypes.has(String(item.photonType || "").toLowerCase()),
      );

      return (regional.length > 0 ? regional : mapped).slice(0, 7);
    }

    return mapped.slice(0, 7);
  } catch (error) {
    console.error("Photon autocomplete failed:", error);

    return [];
  }
};

export const googleAutocompleteSuggestions = async ({
  input,
  mode = "destination",
  destination = "",
}) => {
  const cleanInput = String(input || "").trim();

  const cleanDestination = String(destination || "").trim();

  if (!cleanInput) {
    return [];
  }

  // =====================================
  // NO GOOGLE KEY
  // Use Photon directly
  // =====================================

  if (!GOOGLE_MAPS_API_KEY) {
    return photonAutocompleteSuggestions({
      input: cleanInput,
      mode,
      destination: cleanDestination,
    });
  }

  const isArea = mode === "area";

  const shouldAppendDestination =
    (mode === "area" || mode === "mustVisit") && cleanDestination;

  const requestBody = {
    input: shouldAppendDestination
      ? `${cleanInput}, ${cleanDestination}`
      : cleanInput,

    languageCode: "en",
  };

  if (isArea) {
    requestBody.includedPrimaryTypes = ["(regions)"];
  }

  // =====================================
  // TRY GOOGLE FIRST
  // =====================================

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,

          "X-Goog-FieldMask": [
            "suggestions.placePrediction.placeId",
            "suggestions.placePrediction.text.text",
            "suggestions.placePrediction.structuredFormat.mainText.text",
            "suggestions.placePrediction.structuredFormat.secondaryText.text",
          ].join(","),
        },

        body: JSON.stringify(requestBody),
      },
    );

    if (response.ok) {
      const data = await response.json();

      const googleSuggestions = (data.suggestions || [])
        .map((suggestion) => {
          const prediction = suggestion.placePrediction;

          if (!prediction) {
            return null;
          }

          return {
            placeId: prediction.placeId || "",

            text: prediction.text?.text || "",

            mainText:
              prediction.structuredFormat?.mainText?.text ||
              prediction.text?.text ||
              "",

            secondaryText:
              prediction.structuredFormat?.secondaryText?.text || "",

            provider: "google",
          };
        })
        .filter(Boolean)
        .slice(0, 7);

      if (googleSuggestions.length > 0) {
        return googleSuggestions;
      }
    } else {
      const errorText = await response.text();

      console.error("Google autocomplete error:", response.status, errorText);
    }
  } catch (error) {
    console.error("Google autocomplete failed:", error);
  }

  // =====================================
  // GOOGLE FAILED
  // Automatically use Photon
  // =====================================

  console.log("TravelPilot: switching autocomplete to Photon fallback.");

  return photonAutocompleteSuggestions({
    input: cleanInput,
    mode,
    destination: cleanDestination,
  });
};

// =====================================
// GOOGLE PLACE PHOTO
// =====================================

export const getGooglePlacePhoto = async (
  placeId,
  { maxWidthPx = 1200, maxHeightPx = 900 } = {},
) => {
  const cleanPlaceId = String(placeId || "").trim();

  if (!GOOGLE_MAPS_API_KEY || !cleanPlaceId) {
    return null;
  }

  try {
    // Get fresh place details
    const detailsResponse = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(
        cleanPlaceId,
      )}`,
      {
        method: "GET",

        headers: {
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,

          "X-Goog-FieldMask": "id,displayName,photos",
        },
      },
    );

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();

      console.error(
        "Google Place Details photo lookup error:",
        detailsResponse.status,
        errorText,
      );

      return null;
    }

    const place = await detailsResponse.json();

    const photo = place?.photos?.[0];

    if (!photo?.name) {
      return null;
    }

    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,

      maxWidthPx: String(maxWidthPx),

      maxHeightPx: String(maxHeightPx),

      skipHttpRedirect: "true",
    });

    const photoResponse = await fetch(
      `https://places.googleapis.com/v1/${photo.name}/media?${params.toString()}`,
    );

    if (!photoResponse.ok) {
      const errorText = await photoResponse.text();

      console.error(
        "Google Place Photo error:",
        photoResponse.status,
        errorText,
      );

      return null;
    }

    const photoData = await photoResponse.json();

    if (!photoData?.photoUri) {
      return null;
    }

    const attribution = photo?.authorAttributions?.[0];

    return {
      photoUrl: photoData.photoUri,

      photoAttribution: attribution?.displayName
        ? `Photo by ${attribution.displayName}`
        : "",

      photoAttributionUrl: attribution?.uri || "",

      placeName: place?.displayName?.text || "",
    };
  } catch (error) {
    console.error("Google Place Photo lookup failed:", error);

    return null;
  }
};
// =====================================
// WIKIMEDIA PHOTO FALLBACK
// =====================================

const cleanAttributionHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const getWikimediaPlacePhoto = async (
  query,
  { maxWidthPx = 1200 } = {},
) => {
  const cleanQuery = String(query || "").trim();

  if (!cleanQuery) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      action: "query",

      generator: "search",

      gsrsearch: cleanQuery,

      gsrnamespace: "6",

      gsrlimit: "8",

      prop: "imageinfo",

      iiprop: "url|extmetadata",

      iiurlwidth: String(maxWidthPx),

      format: "json",

      origin: "*",
    });

    const response = await fetch(`${WIKIMEDIA_API_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "TravelPilot/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Wikimedia image search error:",
        response.status,
        errorText,
      );

      return null;
    }

    const data = await response.json();

    const pages = Object.values(data?.query?.pages || {});

    const blockedWords = [
      "logo",
      "icon",
      "diagram",
      "map",
      "flag",
      "signature",
      "portrait",
      "poster",
      "coat of arms",
    ];

    const usablePage =
      pages.find((page) => {
        const title = String(page?.title || "").toLowerCase();

        const info = page?.imageinfo?.[0];

        const url = info?.thumburl || info?.url || "";

        if (!url) {
          return false;
        }

        return !blockedWords.some((word) => title.includes(word));
      }) ||
      pages.find(
        (page) => page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url,
      );

    const info = usablePage?.imageinfo?.[0];

    if (!info) {
      return null;
    }

    const metadata = info.extmetadata || {};

    const artist = cleanAttributionHtml(metadata.Artist?.value);

    return {
      photoUrl: info.thumburl || info.url || "",

      photoAttribution: artist ? `Photo: ${artist}` : "Wikimedia Commons",

      photoAttributionUrl: info.descriptionurl || "",

      placeName: cleanAttributionHtml(metadata.ObjectName?.value),

      provider: "wikimedia",
    };
  } catch (error) {
    console.error("Wikimedia photo lookup failed:", error);

    return null;
  }
};

// =====================================
// BEST AVAILABLE PLACE PHOTO
// Google first → Wikimedia fallback
// =====================================

export const getBestPlacePhoto = async (
  { placeId = "", query = "" } = {},

  { maxWidthPx = 1200, maxHeightPx = 900 } = {},
) => {
  const cleanPlaceId = String(placeId || "").trim();

  const cleanQuery = String(query || "").trim();

  // Photon IDs cannot be sent to Google.
  const isGooglePlaceId = cleanPlaceId && !cleanPlaceId.startsWith("photon-");

  // =====================================
  // TRY GOOGLE IMAGE FIRST
  // =====================================

  if (isGooglePlaceId && GOOGLE_MAPS_API_KEY) {
    try {
      const googlePhoto = await getGooglePlacePhoto(cleanPlaceId, {
        maxWidthPx,
        maxHeightPx,
      });

      if (googlePhoto?.photoUrl) {
        return {
          ...googlePhoto,
          provider: "google",
        };
      }
    } catch (error) {
      console.error("Google photo fallback error:", error);
    }
  }

  // =====================================
  // GOOGLE HAS NO PHOTO / FAILED
  // TRY WIKIMEDIA
  // =====================================

  if (cleanQuery) {
    const wikimediaPhoto = await getWikimediaPlacePhoto(cleanQuery, {
      maxWidthPx,
    });

    if (wikimediaPhoto?.photoUrl) {
      return wikimediaPhoto;
    }
  }

  return null;
};
// =====================================
// OPENING HOURS
// =====================================

export const getOpeningStatus = (place, dateString, timeString) => {
  const periods = place?.regularOpeningHours?.periods;

  const scheduledMinutes = parseTimeToMinutes(timeString);

  if (!Array.isArray(periods) || scheduledMinutes === null || !dateString) {
    return {
      status: "unknown",
      label: "Opening hours unavailable",
    };
  }

  const tripDate = new Date(`${dateString}T12:00:00`);

  const day = tripDate.getDay();

  const matchingPeriods = periods.filter((period) => period?.open?.day === day);

  if (matchingPeriods.length === 0) {
    return {
      status: "closed",
      label: "Appears closed on this day",
    };
  }

  const isOpen = matchingPeriods.some((period) => {
    const open = period.open;

    const close = period.close;

    const openMinutes =
      Number(open?.hour || 0) * 60 + Number(open?.minute || 0);

    if (!close) {
      return scheduledMinutes >= openMinutes;
    }

    const closeMinutes =
      Number(close?.hour || 0) * 60 + Number(close?.minute || 0);

    if (close.day === day) {
      return scheduledMinutes >= openMinutes && scheduledMinutes < closeMinutes;
    }

    return scheduledMinutes >= openMinutes;
  });

  return isOpen
    ? {
        status: "open",
        label: "Open at scheduled time",
      }
    : {
        status: "closed",
        label: "May be closed at scheduled time",
      };
};

// =====================================
// GOOGLE ROUTES
// =====================================

export const getRouteMetrics = async (origin, destination) => {
  if (!GOOGLE_MAPS_API_KEY || !origin || !destination) {
    return null;
  }

  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,

          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
        },

        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: origin.latitude,

                longitude: origin.longitude,
              },
            },
          },

          destination: {
            location: {
              latLng: {
                latitude: destination.latitude,

                longitude: destination.longitude,
              },
            },
          },

          travelMode: "DRIVE",

          routingPreference: "TRAFFIC_AWARE",

          computeAlternativeRoutes: false,

          units: "METRIC",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Google Routes error:", response.status, errorText);

      return null;
    }

    const data = await response.json();

    const route = data.routes?.[0];

    if (!route) {
      return null;
    }

    return {
      travelMinutes: durationToMinutes(route.duration),

      distanceMeters: route.distanceMeters ?? null,
    };
  } catch (error) {
    console.error("Google Routes failed:", error);

    return null;
  }
};

// =====================================
// ENRICH ITINERARY
// =====================================

export const enrichItinerary = async (days, { destination, startDate }) => {
  if (!Array.isArray(days)) {
    return days;
  }

  const updatedDays = [];

  let requestCount = 0;

  const MAX_PLACE_REQUESTS = 18;

  for (const day of days) {
    const tripDate = startDate
      ? addDays(startDate, Number(day.day || 1) - 1)
      : null;

    const activities = [];

    let previousCoordinates = null;

    for (const activity of day.activities || []) {
      let updatedActivity = {
        ...activity,

        realPlaceVerified: false,

        placeId: activity?.placeId || null,

        hasPlacePhoto: false,

        openingHoursStatus: "unknown",

        openingHoursLabel: "Not verified",
      };

      if (GOOGLE_MAPS_API_KEY && requestCount < MAX_PLACE_REQUESTS) {
        const query = [activity.name, activity.location, destination]
          .filter(Boolean)
          .join(", ");

        const place = await googlePlacesSearch(query);

        requestCount += 1;

        if (place) {
          const openingStatus = getOpeningStatus(
            place,
            tripDate,
            activity.time,
          );

          updatedActivity = {
            ...updatedActivity,

            name: place.displayName?.text || activity.name,

            realPlaceVerified: true,

            placeId: place.id || null,

            hasPlacePhoto: Boolean(place.photos?.length),

            formattedAddress: place.formattedAddress || activity.location,

            coordinates: place.location || null,

            mapUrl: place.googleMapsUri || null,

            websiteUrl: place.websiteUri || null,

            rating: place.rating ?? null,

            openingHoursStatus: openingStatus.status,

            openingHoursLabel: openingStatus.label,

            openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
          };

          if (previousCoordinates && updatedActivity.coordinates) {
            const route = await getRouteMetrics(
              previousCoordinates,
              updatedActivity.coordinates,
            );

            if (
              route?.travelMinutes !== null &&
              route?.travelMinutes !== undefined
            ) {
              updatedActivity.travelMinutesFromPrevious = route.travelMinutes;

              updatedActivity.travelDistanceMeters = route.distanceMeters;

              updatedActivity.travelTimeSource = "Google Routes";
            }
          }
        }
      }

      if (activities.length === 0) {
        updatedActivity.travelMinutesFromPrevious = 0;
      }

      if (updatedActivity.coordinates) {
        previousCoordinates = updatedActivity.coordinates;
      }

      activities.push(updatedActivity);

      if (GOOGLE_MAPS_API_KEY) {
        await sleep(40);
      }
    }

    updatedDays.push({
      ...day,

      date: tripDate,

      activities,
    });
  }

  return updatedDays;
};

// =====================================
// WEATHER
// =====================================

const weatherCodeLabel = (code) => {
  const labels = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",

    45: "Fog",
    48: "Fog",

    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",

    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",

    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",

    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy rain showers",

    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Severe thunderstorm",
  };

  return labels[code] || "Weather unavailable";
};

export const getWeatherForecast = async (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      latitude: String(latitude),

      longitude: String(longitude),

      daily: [
        "weather_code",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "temperature_2m_max",
        "temperature_2m_min",
      ].join(","),

      forecast_days: "16",

      timezone: "auto",
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    );

    if (!response.ok) {
      console.error("Open-Meteo error:", response.status);

      return null;
    }

    const data = await response.json();

    const weatherByDate = {};

    (data.daily?.time || []).forEach((date, index) => {
      const code = data.daily.weather_code?.[index] ?? null;

      const rain = data.daily.precipitation_probability_max?.[index] ?? null;

      const wind = data.daily.wind_speed_10m_max?.[index] ?? null;

      let risk = "low";

      if (Number(code) >= 95 || Number(rain) >= 70 || Number(wind) >= 45) {
        risk = "high";
      } else if (
        Number(code) >= 51 ||
        Number(rain) >= 40 ||
        Number(wind) >= 30
      ) {
        risk = "medium";
      }

      weatherByDate[date] = {
        date,

        code,

        summary: weatherCodeLabel(code),

        precipitationProbability: rain,

        windSpeedKmh: wind,

        maxTempC: data.daily.temperature_2m_max?.[index] ?? null,

        minTempC: data.daily.temperature_2m_min?.[index] ?? null,

        risk,
      };
    });

    return weatherByDate;
  } catch (error) {
    console.error("Weather API failed:", error);

    return null;
  }
};

export const attachWeatherToDays = (days, weatherByDate) => {
  if (!weatherByDate) {
    return days;
  }

  return days.map((day) => {
    const weather = day.date ? weatherByDate[day.date] : null;

    return {
      ...day,

      weather: weather || {
        unavailable: true,

        summary: "Forecast unavailable for this date",

        risk: "unknown",
      },
    };
  });
};

export const isOutdoorActivity = (activity) => {
  const haystack = `
      ${activity?.name || ""}
      ${activity?.category || ""}
    `.toLowerCase();

  const outdoorWords = [
    "adventure",
    "nature",
    "park",
    "beach",
    "walk",
    "hike",
    "cycling",
    "outdoor",
    "garden",
    "boat",
    "cruise",
    "trek",
    "rafting",
    "waterfall",
    "viewpoint",
    "lake",
    "river",
  ];

  return outdoorWords.some((word) => haystack.includes(word));
};

export const flagWeatherDisruptions = (days) =>
  days.map((day) => ({
    ...day,

    activities: (day.activities || []).map((activity) => ({
      ...activity,

      weatherDisruption:
        day.weather?.risk === "high" && isOutdoorActivity(activity),
    })),
  }));

// =====================================
// WEATHER ALTERNATIVES
// =====================================

export const adaptTripForWeather = async (days, destination) => {
  const updatedDays = [];

  for (const day of days) {
    if (day.weather?.risk !== "high") {
      updatedDays.push(day);

      continue;
    }

    const newActivities = [];

    for (const activity of day.activities || []) {
      if (!isOutdoorActivity(activity)) {
        newActivities.push(activity);

        continue;
      }

      let replacement = null;

      if (GOOGLE_MAPS_API_KEY) {
        replacement = await googlePlacesSearch(
          `indoor attraction or museum near ${
            activity.location || destination
          }, ${destination}`,
        );
      }

      newActivities.push({
        ...activity,

        name:
          replacement?.displayName?.text ||
          `Indoor alternative near ${activity.location || destination}`,

        placeId: replacement?.id || null,

        hasPlacePhoto: Boolean(replacement?.photos?.length),

        formattedAddress:
          replacement?.formattedAddress || activity.formattedAddress,

        coordinates: replacement?.location || activity.coordinates,

        mapUrl: replacement?.googleMapsUri || activity.mapUrl,

        websiteUrl: replacement?.websiteUri || activity.websiteUrl || null,

        rating: replacement?.rating ?? activity.rating,

        realPlaceVerified: Boolean(replacement),

        category: "Culture",

        weatherDisruption: false,

        weatherAdjusted: true,

        weatherAdjustmentReason: `${day.weather.summary} created high weather risk for the original outdoor activity.`,
      });
    }

    updatedDays.push({
      ...day,
      activities: newActivities,
    });
  }

  return updatedDays;
};

// =====================================
// SUPABASE
// =====================================

export const supabaseConfigured = () =>
  Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);

const supabaseRequest = async (path, options = {}) => {
  if (!supabaseConfigured()) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,

    headers: {
      apikey: SUPABASE_SECRET_KEY,

      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,

      "Content-Type": "application/json",

      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`SUPABASE_${response.status}: ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  return text ? JSON.parse(text) : null;
};

// =====================================
// TRANSPORT / ACCOMMODATION
// =====================================

export const buildTransportation = (body) => ({
  type: body.transportType || "",

  details: body.transportDetails || "",

  status: body.transportStatus || "Planned",
});

export const buildAccommodation = (body) => ({
  name: body.hotel || "",

  bookingRef: body.accommodationBookingRef || "",

  status: body.accommodationStatus || "Planned",

  checkIn: body.startDate || "",

  checkOut: body.endDate || "",
});

// =====================================
// SAVE TRIP
// =====================================

export const saveTripToSupabase = async ({
  body,
  days,
  fallback,
  realWorldStatus,
}) => {
  if (!supabaseConfigured()) {
    return null;
  }

  try {
    const result = await supabaseRequest("trips", {
      method: "POST",

      headers: {
        Prefer: "return=representation",
      },

      body: JSON.stringify([
        {
          destination: body.destination,

          start_date: body.startDate,

          end_date: body.endDate,

          budget: Number(body.budget || 0),

          hotel: body.hotel || "",

          interests: body.interests || [],

          travel_pace: body.travelPace || "Balanced",

          must_visit: body.mustVisit || "",

          transportation: buildTransportation(body),

          accommodation: buildAccommodation(body),

          itinerary: days,

          fallback: Boolean(fallback),

          real_world_status: realWorldStatus,
        },
      ]),
    });

    return result?.[0] || null;
  } catch (error) {
    console.error("Supabase save error:", error);

    return null;
  }
};

// =====================================
// TRIP HISTORY
// =====================================

export const getTripHistory = async () => {
  if (!supabaseConfigured()) {
    return [];
  }

  const result = await supabaseRequest(
    "trips?select=*&order=created_at.desc&limit=20",
    {
      method: "GET",
    },
  );

  return result || [];
};

// =====================================
// UPDATE LOGISTICS
// =====================================

export const updateTripLogistics = async (id, data) => {
  if (!supabaseConfigured()) {
    return null;
  }

  const result = await supabaseRequest(
    `trips?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",

      headers: {
        Prefer: "return=representation",
      },

      body: JSON.stringify(data),
    },
  );

  return result?.[0] || null;
};

// =====================================
// STATUS
// =====================================

export const getIntegrationStatus = () => ({
  places: GOOGLE_MAPS_API_KEY ? "enabled" : "fallback",

  routes: GOOGLE_MAPS_API_KEY ? "enabled" : "not_configured",

  // Google + Wikimedia fallback
  photos: "enabled",

  // Google + Photon fallback
  autocomplete: "enabled",

  weather: "enabled",

  database: supabaseConfigured() ? "enabled" : "not_configured",
});
