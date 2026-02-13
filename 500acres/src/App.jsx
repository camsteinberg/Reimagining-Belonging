import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import PageTransition from "./components/layout/PageTransition";
import CustomCursor from "./components/shared/CustomCursor";
import ScrollProgress from "./components/shared/ScrollProgress";
import LoadingScreen from "./components/shared/LoadingScreen";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import HomePage from "./pages/HomePage";

// Lazy-load inner pages for performance
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const GetInvolvedPage = lazy(() => import("./pages/GetInvolvedPage"));
const StoriesPage = lazy(() => import("./pages/StoriesPage"));
const StoryDetailPage = lazy(() => import("./pages/StoryDetailPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex gap-3">
        <div className="loading-ember" />
        <div className="loading-ember" />
        <div className="loading-ember" />
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  const isHomepage = location.pathname === "/";

  return (
    <ErrorBoundary>
      <LoadingScreen />
      <CustomCursor />
      <ScrollProgress />
      <ScrollToTop />
      <Navbar isHomepage={isHomepage} />
      <PageTransition>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/get-involved" element={<GetInvolvedPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/stories/:slug" element={<StoryDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageTransition>
      {!isHomepage && <Footer />}
    </ErrorBoundary>
  );
}

export default App;
