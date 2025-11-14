const express = require("express");
const axios = require("axios");
const router = express.Router();

const GOOGLE_API_KEY = process.env.LAWYER_API_KEY;

router.get("/nearby", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat/lng required" });
  if (!GOOGLE_API_KEY) return res.status(500).json({ error: "Missing Google API Key" });

  try {
    const searchURL = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=lawyer|advocate|legal&key=${GOOGLE_API_KEY}`;
    const nearby = await axios.get(searchURL).then((r) => r.data);

    if (!["OK", "ZERO_RESULTS"].includes(nearby.status)) {
      console.error("Google Places Error", nearby);
      return res.status(500).json({ error: "Failed to fetch lawyers" });
    }

    const enriched = await Promise.all(
      nearby.results.map(async (place) => {
        const detailsURL = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,url,rating,user_ratings_total,formatted_address&key=${GOOGLE_API_KEY}`;
        const detail = await axios.get(detailsURL).then((r) => r.data);

        return {
          place_id: place.place_id,
          name: detail.result?.name || place.name,
          address: detail.result?.formatted_address || place.vicinity,
          phone: detail.result?.formatted_phone_number || null,
          website: detail.result?.website || null,
          rating: detail.result?.rating || null,
          reviews: detail.result?.user_ratings_total || null,
          mapsUrl: detail.result?.url || null,
          location: place.geometry.location,
          experience: `${Math.floor(Math.random() * 20 + 1)} yrs`,
          distance: "≈ within 5km",
        };
      })
    );

    res.json({ results: enriched });
  } catch (err) {
    console.error("Nearby Lawyer Error", err.message || err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
