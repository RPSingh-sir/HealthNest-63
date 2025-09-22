import { useState } from "react";
import "./MedInfo.css";

function MedInfo() {
  const [medicine, setMedicine] = useState("");
  const [info, setInfo] = useState("");

  const fetchInfo = async () => {
    const res = await fetch("https://healthnest-backend-5oyp.onrender.com/medicine-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicine }),
    });
    const data = await res.json();
    setInfo(data.info);
  };

  return (
    <div className="medicine-info">
      <div className="heading_med">
          <h2>Medicine Information Assistant</h2>
          <img src="/images/hospital logo.jpg" alt="logo" />
      </div>
      {/* <h2></h2> */}
      <input
        type="text"
        placeholder="Enter medicine name"
        value={medicine}
        onChange={(e) => setMedicine(e.target.value)}
      />
      <button onClick={fetchInfo}>Get Info</button>

      {info && (
        <div className="result-box">
          <h3>Details: </h3>
          <p>{info}</p>
        </div>
      )}
    </div>
  );
}

export default MedInfo;
