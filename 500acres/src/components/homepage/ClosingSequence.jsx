import finalImage from "../../assets/images/finalImage.png";
import finalImage2 from "../../assets/images/finalImage2.png";

export default function ClosingSequence() {
  return (
    <>
      <section className="slide slide255" data-bg={finalImage} />

      <section className="slide slide26" data-bg={finalImage} data-fade="2500">
        <div className="slide26TextContainer" style={{ zIndex: 40 }}>
          But what if those conditions could be co-built into place?
        </div>
      </section>

      <section className="slide slide27" data-bg={finalImage2} data-fade="2500">
        <div className="slide27TextContainer" style={{ zIndex: 40 }}>
          And this is where{" "}
          <span style={{ color: "#9f4f2e", fontWeight: 800 }}>500 Acres</span>{" "}
          becomes more than research.
          <br />
          It becomes a bridge between imagination and reality.
          <br />
          <br />A place where Gen Z can not only imagine belonging,
          <br />
          <strong>but build it together.</strong>
        </div>
      </section>
    </>
  );
}
