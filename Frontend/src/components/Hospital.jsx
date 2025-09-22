import { useState } from "react";
import "./Hospital.css";

function NearbyHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

// ✅ Symptom / Disease → Doctor Profession mapping
const mapToProfession = (q) => {
  const lower = q.toLowerCase();
  if (lower.includes("heart") || lower.includes("cardiac") || lower.includes("chest"))
    return "Cardiologist";
  if (lower.includes("skin") || lower.includes("rash") || lower.includes("acne"))
    return "Dermatologist";
  if (lower.includes("bone") || lower.includes("fracture") || lower.includes("orthopedic"))
    return "Orthopedic Surgeon";
  if (lower.includes("lung") || lower.includes("breath") || lower.includes("asthma"))
    return "Pulmonologist";
  if (lower.includes("eye") || lower.includes("vision") || lower.includes("cataract"))
    return "Ophthalmologist";
  if (lower.includes("ear") || lower.includes("hearing") || lower.includes("ent") || lower.includes("throat"))
    return "ENT Specialist";
  if (lower.includes("kidney") || lower.includes("renal") || lower.includes("urine"))
    return "Nephrologist";
  if (lower.includes("brain") || lower.includes("neuro") || lower.includes("stroke") || lower.includes("seizure"))
    return "Neurologist";
  if (lower.includes("pregnancy") || lower.includes("gyne") || lower.includes("women"))
    return "Gynecologist";
  if (lower.includes("child") || lower.includes("pediatric") || lower.includes("infant"))
    return "Pediatrician";
  if (lower.includes("tooth") || lower.includes("dental") || lower.includes("gum"))
    return "Dentist";
  if (lower.includes("mental") || lower.includes("depression") || lower.includes("anxiety"))
    return "Psychiatrist";
  if (lower.includes("cancer") || lower.includes("tumor") || lower.includes("oncology"))
    return "Oncologist";
  if (lower.includes("diabetes") || lower.includes("thyroid") || lower.includes("hormone"))
    return "Endocrinologist";
  if (lower.includes("stomach") || lower.includes("liver") || lower.includes("digestion") || lower.includes("gastric"))
    return "Gastroenterologist";
  if (lower.includes("allergy") || lower.includes("asthma") || lower.includes("immune"))
    return "Allergist / Immunologist";
  if (lower.includes("joint") || lower.includes("arthritis") || lower.includes("rheumatism"))
    return "Rheumatologist";
  if (lower.includes("blood") || lower.includes("anemia") || lower.includes("hemato"))
    return "Hematologist";
  if (lower.includes("infection") || lower.includes("virus") || lower.includes("bacteria"))
    return "Infectious Disease Specialist";
  return "General Physician";
};

  const fetchHospitals = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://healthnest-backend-5oyp.onrender.com/search-hospitals?lat=28.6139&lng=77.2090&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();

      if (data.hospitals) {
        const enriched = data.hospitals.map((h) => ({
          ...h,
          speciality: mapToProfession(query),
        }));
        setHospitals(enriched);
      } else {
        setHospitals([]);
      }
    } catch (err) {
      console.error("Error fetching hospitals:", err);
    }
    setLoading(false);
  };

  return (
    <div className="hospitals">
      <div className="headings">
          <h2>🔍 Search Nearby Hospitals</h2>
          <img src="/images/hospital logo.jpg" alt="logo" />
      </div>
      

      <div className="search-box">
        <input
          type="text"
          placeholder="Enter symptom or disease (e.g. chest pain, skin rash)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <br />
        <button onClick={fetchHospitals}>Search</button>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && hospitals.length === 0 && (
        <p>No hospitals found. Try another search.</p>
      )}

      <div className="hospital-list">
        {hospitals.map((h, i) => (
          <div className="hospital-card" key={i}>
            <h3>{h.name}</h3>
            <p><strong>Specialist:</strong> {h.speciality}</p>
            <p><strong>Type:</strong> {h.type}</p>
            <p><strong>Address:</strong> {h.address || "Not Available"}</p>
            <a
              href={`https://www.google.com/maps?q=${h.lat},${h.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="map-link"
            >
              📍 View on Map
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NearbyHospitals;
