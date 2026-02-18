import sectionBg1 from "../assets/images/section01-bg-1.png";
import sectionBg2 from "../assets/images/section01-bg-2.png";
import sectionBg3 from "../assets/images/section01-bg-3.png";
import sectionBg4 from "../assets/images/section01-bg-4.png";
import sectionBg5 from "../assets/images/section01-bg-5.png";
import finalImage from "../assets/images/finalImage.webp";
import finalImage2 from "../assets/images/finalImage2.webp";

// White background is replaced with CSS background-color
const WHITE_BG = null;

export const slides = [
  { id: 1, className: "slide1", bg: null, tightText: false },
  { id: 2, className: "slide2", bg: sectionBg1, tightText: true },
  { id: 3, className: "slide3", bg: sectionBg2, tightText: true },
  { id: 4, className: "slide4", bg: sectionBg3, tightText: true },
  { id: 5, className: "slide5", bg: sectionBg4, tightText: true },
  { id: 6, className: "slide6", bg: sectionBg5, tightText: true },
  { id: 8, className: "slide8", bg: WHITE_BG, tightText: false },
  { id: 9, className: "slide9", bg: WHITE_BG, tightText: false },
  { id: 10, className: "slide10", bg: WHITE_BG, tightText: false },
  { id: 11, className: "slide11", bg: WHITE_BG, tightText: false },
  { id: "map", className: "mapSlides", bg: null, tightText: false },
  { id: 15, className: "slide15", bg: null, tightText: false },
  { id: 16, className: "slide16", bg: null, tightText: false },
  { id: 17, className: "slide17", bg: null, tightText: false },
  { id: 18, className: "slide18", bg: WHITE_BG, tightText: false },
  { id: 19, className: "slide19", bg: WHITE_BG, tightText: false },
  { id: 23, className: "slide23", bg: WHITE_BG, tightText: false },
  { id: 24, className: "slide24", bg: WHITE_BG, tightText: false },
  { id: 25, className: "slide25", bg: WHITE_BG, tightText: false },
  { id: 255, className: "slide255", bg: finalImage, tightText: false },
  { id: 26, className: "slide26", bg: finalImage, tightText: false, fadeDuration: 2500 },
  { id: 27, className: "slide27", bg: finalImage2, tightText: false, fadeDuration: 2500 },
  { id: 28, className: "slide28", bg: WHITE_BG, tightText: false },
];

export const statistics = {
  cantAfford: "81%",
  worseMarket: "82%",
  hopeToOwn: "90%",
  neverHappen: "62%",
};
