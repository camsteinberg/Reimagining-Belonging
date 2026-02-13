import greenImg from "../../assets/images/greenImg.png";
import yellowImg from "../../assets/images/yellowImg.png";
import redImg from "../../assets/images/redImg.png";
import blueImg from "../../assets/images/blueImg.png";

export default function BelongingFramework() {
  return (
    <section className="slide slide18" data-bg="">
      <div className="slide18TextContainer" style={{ zIndex: 40 }}>
        <div>
          Under uncontrollable housing conditions,
          <br />
          people begin to link belonging to more controllable, more portable
          anchors of meaning.
          <br />
          <br />
          <em>Hover to explore.</em>
        </div>
      </div>

      <div className="slide18Media" aria-hidden="true">
        <img className="img-green" src={greenImg} alt="Place image" />
        <img className="img-yellow" src={yellowImg} alt="Object image" />
        <img className="img-red" src={redImg} alt="Person image" />
        <img className="img-blue" src={blueImg} alt="Language image" />
      </div>

      <div className="greenSVGContainer">
        <svg
          height="100"
          width="100"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="circleFill" cx="80" cy="80" r="70" fill="#234635" />
          <circle className="circleHit" cx="80" cy="80" r="70" fill="#234635" />
        </svg>
        <div className="circleLabel">Place</div>
      </div>

      <div className="yellowSVGContainer">
        <svg
          height="100"
          width="100"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="circleFill" cx="80" cy="80" r="70" fill="#c4a448" />
          <circle className="circleHit" cx="80" cy="80" r="70" fill="#c4a448" />
        </svg>
        <div className="circleLabel">Object</div>
      </div>

      <div className="redSVGContainer">
        <svg
          height="100"
          width="100"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="circleFill" cx="80" cy="80" r="70" fill="#9f4f2e" />
          <circle className="circleHit" cx="80" cy="80" r="70" fill="#9f4f2e" />
        </svg>
        <div className="circleLabel">Person</div>
      </div>

      <div className="blueSVGContainer">
        <svg
          height="100"
          width="100"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="circleFill" cx="80" cy="80" r="70" fill="#2f5496" />
          <circle className="circleHit" cx="80" cy="80" r="70" fill="#2f5496" />
        </svg>
        <div className="circleLabel">Language</div>
      </div>
    </section>
  );
}
