import "./Footer.css";
import { 
  FaFacebook, 
  FaInstagram, 
  FaLinkedin, 
  FaYoutube, 
  FaEnvelope, 
  FaPhoneAlt,
  FaHospital, 
  FaMapMarkedAlt 
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* Left Section: Company Info */}
        <div className="footer-section">
          <h4>Kanhyavanshi Groups</h4>
          <p>Building trust since 1967</p>
        </div>

        {/* Middle Section: Contact Info */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>
            <FaEnvelope />{" "}
            <a href="mailto:contact@kanhyavanshi.com" className="footer-link">contact@kanhyavanshi.com</a>
          </p>
          <p>
            <FaPhoneAlt />{" "}
            <a href="tel:+916393565995" className="footer-link">
              +91 63935 65995
            </a>
          </p>
          <p>
            <FaMapMarkedAlt />{" "}
            <a
              href="https://www.google.com/maps/place/Pratapgarh,+Uttar+Pradesh,+India"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Pratapgarh, Uttar Pradesh, India
            </a>
          </p>
        </div>

        {/* Right Section: Social Links */}
        <div className="footer-section social">
          <h4>Follow Us</h4>
          <a href="https://www.facebook.com/shivani.chand.186" target="_blank" rel="noreferrer">
            <FaFacebook /> Facebook
          </a>
          <a href="https://www.instagram.com/adarsh_kanhyavanshi/" target="_blank" rel="noreferrer">
            <FaInstagram /> Instagram
          </a>
          <a href="https://www.youtube.com/@AV_VLOGGERS" target="_blank" rel="noreferrer">
            <FaYoutube /> Youtube
          </a>
          <a href="https://www.linkedin.com/in/raghvendra-pratap-singh-182b13251/" target="_blank" rel="noreferrer">
            <FaLinkedin /> LinkedIn
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Kanhyavanshi Groups. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
