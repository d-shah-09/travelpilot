import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5001";

function App() {
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    hotel: "",
    interests: [],
    travelPace: "Balanced",
    mustVisit: "",
    transportType: "",
    transportDetails: "",
    transportStatus: "Planned",
    accommodationBookingRef: "",
    accommodationStatus: "Planned",
  });

  const [tripGenerated, setTripGenerated] = useState(false);

  const [itinerary, setItinerary] = useState([]);

  const [loading, setLoading] = useState(false);

  const [fallbackMode, setFallbackMode] = useState(false);

  const [fallbackMessage, setFallbackMessage] = useState("");

  const [chatMessage, setChatMessage] = useState("");

  const [chatAnswer, setChatAnswer] = useState("");

  const [chatLoading, setChatLoading] = useState(false);

  const [budgetOptimizing, setBudgetOptimizing] = useState(false);

  const [budgetOptimizationMessage, setBudgetOptimizationMessage] =
    useState("");

  const [replacingActivity, setReplacingActivity] = useState(null);

  const [fixingConflict, setFixingConflict] = useState(false);

  const [conflictFixMessage, setConflictFixMessage] = useState("");

  const [appError, setAppError] = useState("");

  const [tripId, setTripId] = useState(null);
  const [transportation, setTransportation] = useState({});
  const [accommodation, setAccommodation] = useState({});
  const [realWorldStatus, setRealWorldStatus] = useState({});

  const [weatherAdapting, setWeatherAdapting] = useState(false);
  const [weatherMessage, setWeatherMessage] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMessage, setHistoryMessage] = useState("");

  const interests = [
    "Food",
    "Culture",
    "Shopping",
    "Adventure",
    "Nightlife",
    "Nature",
  ];

  const travelPaces = ["Relaxed", "Balanced", "Packed"];

  // =====================================
  // API ERROR HELPER
  // =====================================

  const getApiErrorMessage = async (response, fallbackMessage) => {
    try {
      const data = await response.json();

      return data.message || data.error || fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  };

  // =====================================
  // FORM
  // =====================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const toggleInterest = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,

        interests: formData.interests.filter((item) => item !== interest),
      });
    } else {
      setFormData({
        ...formData,

        interests: [...formData.interests, interest],
      });
    }
  };

  const selectTravelPace = (pace) => {
    setFormData({
      ...formData,
      travelPace: pace,
    });
  };

  // =====================================
  // GENERATE TRIP
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    setAppError("");

    setFallbackMode(false);

    setFallbackMessage("");

    setBudgetOptimizationMessage("");

    setConflictFixMessage("");

    try {
      const response = await fetch(`${API_URL}/api/generate-trip`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not generate your trip.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setItinerary(data.days || []);
      setTripId(data.tripId || null);
      setTransportation(data.transportation || {});
      setAccommodation(data.accommodation || {});
      setRealWorldStatus(data.realWorldStatus || {});

      setFallbackMode(Boolean(data.fallback));

      if (data.fallback) {
        setFallbackMessage(
          data.message ||
            "TravelPilot is using demo fallback mode because the AI service is temporarily unavailable.",
        );
      }

      setTripGenerated(true);
    } catch (error) {
      console.error("Generate trip error:", error);

      setAppError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // REPLAN ACTIVITY
  // =====================================

  const handleCancelActivity = async (dayIndex, activityIndex) => {
    if (replacingActivity !== null) {
      return;
    }

    const activityKey = `${dayIndex}-${activityIndex}`;

    setReplacingActivity(activityKey);

    setAppError("");

    try {
      const cancelledActivity = itinerary[dayIndex].activities[activityIndex];

      const currentDayActivities = itinerary[dayIndex].activities.filter(
        (_, index) => index !== activityIndex,
      );

      const response = await fetch(`${API_URL}/api/replan`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          interests: formData.interests,

          travelPace: formData.travelPace,

          budget: formData.budget,

          cancelledActivity,

          currentDayActivities,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not find a replacement activity.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      if (data.fallback) {
        setFallbackMode(true);

        setFallbackMessage(
          "TravelPilot used fallback mode for this replacement because Gemini quota is temporarily unavailable.",
        );
      }

      const updatedItinerary = itinerary.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,

          activities: day.activities.map((activity, currentActivityIndex) => {
            if (currentActivityIndex !== activityIndex) {
              return activity;
            }

            return {
              ...data.replacement,

              replaced: true,

              originalActivity: cancelledActivity.name,
            };
          }),
        };
      });

      setItinerary(updatedItinerary);
    } catch (error) {
      console.error("Replan error:", error);

      setAppError(error.message);
    } finally {
      setReplacingActivity(null);
    }
  };

  // =====================================
  // CHAT
  // =====================================

  const handleChat = async (messageToSend = chatMessage) => {
    if (!messageToSend.trim() || chatLoading) {
      return;
    }

    setChatLoading(true);
    setChatAnswer("");
    setAppError("");

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: messageToSend,

          destination: formData.destination,

          hotel: formData.hotel,

          budget: formData.budget,

          interests: formData.interests,

          travelPace: formData.travelPace,

          itinerary,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "TravelPilot could not answer your question.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setChatAnswer(data.answer);

      setChatMessage("");
    } catch (error) {
      console.error("Chat error:", error);

      setChatAnswer(error.message);
    } finally {
      setChatLoading(false);
    }
  };

  // =====================================
  // BUDGET
  // =====================================

  const calculateTotalCost = () => {
    return itinerary.reduce((tripTotal, day) => {
      const dayTotal = (day.activities || []).reduce((total, activity) => {
        return total + Number(activity.cost || 0);
      }, 0);

      return tripTotal + dayTotal;
    }, 0);
  };

  const totalCost = calculateTotalCost();

  const budgetAmount = Number(formData.budget || 0);

  const remainingBudget = budgetAmount - totalCost;

  const isOverBudget = totalCost > budgetAmount;

  // =====================================
  // BUDGET OPTIMIZATION
  // =====================================

  const handleOptimizeBudget = async () => {
    if (budgetOptimizing) return;

    setBudgetOptimizing(true);

    setBudgetOptimizationMessage("");

    setAppError("");

    try {
      const response = await fetch(`${API_URL}/api/optimize-budget`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          budget: formData.budget,

          interests: formData.interests,

          travelPace: formData.travelPace,

          itinerary,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not optimize the trip budget.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      setItinerary(data.days || []);

      setBudgetOptimizationMessage(
        data.summary?.changes ||
          "TravelPilot optimized your itinerary to reduce costs.",
      );
    } catch (error) {
      console.error("Budget optimization error:", error);

      setBudgetOptimizationMessage(error.message);
    } finally {
      setBudgetOptimizing(false);
    }
  };

  // =====================================
  // TIME HELPERS
  // =====================================

  const convertToMinutes = (time) => {
    if (!time || typeof time !== "string") {
      return 0;
    }

    const parts = time.trim().split(" ");

    if (parts.length < 2) {
      return 0;
    }

    const rawTime = parts[0];

    const modifier = parts[1].toUpperCase();

    let [hours, minutes] = rawTime.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return 0;
    }

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    let hours = Math.floor(minutes / 60);

    const mins = minutes % 60;

    const modifier = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;

    if (hours === 0) {
      hours = 12;
    }

    return `${hours}:${String(mins).padStart(2, "0")} ${modifier}`;
  };

  // =====================================
  // CONFLICT DETECTION
  // =====================================

  const detectConflicts = () => {
    const conflicts = [];

    itinerary.forEach((day, dayIndex) => {
      const activities = day.activities || [];

      for (let i = 0; i < activities.length - 1; i++) {
        const current = activities[i];

        const next = activities[i + 1];

        const currentStart = convertToMinutes(current.time);

        const nextStart = convertToMinutes(next.time);

        const durationMinutes = Number(current.durationMinutes || 60);

        const travelToNext = Number(next.travelMinutesFromPrevious || 0);

        const currentEnd = currentStart + durationMinutes;

        const earliestArrival = currentEnd + travelToNext;

        if (currentStart > 0 && nextStart > 0 && earliestArrival > nextStart) {
          conflicts.push({
            dayIndex,

            dayNumber: day.day,

            firstActivity: current.name,

            secondActivity: next.name,

            currentEnd,

            travelToNext,

            nextStart,

            earliestArrival,

            conflictMinutes: earliestArrival - nextStart,
          });
        }
      }
    });

    return conflicts;
  };

  const conflicts = detectConflicts();

  // =====================================
  // FIX CONFLICT
  // =====================================

  const handleFixConflict = async (conflict) => {
    if (fixingConflict) return;

    setFixingConflict(true);

    setConflictFixMessage("");

    setAppError("");

    try {
      const day = itinerary[conflict.dayIndex];

      if (!day) {
        throw new Error("Could not locate the affected itinerary day.");
      }

      const conflictingActivities = [
        day.activities.find(
          (activity) => activity.name === conflict.firstActivity,
        ),

        day.activities.find(
          (activity) => activity.name === conflict.secondActivity,
        ),
      ].filter(Boolean);

      const response = await fetch(`${API_URL}/api/fix-conflict`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          destination: formData.destination,

          budget: formData.budget,

          interests: formData.interests,

          travelPace: formData.travelPace,

          dayNumber: day.day,

          conflictingActivities,

          currentDayActivities: day.activities,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not fix the schedule conflict.",
        );

        throw new Error(message);
      }

      const data = await response.json();

      const updatedItinerary = itinerary.map((currentDay, currentDayIndex) => {
        if (currentDayIndex !== conflict.dayIndex) {
          return currentDay;
        }

        return {
          ...currentDay,

          activities: data.updatedActivities || currentDay.activities,
        };
      });

      setItinerary(updatedItinerary);

      setConflictFixMessage(
        data.reason ||
          "TravelPilot adjusted the schedule to remove the conflict.",
      );
    } catch (error) {
      console.error("Fix conflict error:", error);

      setConflictFixMessage(error.message);
    } finally {
      setFixingConflict(false);
    }
  };

  // =====================================
  // WEATHER DISRUPTION
  // =====================================

  const highWeatherRisk = itinerary.some((day) => day.weather?.risk === "high");

  const handleAdaptWeather = async () => {
    if (weatherAdapting) return;

    setWeatherAdapting(true);
    setWeatherMessage("");

    try {
      const response = await fetch(`${API_URL}/api/adapt-weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: formData.destination,
          itinerary,
        }),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not adapt the itinerary for weather.",
        );
        throw new Error(message);
      }

      const data = await response.json();
      setItinerary(data.days || itinerary);
      setWeatherMessage(data.message || "Itinerary adapted for weather.");
    } catch (error) {
      setWeatherMessage(error.message);
    } finally {
      setWeatherAdapting(false);
    }
  };

  // =====================================
  // TRIP HISTORY
  // =====================================

  const loadTripHistory = async () => {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryMessage("");

    try {
      const response = await fetch(`${API_URL}/api/trips`);

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Could not load trip history.",
        );
        throw new Error(message);
      }

      const data = await response.json();
      setTripHistory(data.trips || []);

      if (!data.configured) {
        setHistoryMessage(data.message || "Supabase is not configured.");
      }
    } catch (error) {
      setHistoryMessage(error.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSavedTrip = (trip) => {
    setFormData({
      ...formData,
      destination: trip.destination || "",
      startDate: trip.start_date || "",
      endDate: trip.end_date || "",
      budget: String(trip.budget || ""),
      hotel: trip.hotel || trip.accommodation?.name || "",
      interests: trip.interests || [],
      travelPace: trip.travel_pace || "Balanced",
      mustVisit: trip.must_visit || "",
      transportType: trip.transportation?.type || "",
      transportDetails: trip.transportation?.details || "",
      transportStatus: trip.transportation?.status || "Planned",
      accommodationBookingRef: trip.accommodation?.bookingRef || "",
      accommodationStatus: trip.accommodation?.status || "Planned",
    });

    setItinerary(trip.itinerary || []);
    setTripId(trip.id || null);
    setTransportation(trip.transportation || {});
    setAccommodation(trip.accommodation || {});
    setRealWorldStatus(trip.real_world_status || {});
    setFallbackMode(Boolean(trip.fallback));
    setFallbackMessage(
      trip.fallback
        ? "This saved trip was created while TravelPilot was in fallback mode."
        : "",
    );
    setTripGenerated(true);
    setHistoryOpen(false);
  };

  const IntegrationBadge = ({ label, value }) => (
    <span
      className={`integration-badge ${
        value === "enabled" ? "integration-on" : "integration-off"
      }`}
    >
      {label}: {value === "enabled" ? "Live" : "Not configured"}
    </span>
  );

  // =====================================
  // DASHBOARD
  // =====================================

  if (historyOpen) {
    return (
      <div className="history-page">
        <div className="history-header">
          <div>
            <p className="dashboard-logo">✈ TravelPilot</p>
            <h1>Trip History</h1>
          </div>

          <button
            className="edit-trip-button"
            onClick={() => setHistoryOpen(false)}
          >
            Back
          </button>
        </div>

        {historyLoading && <p>Loading saved trips...</p>}

        {historyMessage && (
          <div className="history-message">{historyMessage}</div>
        )}

        <div className="history-grid">
          {tripHistory.map((trip) => (
            <button
              className="history-card"
              key={trip.id}
              onClick={() => loadSavedTrip(trip)}
            >
              <strong>{trip.destination}</strong>
              <span>
                {trip.start_date} → {trip.end_date}
              </span>
              <span>₹{Number(trip.budget || 0).toLocaleString()}</span>
              <span>{trip.hotel || "No hotel area"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tripGenerated) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-logo">✈ TravelPilot</p>

            <h1>{formData.destination}</h1>

            <p className="dashboard-subtitle">
              {formData.startDate}
              {" → "}
              {formData.endDate}
            </p>
          </div>

          <div className="header-actions">
            <button className="edit-trip-button" onClick={loadTripHistory}>
              Trip History
            </button>

            <button
              className="edit-trip-button"
              onClick={() => {
                setTripGenerated(false);

                setAppError("");
              }}
            >
              Edit Trip
            </button>
          </div>
        </header>

        <div className="integration-strip">
          <IntegrationBadge label="Places" value={realWorldStatus.places} />
          <IntegrationBadge
            label="Travel time"
            value={realWorldStatus.routes}
          />
          <IntegrationBadge label="Weather" value={realWorldStatus.weather} />
          <IntegrationBadge
            label="Trip history"
            value={realWorldStatus.database}
          />
        </div>

        {fallbackMode && (
          <div className="fallback-notice">
            <strong>⚡ Demo Fallback Mode</strong>

            <p>{fallbackMessage}</p>
          </div>
        )}

        {appError && (
          <div className="app-error">
            <strong>⚠ TravelPilot Error</strong>

            <p>{appError}</p>

            <button onClick={() => setAppError("")}>Dismiss</button>
          </div>
        )}

        {highWeatherRisk && (
          <div className="weather-alert">
            <div>
              <strong>⛈ Weather disruption risk detected</strong>
              <p>
                TravelPilot can replace weather-sensitive outdoor activities.
              </p>
            </div>
            <button onClick={handleAdaptWeather} disabled={weatherAdapting}>
              {weatherAdapting ? "Adapting..." : "Adapt Itinerary"}
            </button>
          </div>
        )}

        {weatherMessage && (
          <div className="weather-result">☁ {weatherMessage}</div>
        )}

        <div className="trip-summary">
          <div className="summary-card">
            <span>Budget</span>

            <strong>₹{Number(formData.budget).toLocaleString()}</strong>
          </div>

          <div className="summary-card">
            <span>Hotel Area</span>

            <strong>{formData.hotel || "Not selected"}</strong>
          </div>

          <div className="summary-card">
            <span>Interests</span>

            <strong>
              {formData.interests.length
                ? formData.interests.join(", ")
                : "General"}
            </strong>
          </div>
        </div>

        <div className="logistics-grid">
          <div className="logistics-card">
            <span>Transportation</span>
            <strong>{transportation.type || "Not added"}</strong>
            <p>{transportation.details || "No transport details"}</p>
            <small>Status: {transportation.status || "Planned"}</small>
          </div>

          <div className="logistics-card">
            <span>Accommodation</span>
            <strong>
              {accommodation.name || formData.hotel || "Not added"}
            </strong>
            <p>Booking ref: {accommodation.bookingRef || "Not added"}</p>
            <small>Status: {accommodation.status || "Planned"}</small>
          </div>

          <div className="logistics-card">
            <span>Saved Trip</span>
            <strong>{tripId ? "Saved to history" : "Not saved"}</strong>
            <p>
              {tripId
                ? "Stored in Supabase."
                : "Configure Supabase to enable persistent history."}
            </p>
          </div>
        </div>

        <div className="budget-summary">
          <div className="budget-stat">
            <span>Estimated Activities</span>

            <strong>₹{totalCost.toLocaleString()}</strong>
          </div>

          <div className="budget-stat">
            <span>Trip Budget</span>

            <strong>₹{budgetAmount.toLocaleString()}</strong>
          </div>

          <div className="budget-stat">
            <span>{isOverBudget ? "Over Budget" : "Remaining"}</span>

            <strong className={isOverBudget ? "budget-danger" : "budget-safe"}>
              {isOverBudget ? "-" : ""}₹
              {Math.abs(remainingBudget).toLocaleString()}
            </strong>
          </div>
        </div>

        {isOverBudget && (
          <div className="budget-alert">
            <div>
              <strong>⚠ Your itinerary is over budget</strong>

              <p>
                This itinerary exceeds your budget by ₹
                {Math.abs(remainingBudget).toLocaleString()}.
              </p>
            </div>

            <button onClick={handleOptimizeBudget} disabled={budgetOptimizing}>
              {budgetOptimizing ? "Optimizing..." : "Optimize Trip"}
            </button>
          </div>
        )}

        {budgetOptimizationMessage && (
          <div className="optimization-result">
            ✨ {budgetOptimizationMessage}
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="conflict-alert">
            <strong>⚠ Schedule Conflict Detected</strong>

            {conflicts.map((conflict, index) => (
              <div className="conflict-item" key={index}>
                <p>
                  Day {conflict.dayNumber}:{" "}
                  <strong>{conflict.firstActivity}</strong> conflicts with{" "}
                  <strong>{conflict.secondActivity}</strong>.
                </p>

                <p>
                  First activity ends at {minutesToTime(conflict.currentEnd)}.
                </p>

                <p>Travel time required: {conflict.travelToNext} minutes.</p>

                <p>
                  Earliest arrival: {minutesToTime(conflict.earliestArrival)}.
                </p>

                <p>
                  Next activity starts at {minutesToTime(conflict.nextStart)}.
                </p>

                <p>
                  Conflict: <strong>{conflict.conflictMinutes} minutes</strong>
                </p>

                <button
                  className="fix-conflict-button"
                  disabled={fixingConflict}
                  onClick={() => handleFixConflict(conflict)}
                >
                  {fixingConflict ? "Fixing..." : "Fix Conflict"}
                </button>
              </div>
            ))}
          </div>
        )}

        {conflictFixMessage && (
          <div className="conflict-fix-result">✨ {conflictFixMessage}</div>
        )}

        <div className="dashboard-content">
          <section className="itinerary-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR TRIP</p>

                <h2>Day-by-day itinerary</h2>
              </div>
            </div>

            {itinerary.map((day, dayIndex) => (
              <div className="day-card" key={day.day}>
                <div className="day-heading">
                  <div className="day-number">Day {day.day}</div>

                  <h3>{day.title}</h3>

                  {day.weather && (
                    <div className={`weather-chip weather-${day.weather.risk}`}>
                      <strong>{day.weather.summary}</strong>
                      {!day.weather.unavailable && (
                        <span>
                          {day.weather.minTempC}°–{day.weather.maxTempC}°C ·
                          Rain {day.weather.precipitationProbability ?? "?"}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="activity-list">
                  {(day.activities || []).map((activity, index) => {
                    const activityKey = `${dayIndex}-${index}`;

                    const isReplacing = replacingActivity === activityKey;

                    return (
                      <div className="activity-row" key={index}>
                        <div className="activity-time">{activity.time}</div>

                        <div className="activity-details">
                          <h4>{activity.name}</h4>

                          <p>📍 {activity.location}</p>

                          {activity.category && <p>🏷 {activity.category}</p>}

                          {activity.realPlaceVerified && (
                            <p className="verified-place">
                              ✓ Real place verified
                              {activity.rating
                                ? ` · ⭐ ${activity.rating}`
                                : ""}
                            </p>
                          )}

                          {activity.openingHoursLabel && (
                            <p
                              className={`opening-status opening-${activity.openingHoursStatus}`}
                            >
                              🕒 {activity.openingHoursLabel}
                            </p>
                          )}

                          {activity.durationMinutes && (
                            <p>⏱ {activity.durationMinutes} min</p>
                          )}

                          {activity.travelMinutesFromPrevious > 0 && (
                            <p>
                              🚗 {activity.travelMinutesFromPrevious} min from
                              previous stop
                            </p>
                          )}

                          {activity.mapUrl && (
                            <a
                              className="map-link"
                              href={activity.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open in Google Maps ↗
                            </a>
                          )}

                          {activity.weatherDisruption && (
                            <p className="weather-activity-warning">
                              ⛈ Outdoor activity may be disrupted by weather.
                            </p>
                          )}

                          {activity.weatherAdjusted && (
                            <p className="weather-adjusted">
                              ☂ Weather-adjusted:{" "}
                              {activity.weatherAdjustmentReason}
                            </p>
                          )}

                          {activity.replaced && (
                            <div className="replacement-info">
                              <p>✨ Replaced "{activity.originalActivity}"</p>

                              {activity.reason && (
                                <p className="replacement-reason">
                                  Why: {activity.reason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="activity-cost">
                          ₹{Number(activity.cost || 0).toLocaleString()}
                        </div>

                        <button
                          className="cancel-button"
                          disabled={isReplacing}
                          onClick={() => handleCancelActivity(dayIndex, index)}
                        >
                          {isReplacing ? "Finding..." : "Replace"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <aside className="assistant-panel">
            <p className="eyebrow">AI ASSISTANT</p>

            <h3>Ask TravelPilot</h3>

            <p className="assistant-text">
              Ask questions about your trip or make changes.
            </p>

            <button onClick={() => handleChat("What should I do tomorrow?")}>
              What should I do tomorrow?
            </button>

            <button onClick={() => handleChat("Can I add another activity?")}>
              Can I add another activity?
            </button>

            <button
              onClick={() => handleChat("How can I reduce my trip budget?")}
            >
              Reduce my trip budget
            </button>

            <button
              onClick={() =>
                handleChat("What activities are close to my hotel?")
              }
            >
              What is close to my hotel?
            </button>

            <div className="chat-box">
              <input
                type="text"
                placeholder="Ask about your trip..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleChat();
                  }
                }}
              />

              <button onClick={() => handleChat()} disabled={chatLoading}>
                {chatLoading ? "..." : "Send"}
              </button>
            </div>

            {chatLoading && (
              <p className="chat-loading">TravelPilot is thinking...</p>
            )}

            {chatAnswer && (
              <div className="chat-answer">
                <strong>TravelPilot</strong>

                <p>{chatAnswer}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // =====================================
  // FORM
  // =====================================

  return (
    <div className="app">
      <div className="trip-card">
        <div className="form-top-actions">
          <button
            type="button"
            className="history-button"
            onClick={loadTripHistory}
          >
            Trip History
          </button>
        </div>

        <div className="logo">
          ✈ <span>TravelPilot</span>
        </div>

        <p className="tagline">AI-powered trip planning</p>

        <h1>Where do you want to go?</h1>

        <p className="subtitle">
          Tell us about your trip and we'll build your personalized itinerary.
        </p>

        {appError && (
          <div className="app-error form-error">
            <strong>⚠ TravelPilot Error</strong>

            <p>{appError}</p>

            <button onClick={() => setAppError("")}>Dismiss</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Destination</label>

          <input
            type="text"
            name="destination"
            placeholder="e.g. Tokyo"
            value={formData.destination}
            onChange={handleChange}
            required
          />

          <div className="date-row">
            <div>
              <label>Start Date</label>

              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>End Date</label>

              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label>Trip Budget (₹)</label>

          <input
            type="number"
            name="budget"
            placeholder="e.g. 100000"
            value={formData.budget}
            onChange={handleChange}
            required
          />

          <label>Hotel / Area</label>

          <input
            type="text"
            name="hotel"
            placeholder="e.g. Shinjuku"
            value={formData.hotel}
            onChange={handleChange}
          />

          <div className="form-section">
            <h3>Transportation tracking</h3>

            <div className="date-row">
              <div>
                <label>Transport Type</label>
                <select
                  name="transportType"
                  value={formData.transportType}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="Flight">Flight</option>
                  <option value="Train">Train</option>
                  <option value="Bus">Bus</option>
                  <option value="Car">Car</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label>Status</label>
                <select
                  name="transportStatus"
                  value={formData.transportStatus}
                  onChange={handleChange}
                >
                  <option>Planned</option>
                  <option>Booked</option>
                  <option>Confirmed</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>

            <label>Transport Details</label>
            <input
              type="text"
              name="transportDetails"
              placeholder="e.g. AI 101, 08:30 departure"
              value={formData.transportDetails}
              onChange={handleChange}
            />
          </div>

          <div className="form-section">
            <h3>Accommodation tracking</h3>

            <div className="date-row">
              <div>
                <label>Booking Reference</label>
                <input
                  type="text"
                  name="accommodationBookingRef"
                  placeholder="Optional"
                  value={formData.accommodationBookingRef}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Status</label>
                <select
                  name="accommodationStatus"
                  value={formData.accommodationStatus}
                  onChange={handleChange}
                >
                  <option>Planned</option>
                  <option>Booked</option>
                  <option>Confirmed</option>
                  <option>Checked in</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <label>What are you interested in?</label>

          <div className="interests">
            {interests.map((interest) => (
              <button
                type="button"
                key={interest}
                className={
                  formData.interests.includes(interest)
                    ? "interest active"
                    : "interest"
                }
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>

          <label>Travel Pace</label>

          <div className="pace-options">
            {travelPaces.map((pace) => (
              <button
                type="button"
                key={pace}
                className={
                  formData.travelPace === pace
                    ? "pace-button active"
                    : "pace-button"
                }
                onClick={() => selectTravelPace(pace)}
              >
                {pace === "Relaxed" && "🌿 "}

                {pace === "Balanced" && "⚖️ "}

                {pace === "Packed" && "⚡ "}

                {pace}
              </button>
            ))}
          </div>

          <div className="pace-description">
            {formData.travelPace === "Relaxed" && (
              <p>Fewer activities with more free time.</p>
            )}

            {formData.travelPace === "Balanced" && (
              <p>A comfortable mix of sightseeing and breaks.</p>
            )}

            {formData.travelPace === "Packed" && (
              <p>More activities with a faster schedule.</p>
            )}
          </div>

          <label>Must-Visit Places</label>

          <textarea
            name="mustVisit"
            placeholder="e.g. Hongya Cave, Gateway of India..."
            value={formData.mustVisit}
            onChange={handleChange}
            rows="3"
          />

          <p className="field-help">
            Optional — add places you definitely want included.
          </p>

          <button className="generate-button" type="submit" disabled={loading}>
            {loading ? "Building Your Trip..." : "Generate My Trip →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
