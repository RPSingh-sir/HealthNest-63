import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chatbot from "./components/Chatbot";
import Design from "./components/Design";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import UploadForm from "./components/UploadForm";
import MedInfo from "./components/MedInfo";
import Hospital from "./components/Hospital";
import Recommend from "./components/Recommend";

function App() {
  return (
    <Router>
      <div className="app">
        {/* ✅ Navbar always visible */}
        <Navbar />

        {/* ✅ Only this part changes based on route */}
        <div className="content">
          <Routes>
            <Route path="/" element={<Design />} />
            <Route path="/upload" element={<UploadForm />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/medInfo" element={<MedInfo />} />
            <Route path="/hospitals" element={<Hospital />} />
            <Route path="/recommend-doctor" element={<Recommend />} />
          </Routes>
        </div>

        {/* ✅ Footer always visible */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
