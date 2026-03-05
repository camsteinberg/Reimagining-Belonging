'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import HeroLanding from '@/components/public/homepage/HeroLanding';
import BackgroundCrossfade from '@/components/public/homepage/BackgroundCrossfade';
import PhoneOverlay from '@/components/public/homepage/PhoneOverlay';
import ScrollText from '@/components/public/homepage/ScrollText';
import ZoomTransition from '@/components/public/homepage/ZoomTransition';
import StatisticsBlock from '@/components/public/homepage/StatisticsBlock';
import InitialMap from '@/components/public/homepage/InitialMap';
import MigrationMap from '@/components/public/homepage/MigrationMap';
import BelongingReveal from '@/components/public/homepage/BelongingReveal';
import BelongingFramework from '@/components/public/homepage/BelongingFramework';
import ParticipantDrawings from '@/components/public/homepage/ParticipantDrawings';
import MeaningToReality from '@/components/public/homepage/MeaningToReality';
import ParticipantStories from '@/components/public/homepage/ParticipantStories';
import IdealHomes from '@/components/public/homepage/IdealHomes';
import ClosingSequence from '@/components/public/homepage/ClosingSequence';
import FinalSlide from '@/components/public/homepage/FinalSlide';
import LoadingScreen from '@/components/public/shared/LoadingScreen';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHero, setShowHero] = useState(true);

  const onShowHero = useCallback(() => {
    window.scrollTo(0, 0);
    setShowHero(true);
  }, []);

  // Scroll up at the top of the page triggers the hero to come back
  // Guarded with a cooldown to prevent retriggering during iOS bounce scroll
  useEffect(() => {
    if (showHero) return;

    let cooldown = true;
    const cooldownTimer = setTimeout(() => { cooldown = false; }, 1000);

    const onWheel = (e: WheelEvent) => {
      if (!cooldown && window.scrollY === 0 && e.deltaY < 0) {
        onShowHero();
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!cooldown && window.scrollY === 0 && e.touches[0].clientY - touchStartY > 80) {
        onShowHero();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      clearTimeout(cooldownTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [showHero, onShowHero]);

  return (
    <div ref={containerRef}>
      <LoadingScreen show={true} />
      <HeroLanding show={showHero} onDismiss={() => setShowHero(false)} />
      <BackgroundCrossfade />
      <PhoneOverlay />
      <div className="slide7BgOverlay" aria-hidden="true" />

      {/* Back-to-hero arrow */}
      {!showHero && (
        <button
          onClick={onShowHero}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-1 group cursor-pointer opacity-0 animate-[fadeIn_0.6s_ease_0.5s_forwards]"
          aria-label="Back to top"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="text-cream/50 group-hover:text-cream transition-colors rotate-180"
          >
            <path
              d="M12 4L12 20M12 20L6 14M12 20L18 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <ScrollText />
      <ZoomTransition />
      <StatisticsBlock />
      <InitialMap />
      <MigrationMap slideNum={15} />
      <MigrationMap slideNum={16} />
      <BelongingReveal />
      <BelongingFramework />
      <ParticipantDrawings />
      <MeaningToReality />
      <ParticipantStories />
      <IdealHomes />
      <ClosingSequence />
      <FinalSlide />
    </div>
  );
}
