import { useState } from "react";

function DoctorReco() {
  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const fetchRecommendation = async () => {
    const res = await fetch("https://healthnest-backend-5oyp.onrender.com/recommend-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms }),
    });
    const data = await res.json();
    setRecommendation(data.specialist);
  };

  return (
    <div className="doctor-reco">
      <h2>Doctor Recommendation</h2>
      <textarea
        placeholder="Enter your symptoms..."
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />
      <button onClick={fetchRecommendation}>Find Specialist</button>

      {recommendation && (
        <div className="result">
          <h3>Recommendation:</h3>
          <p>{recommendation}</p>
        </div>
      )}
    </div>
  );
}

export default DoctorReco;
