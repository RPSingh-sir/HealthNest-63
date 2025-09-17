import "./Design.css";

const Design = () => {
  return (
    <div className="layout">
      {/* Heading */}
      <div className="heading">
        <p>HealthNest</p>
      </div>

      {/* About section */}
      <div className="about">
        <p>Designed to recommend users for their health insights.</p>
      </div>

      {/* Image Grid */}
      <div className="frame1">
        <img src="/images/medical 1.jpg" alt="Medical 1" />
        <img src="/images/medical 2.jpg" alt="Medical 2" />
        <img src="/images/medical 3.jpg" alt="Medical 3" />
        <img src="/images/medical 1.jpg" alt="Medical 4" />
      </div>
    </div>
  );
};

export default Design;
