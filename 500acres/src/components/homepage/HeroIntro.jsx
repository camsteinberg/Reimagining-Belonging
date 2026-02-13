export default function HeroIntro() {
  const intro = () => {
    const slide2 = document.querySelector(".slide2");
    if (slide2) {
      slide2.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="slide slide1">
      <header className="introHeader">Reimagining Belonging</header>
      <div className="introSub">How Meaning Takes Shape When Home is Unstable</div>
      <button className="startButton" onClick={intro}>
        Click to Start
      </button>
    </section>
  );
}
