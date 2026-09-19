import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// =====================================
// ENVIRONMENT CHECK
// =====================================

if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing from .env");
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================
// HELPERS
// =====================================

const sendError = (res, status, code, message) => {
  return res.status(status).json({
    success: false,
    error: code,
    message,
  });
};

const validateRequiredFields = (body, fields) => {
  return fields.filter((field) => {
    const value = body[field];

    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  });
};

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
  } catch (error) {
    console.error("Invalid Gemini JSON response:");
    console.error(cleanText);

    throw new Error("INVALID_GEMINI_JSON");
  }
};

const handleGeminiError = (error, res) => {
  console.error("Gemini/API error:", error);

  if (
    error?.status === 429 ||
    error?.code === 429 ||
    error?.message?.includes("RESOURCE_EXHAUSTED") ||
    error?.message?.includes("429")
  ) {
    return sendError(
      res,
      429,
      "AI_RATE_LIMIT",
      "TravelPilot is temporarily busy. Please wait about a minute and try again.",
    );
  }

  if (error?.message === "INVALID_GEMINI_JSON") {
    return sendError(
      res,
      502,
      "INVALID_AI_RESPONSE",
      "TravelPilot received an invalid response from the AI service. Please try again.",
    );
  }

  if (
    error?.status === 401 ||
    error?.status === 403 ||
    error?.message?.toLowerCase()?.includes("api key") ||
    error?.message?.includes("API_KEY")
  ) {
    return sendError(
      res,
      500,
      "AI_AUTH_ERROR",
      "TravelPilot could not authenticate with the AI service.",
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
// TEST SERVER
// =====================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TravelPilot backend is running",
  });
});

// =====================================
// GENERATE TRIP
// =====================================

app.post("/api/generate-trip", async (req, res) => {
  try {
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

Create a realistic travel itinerary.

Trip details:

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

Must visit places:
${mustVisit || "None"}

Rules:

- Recommend destination-specific real places.
- Respect the user's interests.
- Include must-visit places when realistically possible.
- Relaxed pace = fewer activities and more free time.
- Balanced pace = moderate schedule.
- Packed pace = more activities.
- Keep the itinerary realistic for the budget.
- Give realistic activity start times.
- Group nearby activities together where possible.
- Include estimated INR cost for every activity.
- Include durationMinutes for every activity.
- Include travelMinutesFromPrevious for every activity.
- travelMinutesFromPrevious is estimated travel time from the previous activity.
- For the first activity of each day, travelMinutesFromPrevious must be 0.
- Avoid scheduling conflicts when possible.
- Do not claim reservations already exist.
- Return ONLY valid JSON.
- No markdown.

Return exactly:

{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "09:00 AM",
          "name": "Activity name",
          "location": "Location",
          "cost": 1000,
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

    const itinerary = parseGeminiJson(response.text);

    if (!Array.isArray(itinerary.days)) {
      throw new Error("INVALID_GEMINI_JSON");
    }

    return res.json(itinerary);
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// =====================================
// REPLAN ACTIVITY
// =====================================

app.post("/api/replan", async (req, res) => {
  try {
    const missingFields = validateRequiredFields(req.body, [
      "destination",
      "cancelledActivity",
      "currentDayActivities",
    ]);

    if (missingFields.length > 0) {
      return sendError(
        res,
        400,
        "MISSING_REPLAN_DATA",
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    const {
      destination,
      interests,
      travelPace,
      budget,
      cancelledActivity,
      currentDayActivities,
    } = req.body;

    const prompt = `
You are TravelPilot's itinerary replanning agent.

One activity is unavailable.

Destination:
${destination}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace || "Balanced"}

Budget:
₹${budget || "Not specified"}

Cancelled activity:

${JSON.stringify(cancelledActivity, null, 2)}

Activities already planned:

${JSON.stringify(currentDayActivities, null, 2)}

Find ONE realistic replacement.

Rules:

- Prefer the same general geographic area.
- Keep a similar time slot.
- Match user interests.
- Avoid duplicate activities.
- Keep cost reasonable.
- Recommend a real place where possible.
- Include durationMinutes.
- Include travelMinutesFromPrevious.
- Ensure the replacement fits with surrounding activities.
- Return only valid JSON.
- No markdown.

Return exactly:

{
  "replacement": {
    "time": "02:00 PM",
    "name": "Replacement activity",
    "location": "Location",
    "cost": 1000,
    "category": "Culture",
    "durationMinutes": 90,
    "travelMinutesFromPrevious": 20,
    "reason": "Explain why this replacement fits."
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const result = parseGeminiJson(response.text);

    if (!result.replacement) {
      throw new Error("INVALID_GEMINI_JSON");
    }

    return res.json(result);
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// =====================================
// FIX CONFLICT
// =====================================

app.post("/api/fix-conflict", async (req, res) => {
  try {
    const missingFields = validateRequiredFields(req.body, [
      "destination",
      "dayNumber",
      "currentDayActivities",
    ]);

    if (missingFields.length > 0) {
      return sendError(
        res,
        400,
        "MISSING_CONFLICT_DATA",
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    const {
      destination,
      budget,
      interests,
      travelPace,
      dayNumber,
      conflictingActivities,
      currentDayActivities,
    } = req.body;

    const prompt = `
You are TravelPilot's schedule conflict resolution agent.

A scheduling conflict has been detected.

Destination:
${destination}

Budget:
₹${budget || "Not specified"}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace || "Balanced"}

Day:
${dayNumber}

Conflicting activities:

${JSON.stringify(conflictingActivities || [], null, 2)}

Full activities for this day:

${JSON.stringify(currentDayActivities, null, 2)}

Fix the conflict while changing as little as possible.

You may:
- Move an activity later.
- Move an activity earlier.
- Shorten an activity if realistic.
- Replace an activity if necessary.
- Reorder nearby activities.

Rules:

- Respect activity duration.
- Respect travel time.
- Do not create new schedule conflicts.
- Avoid removing activities unless necessary.
- Keep costs reasonable.
- Include durationMinutes for every activity.
- Include travelMinutesFromPrevious for every activity.
- First activity travelMinutesFromPrevious must be 0.
- Return ONLY valid JSON.
- No markdown.

Return exactly:

{
  "updatedActivities": [
    {
      "time": "09:00 AM",
      "name": "Activity name",
      "location": "Location",
      "cost": 500,
      "category": "Culture",
      "durationMinutes": 90,
      "travelMinutesFromPrevious": 0
    }
  ],
  "reason": "Short explanation of how the conflict was fixed."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const result = parseGeminiJson(response.text);

    if (!Array.isArray(result.updatedActivities)) {
      throw new Error("INVALID_GEMINI_JSON");
    }

    return res.json(result);
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// =====================================
// CHAT
// =====================================

app.post("/api/chat", async (req, res) => {
  try {
    const missingFields = validateRequiredFields(req.body, [
      "message",
      "destination",
      "itinerary",
    ]);

    if (missingFields.length > 0) {
      return sendError(
        res,
        400,
        "MISSING_CHAT_DATA",
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

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
You are TravelPilot's intelligent trip assistant.

Destination:
${destination}

Hotel / Area:
${hotel || "Not specified"}

Budget:
₹${budget || "Not specified"}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace || "Balanced"}

Current itinerary:

${JSON.stringify(itinerary, null, 2)}

User question:

${message}

Rules:

- Use the actual itinerary when answering.
- Consider activity duration.
- Consider travel time.
- Consider budget.
- Consider hotel location.
- Do not claim live availability unless provided.
- If something cannot be verified, say so clearly.
- Do not use markdown formatting.
- Use short readable paragraphs.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    if (!response.text) {
      throw new Error("INVALID_GEMINI_RESPONSE");
    }

    return res.json({
      answer: response.text.trim(),
    });
  } catch (error) {
    if (error?.message === "INVALID_GEMINI_RESPONSE") {
      return sendError(
        res,
        502,
        "INVALID_AI_RESPONSE",
        "TravelPilot received an empty response from the AI service.",
      );
    }

    return handleGeminiError(error, res);
  }
});

// =====================================
// BUDGET OPTIMIZATION
// =====================================

app.post("/api/optimize-budget", async (req, res) => {
  try {
    const missingFields = validateRequiredFields(req.body, [
      "destination",
      "budget",
      "itinerary",
    ]);

    if (missingFields.length > 0) {
      return sendError(
        res,
        400,
        "MISSING_BUDGET_DATA",
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    const { destination, budget, interests, travelPace, itinerary } = req.body;

    const prompt = `
You are TravelPilot's budget optimization agent.

Destination:
${destination}

Maximum activity budget:
₹${budget}

Interests:
${interests?.join(", ") || "General"}

Travel pace:
${travelPace || "Balanced"}

Current itinerary:

${JSON.stringify(itinerary, null, 2)}

Modify the itinerary so activity costs fit within the user's budget.

Rules:

- Preserve important attractions where possible.
- Replace expensive activities with cheaper alternatives.
- Prefer free or low-cost attractions where suitable.
- Respect user interests.
- Do not duplicate activities.
- Keep schedule realistic.
- Include durationMinutes for every activity.
- Include travelMinutesFromPrevious for every activity.
- First activity of each day must have travelMinutesFromPrevious = 0.
- Avoid creating schedule conflicts.
- Return valid JSON only.
- No markdown.

Return exactly:

{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "09:00 AM",
          "name": "Activity name",
          "location": "Location",
          "cost": 500,
          "category": "Culture",
          "durationMinutes": 90,
          "travelMinutesFromPrevious": 0
        }
      ]
    }
  ],
  "summary": {
    "changes": "Short explanation of how the itinerary was made cheaper."
  }
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

    return res.json(result);
  } catch (error) {
    return handleGeminiError(error, res);
  }
});

// =====================================
// INVALID JSON HANDLER
// =====================================

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(
      res,
      400,
      "INVALID_JSON",
      "The request body contains invalid JSON.",
    );
  }

  next(err);
});

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {
  return sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    "The requested TravelPilot API route does not exist.",
  );
});

// =====================================
// FINAL ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    "An unexpected server error occurred.",
  );
});

// =====================================
// START SERVER
// =====================================

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;

  app.listen(PORT, () => {
    console.log(`TravelPilot server running on port ${PORT}`);
  });
}
