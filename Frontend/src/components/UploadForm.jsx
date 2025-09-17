import { useState } from "react";
import axios from "axios";
import "./UploadForm.css";

function UploadReport() {
  const [file, setFile] = useState(null);
  const [insights, setInsights] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("https://healthnest-backend-5oyp.onrender.com/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInsights(res.data.insights);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file. Please try again.");
    }
  };

  return (
    <div className="upload">
      {/* Header Section */}
      <div className="heading_upd">
        <h2>Upload Medical Report</h2>
        <img src="/images/hospital logo.jpg" alt="logo" />
      </div>

      {/* Upload Section */}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="file-input"
      />
      <button onClick={handleUpload}>Analyze</button>

      {/* Results Section */}
      {insights && (
        <div className="results">
          <h3>AI Insights</h3>
          <div className="content-box">
            <p>{insights}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadReport;
