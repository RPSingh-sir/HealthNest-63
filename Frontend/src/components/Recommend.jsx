import { useState } from "react";
import "./Recommend.css";

function RecommendDoctor() {
  const [symptoms, setSymptoms] = useState("");
  const [specialist, setSpecialist] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!symptoms) return;

    setLoading(true);
    try {
      const res = await fetch("https://healthnest-backend-5oyp.onrender.com/recommend-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();
      setSpecialist(data.specialist || "No suggestion found");
    } catch (err) {
      console.error(err);
      setSpecialist("⚠️ Error fetching recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommend-doctor">
      {/* ✅ Heading like MedicineInfo */}
      <div className="heading-doc">
        <h2>Doctor Recommendation Assistant</h2>
        <img src="/images/hospital logo.jpg" alt="logo" />
      </div>

      {/* ✅ Input box (textarea) */}
      <textarea
        placeholder="Enter your symptoms like fever, cough etc."
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />

      {/* ✅ Button */}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Analyzing..." : "Get Recommendation"}
      </button>

      {/* ✅ Result section */}
      {specialist && (
        <div className="result">
          <h3>Suggested Specialist:</h3>
          <p>{specialist}</p>
        </div>
      )}
    </div>
  );
}

export default RecommendDoctor;
