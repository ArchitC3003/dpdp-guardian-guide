import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { StageJourney, type StageJourneyHandle } from "@/components/landing/StageJourney";
import { WhySection } from "@/components/landing/WhySection";
import { Coverage } from "@/components/landing/Coverage";
import { ClosingDoors, LandingFooter } from "@/components/landing/ClosingDoors";
import { stageDestination, type Stage } from "@/components/landing/stages";
import { BUILDER_PATH, clearBuildIntent, saveBuildIntent, saveRouteIntent } from "@/lib/buildIntent";
import "@/styles/landing.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const journey = useRef<StageJourneyHandle>(null);

  /** "Start an assessment": signed-in visitors go to their assessments, everyone else signs in first. */
  /** Remember where a signed-out visitor was heading, so sign-in lands there and not on the dashboard. */
  const remember = (route?: string) => {
    if (session) return;
    clearBuildIntent();
    if (route === BUILDER_PATH) saveBuildIntent();
    else saveRouteIntent(route);
  };
  const goAuth = () => { remember("/assessments"); navigate(session ? "/assessments" : "/auth"); };
  const onAction = (stage: Stage) => {
    const to = stageDestination(stage, !!session);
    if (!to) return;
    if (!stage.open) remember(stage.route);
    navigate(to);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="lp">
        <LandingNav onStart={goAuth} />
        <main>
          <Hero onStart={goAuth} onStage={(i) => journey.current?.goTo(i)} />
          <StageJourney ref={journey} onAction={onAction} />
          <WhySection />
          <Coverage />
          <ClosingDoors onStart={goAuth} />
        </main>
        <LandingFooter />
      </div>
    </LazyMotion>
  );
}
