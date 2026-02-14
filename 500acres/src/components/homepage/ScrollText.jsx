import sectionBg1 from "../../assets/images/section01-bg-1.png";
import sectionBg2 from "../../assets/images/section01-bg-2.png";
import sectionBg3 from "../../assets/images/section01-bg-3.png";
import sectionBg4 from "../../assets/images/section01-bg-4.png";

export default function ScrollText() {
  return (
    <>
      <section className="slide slide2 tight-text" data-bg={sectionBg1}>
        <div className="slide2TextContainer">
          <div>Gen Z grows up scrolling.</div>
        </div>
      </section>

      <section className="slide slide3 tight-text" data-bg={sectionBg2}>
        <div className="slide3TextContainer">
          <div>The world</div>
          <div>arrives</div>
          <div>on our phones.</div>
        </div>
      </section>

      <section className="slide slide4 tight-text" data-bg={sectionBg3}>
        <div className="slide4TextContainer">
          <div>News</div>
          <div>Connections</div>
          <div>Opportunities</div>
          <div>Anxiety</div>
          <div>Hope</div>
        </div>
        <div className="slide4BottomText" style={{ display: "flex", flexDirection: "column", position: "absolute", top: "70%", textAlign: "center", zIndex: 20 }}>
          <div>Everything</div>
          <div>is constantly refreshed</div>
        </div>
      </section>

      <section className="slide slide5 tight-text" data-bg={sectionBg4}>
        <div className="slide5TextContainer">
          <div>As we scroll,</div>
          <div>it becomes easy</div>
          <div>to overlook</div>
          <div>how the spaces around us</div>
          <div>are changing.</div>
        </div>
      </section>
    </>
  );
}
