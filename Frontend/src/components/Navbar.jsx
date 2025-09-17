import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  // const handleLogout = () => {
  //   localStorage.removeItem("user"); // clear session
  //   navigate("/"); // redirect to landing page
  // };

  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <img src="/images/KG-logo.jpg" alt="Company Logo" />
        <span> Kanhyavanshi Groups  </span>

        {/* Buttons for navigation */}
      <div className="buttons">
        <button onClick={() => navigate("/")}>Home</button>
        <button onClick={() => navigate("/upload")}>Upload Document</button>
        <button onClick={() => navigate("/chat")}>Talk to Assistant</button>
        <button onClick={() => navigate("/MedInfo")}>Get Medicine Info</button>
        <button onClick={() => navigate("/hospitals")}>Nearby Hospitals</button>
        <button onClick={() => navigate("/recommend-doctor")}>Recommend Doctor</button>

      </div>
        
      </div>

      {/* Nav Links */}
      {/* <div className="navbar-links">
        <NavLink to="/upload">Upload Doc</NavLink>
        <NavLink to="/chat">Chatbot</NavLink>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div> */}
    </nav>
  );
}

export default Navbar;
