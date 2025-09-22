import { useState } from "react";
import axios from "axios";
import "./Chatbot.css";

const Chatbot = () => {
  const [symptom, setSymptom] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptom.trim()) return;

    const newHistory = [...history, { q: symptom, a: "..." }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const res = await axios.post("https://healthnest-backend-5oyp.onrender.com/chat", {
        message: symptom,
        history: history,
      });

      newHistory[newHistory.length - 1].a = res.data.reply;
      setHistory([...newHistory]);
    } catch (err) {
      newHistory[newHistory.length - 1].a = "⚠️ Error connecting to server.";
      setHistory([...newHistory]);
    } finally {
      setSymptom("");
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="chatbot">
        <div className="heading_chat">
          <h2>Smart Healthcare Assistant</h2>
          <img src="/images/hospital logo.jpg" alt="Hospital Logo" />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="Enter your symptom"
          />
          <button style={{textAlign:"center"}} type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Check"}
          </button>
        </form>

        {/* Chat History */}
        <div className="chat-history">
          <h3>Chat History</h3>
          <div className="chat-box">
            {history.map((chat, index) => (
              <div key={index} className="chat-message">
                <p className="user-msg"><strong>You:</strong> {chat.q}</p>
                <p className="ai-msg"><strong>AI:</strong> {chat.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
