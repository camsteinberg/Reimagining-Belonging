import belongingLeft from "../../assets/images/belongingLeft.png";
import belongingRight from "../../assets/images/belongingRight.png";

export default function BelongingReveal() {
  return (
    <section className="slide slide17">
      <div className="slide17TextContainer">
        <div>
          As mobility becomes an ongoing condition of life,
          <br />
          "where you live" isn't enough.
          <br />
          <br />
          We spoke with seven Gen Z participants, and invited them to draw home.
          <br />
          What we heard was clear:
          <br />
          when material stability is missing, meaning takes on the extra weight.
          <br />
          <br />
          <em>Hover or tap to see what they said.</em>
        </div>
      </div>

      <div className="hoverGroup">
        <div className="svgContainer2">
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="Gradient2" x1="0" x2="1" y1="0" y2="1">
                <stop offset="50%" stopColor="#333333" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#Gradient2)" />
          </svg>
        </div>

        <div className="belongingLabel">Belonging is...</div>

        <img
          className="slide17Reveal left"
          src={belongingLeft}
          alt="Belonging quote left"
          style={{ width: "30vw" }}
        />
        <img
          className="slide17Reveal right"
          src={belongingRight}
          alt="Belonging quote right"
          style={{ width: "30vw" }}
        />
      </div>
    </section>
  );
}
