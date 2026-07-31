"use client";

import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { BackgroundProvider } from "@/components/providers/BackgroundProvider";
import { MusicProvider } from "@/components/providers/MusicProvider";
import { EffectProvider } from "@/components/providers/EffectProvider";
import BackgroundRenderer from "@/components/layout/BackgroundRenderer";
import Navbar from "@/components/layout/Navbar";
import ClientWidgets from "@/components/layout/ClientWidgets";
import ClickEffect from "@/components/ui/ClickEffect";
import RadialMenu from "@/components/ui/RadialMenu";
import MouseTrail from "@/components/ui/MouseTrail";
import SeasonalEffect from "@/components/ui/SeasonalEffect";
import KiraSparkle from "@/components/ui/KiraSparkle";
import WelcomeScreen from "@/components/layout/WelcomeScreen";
import VisitorTracker from "@/components/layout/VisitorTracker";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <main>{children}</main>;
  }

  return (
    <EffectProvider>
      <WelcomeScreen />
      <BackgroundProvider>
        <MusicProvider>
          <ToastProvider>
            <BackgroundRenderer />
            <VisitorTracker />
            <ClickEffect />
            <RadialMenu />
            <MouseTrail />
            <SeasonalEffect />
            <KiraSparkle />
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <ClientWidgets />
          </ToastProvider>
        </MusicProvider>
      </BackgroundProvider>
    </EffectProvider>
  );
}

