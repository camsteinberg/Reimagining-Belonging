import { lazy, Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
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
const OurMissionPage = lazy(() => import("./pages/OurMissionPage"));
const OurTeamPage = lazy(() => import("./pages/OurTeamPage"));
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
      <LoadingScreen show={isHomepage} />
      <CustomCursor />
      <ScrollProgress />
      <ScrollToTop />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[300] focus:bg-charcoal focus:text-cream focus:px-6 focus:py-3 focus:rounded-full focus:font-sans focus:text-sm">
        Skip to content
      </a>
      <Navbar isHomepage={isHomepage} />
      <main id="main-content">
      <PageTransition>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<Navigate to="/about/mission" replace />} />
            <Route path="/about/mission" element={<OurMissionPage />} />
            <Route path="/about/team" element={<OurTeamPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/get-involved" element={<GetInvolvedPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/stories/:slug" element={<StoryDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </PageTransition>
      </main>
      {!isHomepage && <Footer />}
    </ErrorBoundary>
  );
}

export default App;
