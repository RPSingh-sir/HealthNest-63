import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import mammoth from "mammoth";
import fetch from "node-fetch";
import pdf from "pdf-parse/lib/pdf-parse.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { loadavg } from "os";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// File upload setup
const upload = multer({ dest: "uploads/" });

// ✅ Load Gemini API key from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set in .env file!");
  process.exit(1);
}
console.log("Gemini API Key:", GEMINI_API_KEY ? "Loaded ✅" : "Not Found ❌");

// ✅ Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/* ------------------------------------------------------------------
   1. CHAT ENDPOINT
------------------------------------------------------------------ */
app.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;

  const payload = {
    contents: [
      { role: "user", parts: [{ text: "You are a helpful healthcare assistant. Always reply with advice." }] },
      ...history.flatMap((chat) => [
        { role: "user", parts: [{ text: chat.q }] },
        { role: "model", parts: [{ text: chat.a }] },
      ]),
      { role: "user", parts: [{ text: message }] },
    ],
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No reply from Gemini.";
    res.json({ reply });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ reply: "⚠️ Error connecting to Gemini API" });
  }
});

/* ------------------------------------------------------------------
   2. FILE UPLOAD (PDF / DOCX → Insights)
------------------------------------------------------------------ */
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const filePath = req.file.path;
  let extractedText = "";

  try {
    // Extract text from file
    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      extractedText = pdfData.text.trim();
    } else if (
      req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value.trim();
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    // Delete uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.warn("⚠️ Failed to delete file:", err);
    });

    // Truncate long reports
    const truncatedText = extractedText.split("\n").slice(0, 50).join("\n");

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Medical Report:\n${truncatedText}\n\nPlease provide possible insights and recommendations in simple language.`,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    let insights = extractedText;
    if (data?.candidates?.[0]?.content?.parts) {
      insights = data.candidates[0].content.parts.map((p) => p.text).join(" ").trim();
    }

    res.json({ insights });
  } catch (error) {
    console.error("❌ Error processing file:", error);
    res.status(500).json({ error: "Failed to process file" });
  }
});

/* ------------------------------------------------------------------
   3. MEDICINE INFORMATION
------------------------------------------------------------------ */
app.post("/medicine-info", async (req, res) => {
  const { medicine } = req.body;

  if (!medicine) {
    return res.status(400).json({ error: "Medicine name is required" });
  }

  try {
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Provide clear, simple, and useful medical information about the medicine "${medicine}". 
              Cover: uses, dosage, side effects, and precautions.`,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    const info = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No information found.";
    res.json({ info });
  } catch (error) {
    console.error("❌ Error fetching medicine info:", error);
    res.status(500).json({ error: "Failed to fetch medicine info" });
  }
});

/* ------------------------------------------------------------------
   4. RECOMMEND DOCTOR
------------------------------------------------------------------ */
app.post("/recommend-doctor", async (req, res) => {
  const { symptoms } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are a medical triage assistant. Based on the following symptoms, suggest which type of doctor (specialist) the patient should see. Keep it simple, in easy world along with some of the technical words, pass me some of the docotrs details near me if possible.
    
    Symptoms: ${symptoms}`;

    const result = await model.generateContent(prompt);
    res.json({ specialist: result.response.text() });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "AI failed to recommend doctor" });
  }
});

/* ------------------------------------------------------------------
   5. NEARBY HOSPITALS (via Overpass API)
------------------------------------------------------------------ */
// app.get("/nearby-hospitals", async (req, res) => {
//   const { lat, lng } = req.query;

//   const query = `
//     [out:json][timeout:25];
//     (
//       node["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng});
//       way["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng});
//       relation["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng});
//     );
//     out center tags;
//   `;

//   try {
//     const response = await fetch("https://overpass-api.de/api/interpreter", {
//       method: "POST",
//       body: query,
//     });

//     const data = await response.json();

//     // Deduplicate by name + coordinates
//     const seen = new Set();
//     let hospitals = data.elements.map((el) => {
//       const latVal = el.lat || el.center?.lat;
//       const lonVal = el.lon || el.center?.lon;

//       const key = `${el.tags?.name || "Unnamed"}-${latVal}-${lonVal}`;
//       if (seen.has(key)) return null;
//       seen.add(key);

//       return {
//         name: el.tags?.name || "Unnamed Hospital/Clinic",
//         lat: latVal,
//         lon: lonVal,
//         type: el.tags?.amenity,
//         address: [
//           el.tags?.["addr:street"],
//           el.tags?.["addr:city"],
//           el.tags?.["addr:state"],
//           el.tags?.["addr:country"],
//         ]
//           .filter(Boolean)
//           .join(", "),
//         description:
//           el.tags?.description ||
//           el.tags?.["healthcare"] ||
//           "No description available",
//       };
//     });

//     // Filter nulls (duplicates removed)
//     hospitals = hospitals.filter(Boolean);

//     // Shuffle results (to avoid always same order)
//     hospitals.sort(() => Math.random() - 0.5);

//     // Limit to 20–25 results
//     hospitals = hospitals.slice(0, 25);

//     res.json({ hospitals });
//   } catch (err) {
//     console.error("Error fetching from OSM:", err.message);
//     res.status(500).json({ error: "Failed to fetch hospitals" });
//   }
// });

// app.get("/search-hospitals", async (req, res) => {
//   const { lat, lng, query } = req.query;

//   if (!query) return res.status(400).json({ error: "Query is required" });

//   try {
//     // Step 1: Use Gemini to recommend a specialist
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//     const prompt = `A patient says they have: "${query}". Suggest the medical specialist (e.g., cardiologist, dermatologist, orthopedist). Respond with only the specialist title.`;
//     const result = await model.generateContent(prompt);
//     const specialist = result.response.text().trim();

//     console.log("🔍 Specialist:", specialist);

//     // Step 2: Query OSM for hospitals/clinics/doctors nearby
//     const osmQuery = `
//       [out:json][timeout:25];
//       (
//         node["amenity"="hospital"](around:5000,${lat},${lng});
//         node["amenity"="clinic"](around:5000,${lat},${lng});
//         node["amenity"="doctors"](around:5000,${lat},${lng});
//       );
//       out;
//     `;

//     const osmResponse = await fetch("https://overpass-api.de/api/interpreter", {
//       method: "POST",
//       body: osmQuery,
//     });

//     const data = await osmResponse.json();

//     // Step 3: Filter results (naively by name/description containing specialist keyword)
//     let hospitals = data.elements
//       .map((el) => ({
//         name: el.tags?.name || "Unnamed",
//         address: el.tags?.address || el.tags?.["addr:full"] || "Unknown",
//         lat: el.lat,
//         lon: el.lon,
//         type: el.tags?.amenity,
//         specialist,
//       }))
//       .filter((h) =>
//         h.name.toLowerCase().includes(specialist.toLowerCase())
//       );

//     // Limit results (avoid repeats)
//     hospitals = hospitals.slice(0, 20);

//     res.json({ specialist, hospitals });
//   } catch (err) {
//     console.error("Error in /search-hospitals:", err.message);
//     res.status(500).json({ error: "Failed to search hospitals" });
//   }
// });

// app.get("/search-hospitals", async (req, res) => {
//   const { lat, lng, query } = req.query;

//   if (!lat || !lng) {
//     return res.status(400).json({ error: "lat and lng are required" });
//   }

//   // Map disease/issue keywords to specialties
//   const keywordMap = {
//     cardiologist: ["cardiology", "heart", "cardiologist"],
//     dentist: ["dentist", "dental"],
//     orthopedist: ["orthopedic", "bone", "joint"],
//     eye: ["eye", "ophthalmology", "optician"],
//     skin: ["dermatology", "skin"],
//   };

//   // pick search keywords
//   const searchTerms = keywordMap[query?.toLowerCase()] || [query];

//   // Overpass query
//   const osmQuery = `
//     [out:json][timeout:25];
//     (
//       node["amenity"="hospital"](around:5000,${lat},${lng});
//       node["amenity"="clinic"](around:5000,${lat},${lng});
//       node["amenity"="doctors"](around:5000,${lat},${lng});
//     );
//     out body;
//   `;

//   try {
//     const response = await fetch("https://overpass-api.de/api/interpreter", {
//       method: "POST",
//       headers: { "Content-Type": "text/plain" }, // ✅ important
//       body: osmQuery,
//     });

//     const text = await response.text();

//     let data;
//     try {
//       data = JSON.parse(text); // attempt parsing
//     } catch (e) {
//       console.error("❌ Overpass returned non-JSON:", text.slice(0, 200));
//       return res.status(500).json({ error: "Invalid response from Overpass API" });
//     }

//     // filter results
//     let hospitals = data.elements.map((el) => ({
//       name: el.tags?.name || "Unnamed",
//       lat: el.lat,
//       lon: el.lon,
//       type: el.tags?.amenity,
//       description: el.tags?.description || el.tags?.speciality || "",
//     }));

//     // filter by query keywords if provided
//     if (query) {
//       hospitals = hospitals.filter((h) =>
//         searchTerms.some((term) =>
//           h.name.toLowerCase().includes(term) ||
//           h.description.toLowerCase().includes(term)
//         )
//       );
//     }

//     // deduplicate + limit results
//     const seen = new Set();
//     hospitals = hospitals.filter((h) => {
//       const key = `${h.lat},${h.lon}`;
//       if (seen.has(key)) return false;
//       seen.add(key);
//       return true;
//     }).slice(0, 20); // limit 20

//     if (!hospitals.length) {
//       return res.json({ hospitals: [], message: `No hospitals found for ${query} nearby.` });
//     }

//     res.json({ hospitals });
//   } catch (err) {
//     console.error("Error fetching hospitals:", err);
//     res.status(500).json({ error: "Failed to fetch hospitals" });
//   }
// });

// app.get("/search-hospitals", async (req, res) => {
//   const { lat, lng, query } = req.query;

//   if (!lat || !lng) {
//     return res.status(400).json({ error: "lat and lng are required" });
//   }

//   // Overpass query
//   const osmQuery = `
//     [out:json][timeout:25];
//     (
//       node["amenity"="hospital"](around:5000,${lat},${lng});
//       node["amenity"="clinic"](around:5000,${lat},${lng});
//       node["amenity"="doctors"](around:5000,${lat},${lng});
//     );
//     out body;
//   `;

//   try {
//     const response = await fetch("https://overpass-api.de/api/interpreter", {
//       method: "POST",
//       headers: { "Content-Type": "text/plain" },
//       body: osmQuery,
//     });

//     const text = await response.text();
//     console.log("🌍 Overpass raw response preview:", text.slice(0, 200));

//     let data;
//     try {
//       data = JSON.parse(text);
//     } catch (e) {
//       console.error("❌ Overpass returned invalid JSON, falling back to Nominatim...");
//       // ✅ fallback to Nominatim
//       const nominatimRes = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query || "hospital")}&limit=20&viewbox=${lng-0.05},${lat+0.05},${lng+0.05},${lat-0.05}&bounded=1`
//       );
//       const nominatimData = await nominatimRes.json();

//       const hospitals = nominatimData.map((place) => ({
//         name: place.display_name,
//         lat: place.lat,
//         lon: place.lon,
//         type: "hospital/clinic",
//         description: "",
//       }));

//       return res.json({ hospitals });
//     }

//     let hospitals = data.elements.map((el) => ({
//       name: el.tags?.name || "Unnamed",
//       lat: el.lat,
//       lon: el.lon,
//       type: el.tags?.amenity,
//       description: el.tags?.description || el.tags?.speciality || "",
//     }));

//     // deduplicate + limit
//     const seen = new Set();
//     hospitals = hospitals.filter((h) => {
//       const key = `${h.lat},${h.lon}`;
//       if (seen.has(key)) return false;
//       seen.add(key);
//       return true;
//     }).slice(0, 20);

//     console.log("Here are deatails ",hospitals);
    
//     res.json({ hospitals });
//   } catch (err) {
//     console.error("Error fetching hospitals:", err);
//     res.status(500).json({ error: "Failed to fetch hospitals" });
//   }
// });

// 🔹 Search Hospitals/Clinics by disease or speciality

// app.get("/search-hospitals", async (req, res) => {
//   const { lat, lng, query } = req.query;

//   if (!lat || !lng || !query) {
//     return res.status(400).json({ error: "lat, lng, and query are required" });
//   }

//   try {
//     // 🟢 Overpass API query
//     const osmQuery = `
//       [out:json][timeout:25];
//       (
//         node["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng})["speciality"~"${query}",i];
//         way["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng})["speciality"~"${query}",i];
//         relation["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng})["speciality"~"${query}",i];
//       );
//       out center 25;
//     `;

//     const osmResponse = await fetch("https://overpass-api.de/api/interpreter", {
//       method: "POST",
//       body: osmQuery,
//     });

//     let hospitals = [];
//     if (osmResponse.ok) {
//       const data = await osmResponse.json();
//       hospitals = data.elements.map((el) => ({
//         name: el.tags?.name || "Unnamed",
//         lat: el.lat || el.center?.lat,
//         lon: el.lon || el.center?.lon,
//         type: el.tags?.amenity,
//         speciality: el.tags?.speciality || query || "General",
//         address: [
//           el.tags?.["addr:street"] || "",
//           el.tags?.["addr:city"] || "",
//           el.tags?.["addr:state"] || "",
//           el.tags?.["addr:postcode"] || ""
//         ]
//           .filter(Boolean)
//           .join(", "),
//         description: el.tags?.description || "",
//       }));
//     }

//     // 🟢 If no results, fallback to Nominatim
//     if (hospitals.length === 0) {
//       const nominatimRes = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
//           query + " hospital near me"
//         )}&limit=20&addressdetails=1`
//       );

//       const nominatimData = await nominatimRes.json();
//       hospitals = nominatimData.map((place) => ({
//         name: place.display_name.split(",")[0],
//         lat: place.lat,
//         lon: place.lon,
//         type: "hospital/clinic",
//         speciality: query,
//         address: place.display_name,
//         description: "",
//       }));
//     }

//     // ✅ Limit results to 20 unique
//     hospitals = hospitals
//       .filter((h, index, self) => index === self.findIndex((x) => x.lat === h.lat && x.lon === h.lon))
//       .slice(0, 20);

//     console.log("here are the details ",hospitals);
    
//     res.json({ hospitals });
//   } catch (err) {
//     console.error("Error in /search-hospitals:", err.message);
//     res.status(500).json({ error: "Failed to fetch hospitals" });
//   }
// });

app.get("/search-hospitals", async (req, res) => {
  const { lat, lng, query } = req.query;

  if (!lat || !lng || !query) {
    return res.status(400).json({ error: "lat, lng, and query are required" });
  }

  try {
    // 🟢 Overpass API query (fetch all hospitals/clinics, not just speciality)
    const osmQuery = `
      [out:json][timeout:25];
      (
        node["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng});
        way["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng});
        relation["amenity"~"hospital|clinic|doctors"](around:5000,${lat},${lng});
      );
      out center 25;
    `;

    const osmResponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: osmQuery,
    });

    let hospitals = [];
    if (osmResponse.ok) {
      const data = await osmResponse.json();

      hospitals = data.elements.map((el) => {
        const speciality =
          el.tags?.speciality ||
          el.tags?.["healthcare:speciality"] ||
          query || "General";

        return {
          name: el.tags?.name || "Unnamed Hospital",
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          type: el.tags?.amenity,
          speciality,
          address: [
            el.tags?.["addr:street"] || "",
            el.tags?.["addr:city"] || "",
            el.tags?.["addr:state"] || "",
            el.tags?.["addr:postcode"] || "",
          ]
            .filter(Boolean)
            .join(", "),
          description: el.tags?.description || "",
        };
      });

      // 🔹 Filter by query if speciality or name matches
      hospitals = hospitals.filter(
        (h) =>
          h.name.toLowerCase().includes(query.toLowerCase()) ||
          h.speciality.toLowerCase().includes(query.toLowerCase())
      );
    }

    // 🟢 If still no results, fallback to Nominatim
    if (hospitals.length === 0) {
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + " hospital"
        )}&limit=20&addressdetails=1`
      );

      const nominatimData = await nominatimRes.json();
      hospitals = nominatimData.map((place) => ({
        name: place.display_name.split(",")[0],
        lat: place.lat,
        lon: place.lon,
        type: "hospital/clinic",
        speciality: query,
        address: place.display_name,
        description: "",
      }));
    }

    // ✅ Limit results to 20 unique
    hospitals = hospitals
      .filter(
        (h, index, self) =>
          index === self.findIndex((x) => x.lat === h.lat && x.lon === h.lon)
      )
      .slice(0, 20);

    console.log("here are the details ", hospitals);

    res.json({ hospitals });
  } catch (err) {
    console.error("Error in /search-hospitals:", err.message);
    res.status(500).json({ error: "Failed to fetch hospitals" });
  }
});


/* ------------------------------------------------------------------
   START SERVER
------------------------------------------------------------------ */
app.listen(5000, () =>
  console.log("🚀 Backend running at http://localhost:5000")
);
