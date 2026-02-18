import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="grain bg-cream min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-sage/8 blob pointer-events-none blur-2xl" />
      <div className="absolute bottom-[15%] right-[10%] w-[20vw] h-[20vw] bg-amber/10 blob pointer-events-none blur-2xl" style={{ animationDelay: "-3s" }} />

      <div className="relative z-10 text-center page-container">
        <p className="font-sans text-xs uppercase tracking-[0.4em] text-charcoal/50 mb-8">
          Page Not Found
        </p>
        <h1 className="font-serif text-[clamp(5rem,15vw,12rem)] leading-none font-bold text-charcoal/10 mb-4">
          404
        </h1>
        <p className="font-serif text-xl md:text-2xl text-charcoal/60 mb-4 max-w-md mx-auto leading-relaxed">
          This path doesn't lead anywhere yet.
        </p>
        <p className="font-serif text-base text-charcoal/60 mb-10 max-w-sm mx-auto">
          But there are plenty of trails to explore.
        </p>
        <Link
          to="/"
          className="group inline-flex items-center gap-3 bg-charcoal text-cream px-8 py-4 rounded-full font-serif text-lg transition-all duration-300 hover:bg-forest hover:gap-5"
        >
          <span>Back to Home</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      </div>
    </div>
  );
}
