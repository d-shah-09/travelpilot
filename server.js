import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { GoogleGenAI } from "@google/genai";

dotenv.config();

import {
  googlePlacesSearch,
  enrichItinerary,
  getWeatherForecast,
  attachWeatherToDays,
  flagWeatherDisruptions,
  adaptTripForWeather,
  saveTripToSupabase,
  getTripHistory,
  updateTripLogistics,
  supabaseConfigured,
  buildTransportation,
  buildAccommodation,
  getIntegrationStatus,
} from "./integrations.js";

// =====================================
// ENVIRONMENT CHECK
// =====================================

if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing.");

  process.exit(1);
}

// =====================================
// EXPRESS
// =====================================

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "2mb",
  }),
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================
// HELPERS
// =====================================

const isRateLimitError = (error) =>
  error?.status === 429 ||
  error?.code === 429 ||
  error?.message?.includes("RESOURCE_EXHAUSTED") ||
  error?.message?.includes("429");

const sendError = (res, status, code, message) =>
  res.status(status).json({
    success: false,
    error: code,
    message,
  });

const validateRequiredFields = (body, fields) =>
  fields.filter((field) => {
    const value = body[field];

    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  });

const parseGeminiJson = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("INVALID_GEMINI_JSON");
  }

  const cleanText = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch {
    console.error(cleanText);

    throw new Error("INVALID_GEMINI_JSON");
  }
};

const handleGeminiError = (error, res) => {
  console.error("Gemini/API error:", error);

  if (isRateLimitError(error)) {
    return sendError(
      res,
      429,
      "AI_RATE_LIMIT",
      "TravelPilot AI quota is temporarily unavailable.",
    );
  }

  if (error?.message === "INVALID_GEMINI_JSON") {
    return sendError(
      res,
      502,
      "INVALID_AI_RESPONSE",
      "TravelPilot received an invalid AI response.",
    );
  }

  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "Something went wrong while processing your request.",
  );
};

// =====================================
// FALLBACK TRIP
// =====================================

const createFallbackTrip = ({
  destination,
  startDate,
  endDate,
  budget,
  hotel,
  interests = [],
  travelPace = "Balanced",
  mustVisit = "",
}) => {
  const start = new Date(`${startDate}T12:00:00`);

  const end = new Date(`${endDate}T12:00:00`);

  const dayMs = 1000 * 60 * 60 * 24;

  let numberOfDays = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;

  if (!Number.isFinite(numberOfDays) || numberOfDays < 1) {
    numberOfDays = 1;
  }

  numberOfDays = Math.min(numberOfDays, 10);

  const totalBudget = Number(budget) || 10000;

  const dailyBudget = Math.max(
    500,

    Math.floor(totalBudget / numberOfDays),
  );

  const preferredCategory = interests[0] || "Sightseeing";

  const templates = [
    {
      time: "09:00 AM",

      name: `${destination} Local Highlights`,

      location: hotel || destination,

      costRatio: 0.12,

      category: preferredCategory,

      durationMinutes: 120,

      travelMinutesFromPrevious: 0,
    },

    {
      time: "12:00 PM",

      name: "Local Food Experience",

      location: destination,

      costRatio: 0.1,

      category: "Food",

      durationMinutes: 90,

      travelMinutesFromPrevious: 30,
    },

    {
      time: "03:00 PM",

      name: mustVisit || `${destination} Cultural Experience`,

      location: destination,

      costRatio: 0.12,

      category: "Culture",

      durationMinutes: 120,

      travelMinutesFromPrevious: 30,
    },

    {
      time: "06:30 PM",

      name: `${destination} Evening Experience`,

      location: destination,

      costRatio: 0.08,

      category: preferredCategory,

      durationMinutes: 120,

      travelMinutesFromPrevious: 30,
    },
  ];

  let activitiesPerDay = 3;

  if (travelPace === "Relaxed") {
    activitiesPerDay = 2;
  }

  if (travelPace === "Packed") {
    activitiesPerDay = 4;
  }

  const days = Array.from(
    {
      length: numberOfDays,
    },

    (_, dayIndex) => ({
      day: dayIndex + 1,

      title: `Explore ${destination} — Day ${dayIndex + 1}`,

      activities: templates
        .slice(0, activitiesPerDay)
        .map((activity, index) => ({
          time: activity.time,

          name:
            dayIndex === 0
              ? activity.name
              : `${activity.name} — Day ${dayIndex + 1}`,

          location: activity.location,

          cost: Math.round(dailyBudget * activity.costRatio),

          category: activity.category,

          durationMinutes: activity.durationMinutes,

          travelMinutesFromPrevious:
            index === 0 ? 0 : activity.travelMinutesFromPrevious,
        })),
    }),
  );

  return {
    days,

    fallback: true,

    fallbackReason: "Gemini quota is temporarily unavailable.",
  };
};

// =====================================
// HEALTH CHECK
// =====================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    message: "TravelPilot backend is running",

    integrations: getIntegrationStatus(),
  });
});

// =====================================
// GENERATE TRIP
// =====================================

app.post(
  "/api/generate-trip",

  async (req, res) => {
    const missingFields = validateRequiredFields(req.body, [
      "destination",
      "startDate",
      "endDate",
      "budget",
    ]);

    if (missingFields.length > 0) {
      return sendError(
        res,
        400,
        "MISSING_TRIP_DATA",

        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    let baseResult;

    try {
      const {
        destination,
        startDate,
        endDate,
        budget,
        hotel,
        interests,
        travelPace,
        mustVisit,
      } = req.body;

      const prompt = `
You are the itinerary planning engine for TravelPilot.

Destination:
${destination}

Start date:
${startDate}

End date:
${endDate}

Budget:
₹${budget}

Hotel / Area:
${hotel || "Not specified"}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace || "Balanced"}

Must visit:
${mustVisit || "None"}

Create a realistic itinerary.

Rules:

- Recommend real destination-specific places.
- Respect user interests.
- Keep within budget.
- Include realistic times.
- Group nearby activities.
- Include estimated INR cost.
- Include durationMinutes.
- Include travelMinutesFromPrevious.
- First activity each day must have travelMinutesFromPrevious = 0.
- Do not claim bookings exist.
- Return only valid JSON.
- No markdown.

Return:

{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "09:00 AM",
          "name": "Activity",
          "location": "Location",
          "cost": 500,
          "category": "Culture",
          "durationMinutes": 90,
          "travelMinutesFromPrevious": 0
        }
      ]
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,
      });

      const result = parseGeminiJson(response.text);

      if (!Array.isArray(result.days)) {
        throw new Error("INVALID_GEMINI_JSON");
      }

      baseResult = {
        days: result.days,

        fallback: false,

        message: "",
      };
    } catch (error) {
      console.error("Trip generation AI error:", error);

      if (!isRateLimitError(error)) {
        return handleGeminiError(error, res);
      }

      baseResult = {
        ...createFallbackTrip(req.body),

        message:
          "Gemini quota is temporarily unavailable, so TravelPilot switched to fallback mode.",
      };
    }

    // =================================
    // LIVE DATA ENRICHMENT
    // =================================

    try {
      let days = await enrichItinerary(baseResult.days, req.body);

      // Find coordinates for weather

      let locationActivity = days
        .flatMap((day) => day.activities || [])
        .find((activity) => activity.coordinates);

      if (!locationActivity) {
        const destinationPlace = await googlePlacesSearch(req.body.destination);

        if (destinationPlace?.location) {
          locationActivity = {
            coordinates: destinationPlace.location,
          };
        }
      }

      // Weather

      if (locationActivity?.coordinates) {
        const weather = await getWeatherForecast(
          locationActivity.coordinates.latitude,

          locationActivity.coordinates.longitude,
        );

        days = attachWeatherToDays(days, weather);

        days = flagWeatherDisruptions(days);
      } else {
        days = days.map((day) => ({
          ...day,

          weather: {
            unavailable: true,

            summary: "Weather unavailable",

            risk: "unknown",
          },
        }));
      }

      const realWorldStatus = getIntegrationStatus();

      // Save to Supabase

      const savedTrip = await saveTripToSupabase({
        body: req.body,

        days,

        fallback: baseResult.fallback,

        realWorldStatus,
      });

      return res.json({
        ...baseResult,

        days,

        tripId: savedTrip?.id || null,

        transportation: buildTransportation(req.body),

        accommodation: buildAccommodation(req.body),

        realWorldStatus,
      });
    } catch (error) {
      console.error("Live enrichment error:", error);

      return res.json({
        ...baseResult,

        transportation: buildTransportation(req.body),

        accommodation: buildAccommodation(req.body),

        realWorldStatus: getIntegrationStatus(),

        enrichmentWarning: "Some live travel-data services were unavailable.",
      });
    }
  },
);

// =====================================
// REPLACE ACTIVITY
// =====================================

app.post(
  "/api/replan",

  async (req, res) => {
    try {
      const {
        destination,
        interests,
        travelPace,
        budget,
        cancelledActivity,
        currentDayActivities,
      } = req.body;

      if (!destination || !cancelledActivity) {
        return sendError(
          res,
          400,
          "MISSING_REPLAN_DATA",
          "Destination and cancelled activity are required.",
        );
      }

      const prompt = `
You are TravelPilot's replanning agent.

Destination:
${destination}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace || "Balanced"}

Budget:
₹${budget || "Not specified"}

Cancelled:
${JSON.stringify(cancelledActivity, null, 2)}

Existing activities:
${JSON.stringify(currentDayActivities || [], null, 2)}

Find ONE realistic replacement.

Return only JSON:

{
  "replacement": {
    "time": "02:00 PM",
    "name": "Replacement",
    "location": "Location",
    "cost": 500,
    "category": "Culture",
    "durationMinutes": 90,
    "travelMinutesFromPrevious": 20,
    "reason": "Why it fits"
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,
      });

      const result = parseGeminiJson(response.text);

      let replacement = result.replacement;

      if (!replacement) {
        throw new Error("INVALID_GEMINI_JSON");
      }

      const place = await googlePlacesSearch(
        `${replacement.name}, ${replacement.location}, ${destination}`,
      );

      if (place) {
        replacement = {
          ...replacement,

          name: place.displayName?.text || replacement.name,

          formattedAddress: place.formattedAddress,

          coordinates: place.location,

          mapUrl: place.googleMapsUri,

          rating: place.rating ?? null,

          realPlaceVerified: true,
        };
      }

      return res.json({
        replacement,

        fallback: false,
      });
    } catch (error) {
      console.error("Replan error:", error);

      if (isRateLimitError(error)) {
        const { cancelledActivity, interests = [], destination } = req.body;

        let replacement = {
          time: cancelledActivity?.time || "02:00 PM",

          name: `Alternative ${
            cancelledActivity?.category || "Local"
          } Experience`,

          location: cancelledActivity?.location || destination,

          cost: Math.round(Number(cancelledActivity?.cost || 500) * 0.8),

          category:
            cancelledActivity?.category || interests[0] || "Sightseeing",

          durationMinutes: Number(cancelledActivity?.durationMinutes) || 90,

          travelMinutesFromPrevious:
            Number(cancelledActivity?.travelMinutesFromPrevious) || 20,

          reason:
            "Fallback replacement used because Gemini quota is unavailable.",
        };

        const place = await googlePlacesSearch(
          `${replacement.category} attraction near ${replacement.location}, ${destination}`,
        );

        if (place) {
          replacement = {
            ...replacement,

            name: place.displayName?.text || replacement.name,

            formattedAddress: place.formattedAddress,

            coordinates: place.location,

            mapUrl: place.googleMapsUri,

            rating: place.rating,

            realPlaceVerified: true,
          };
        }

        return res.json({
          replacement,

          fallback: true,
        });
      }

      return handleGeminiError(error, res);
    }
  },
);

// =====================================
// FIX CONFLICT
// =====================================

app.post(
  "/api/fix-conflict",

  async (req, res) => {
    try {
      const { destination, dayNumber, currentDayActivities } = req.body;

      const prompt = `
You are TravelPilot's schedule optimization agent.

Destination:
${destination}

Day:
${dayNumber}

Activities:

${JSON.stringify(currentDayActivities, null, 2)}

Remove schedule conflicts.

Respect:
- activity duration
- real travel time
- realistic opening times

Return JSON only:

{
  "updatedActivities": [],
  "reason": "Explanation"
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,
      });

      const result = parseGeminiJson(response.text);

      return res.json(result);
    } catch (error) {
      return handleGeminiError(error, res);
    }
  },
);

// =====================================
// WEATHER ADAPTATION
// =====================================

app.post(
  "/api/adapt-weather",

  async (req, res) => {
    try {
      const { destination, itinerary } = req.body;

      if (!destination || !Array.isArray(itinerary)) {
        return sendError(
          res,
          400,
          "INVALID_WEATHER_REQUEST",
          "Destination and itinerary are required.",
        );
      }

      const days = await adaptTripForWeather(itinerary, destination);

      return res.json({
        days,

        message:
          "TravelPilot replaced weather-sensitive activities with safer alternatives where possible.",
      });
    } catch (error) {
      console.error(error);

      return sendError(
        res,
        500,
        "WEATHER_ADAPTATION_FAILED",
        "Could not adapt the itinerary for weather.",
      );
    }
  },
);

// =====================================
// CHAT
// =====================================

app.post(
  "/api/chat",

  async (req, res) => {
    try {
      const {
        message,
        destination,
        hotel,
        budget,
        interests,
        travelPace,
        itinerary,
      } = req.body;

      const prompt = `
You are TravelPilot's trip assistant.

Destination:
${destination}

Hotel:
${hotel}

Budget:
₹${budget}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace}

Itinerary:

${JSON.stringify(itinerary, null, 2)}

Question:

${message}

Use:
- verified places
- opening hours
- actual travel time
- weather information
- budget

Be concise.

Do not use markdown.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,
      });

      return res.json({
        answer: response.text.trim(),
      });
    } catch (error) {
      if (isRateLimitError(error)) {
        return res.json({
          answer:
            "The AI assistant is temporarily unavailable because Gemini quota is exhausted. Your verified places, weather, travel times and saved trip remain available.",

          fallback: true,
        });
      }

      return handleGeminiError(error, res);
    }
  },
);

// =====================================
// BUDGET OPTIMIZATION
// =====================================

app.post(
  "/api/optimize-budget",

  async (req, res) => {
    try {
      const { destination, budget, itinerary, interests, travelPace } =
        req.body;

      const prompt = `
Optimize this itinerary to fit within ₹${budget}.

Destination:
${destination}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace}

Current itinerary:

${JSON.stringify(itinerary, null, 2)}

Preserve:
- verified real places
- travel time
- opening hour data
where possible.

Return JSON only:

{
  "days": [],
  "summary": {
    "changes": "Explanation"
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",

        contents: prompt,
      });

      const result = parseGeminiJson(response.text);

      return res.json(result);
    } catch (error) {
      if (isRateLimitError(error)) {
        const budget = Number(req.body.budget || 0);

        const itinerary = req.body.itinerary || [];

        const currentTotal = itinerary.reduce(
          (tripTotal, day) =>
            tripTotal +
            (day.activities || []).reduce(
              (dayTotal, activity) => dayTotal + Number(activity.cost || 0),

              0,
            ),

          0,
        );

        const ratio =
          currentTotal > 0 && budget > 0
            ? Math.min(1, budget / currentTotal)
            : 1;

        const days = itinerary.map((day) => ({
          ...day,

          activities: (day.activities || []).map((activity) => ({
            ...activity,

            cost: Math.round(Number(activity.cost || 0) * ratio),
          })),
        }));

        return res.json({
          days,

          fallback: true,

          summary: {
            changes:
              "TravelPilot adjusted the estimated activity costs while Gemini quota is unavailable.",
          },
        });
      }

      return handleGeminiError(error, res);
    }
  },
);

// =====================================
// TRIP HISTORY
// =====================================

app.get(
  "/api/trips",

  async (req, res) => {
    if (!supabaseConfigured()) {
      return res.json({
        trips: [],

        configured: false,

        message: "Supabase is not configured yet.",
      });
    }

    try {
      const trips = await getTripHistory();

      return res.json({
        trips,

        configured: true,
      });
    } catch (error) {
      console.error(error);

      return sendError(
        res,
        500,
        "TRIP_HISTORY_FAILED",
        "Could not load trip history.",
      );
    }
  },
);

// =====================================
// UPDATE TRANSPORT / ACCOMMODATION
// =====================================

app.patch(
  "/api/trips/:id/logistics",

  async (req, res) => {
    if (!supabaseConfigured()) {
      return sendError(
        res,
        503,
        "DATABASE_NOT_CONFIGURED",
        "Supabase is not configured.",
      );
    }

    try {
      const update = {};

      if (req.body.transportation) {
        update.transportation = req.body.transportation;
      }

      if (req.body.accommodation) {
        update.accommodation = req.body.accommodation;
      }

      const trip = await updateTripLogistics(req.params.id, update);

      return res.json({
        trip,
      });
    } catch (error) {
      console.error(error);

      return sendError(
        res,
        500,
        "LOGISTICS_UPDATE_FAILED",
        "Could not update trip logistics.",
      );
    }
  },
);

// =====================================
// INVALID JSON
// =====================================

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(
      res,
      400,
      "INVALID_JSON",
      "Request contains invalid JSON.",
    );
  }

  next(err);
});

// =====================================
// 404
// =====================================

app.use((req, res) =>
  sendError(res, 404, "ROUTE_NOT_FOUND", "TravelPilot API route not found."),
);

// =====================================
// FINAL ERROR
// =====================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "Unexpected TravelPilot server error.",
  );
});

// =====================================
// EXPORT
// =====================================

export default app;

// =====================================
// LOCAL DEVELOPMENT
// =====================================

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(`TravelPilot server running on port ${PORT}`);
  });
}
