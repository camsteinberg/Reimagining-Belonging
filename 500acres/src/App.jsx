import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import PageTransition from "./components/layout/PageTransition";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ResourcesPage from "./pages/ResourcesPage";
import GetInvolvedPage from "./pages/GetInvolvedPage";
import StoriesPage from "./pages/StoriesPage";
import StoryDetailPage from "./pages/StoryDetailPage";

function App() {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  return (
    <>
      <ScrollToTop />
      <Navbar isHomepage={isHomepage} />
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/get-involved" element={<GetInvolvedPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/stories/:slug" element={<StoryDetailPage />} />
        </Routes>
      </PageTransition>
      {!isHomepage && <Footer />}
    </>
  );
}

export default App;
