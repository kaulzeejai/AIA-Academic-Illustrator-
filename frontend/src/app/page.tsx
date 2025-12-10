'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SettingsModal } from '@/components/SettingsModal';
import { Stepper } from '@/components/Stepper';
import { ArchitectStep } from '@/components/steps/ArchitectStep';
import { ReviewStep } from '@/components/steps/ReviewStep';
import { RendererStep } from '@/components/steps/RendererStep';
import { useWorkflowStore } from '@/store/workflowStore';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingPage } from '@/components/LandingPage';
import { SparklesCore } from '@/components/ui/sparkles';

export default function Home() {
  const { currentStep, _hasHydrated } = useWorkflowStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  // Prevent hydration mismatch
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-amber-500/50"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 selection:bg-amber-500/30">
      <AnimatePresence>
        {showLanding && (
          <LandingPage onStart={() => setShowLanding(false)} />
        )}
      </AnimatePresence>

      {/* Main Content (fades in after landing) */}
      {!showLanding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative min-h-screen"
        >
          {/* Background Decor */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
            {/* Tiny ambient particles */}
            <div className="absolute inset-0 opacity-20">
              {/* We can use a simple SVG pattern or CSS here for lightness */}
              <div className="w-full h-full bg-[url('/noise.png')] opacity-20" />
            </div>
          </div>

          <div className="relative z-10">
            <Header onOpenSettings={() => setSettingsOpen(true)} />
            <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
              <Stepper />

              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ArchitectStep />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ReviewStep />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <RendererStep />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </motion.div>
      )}
    </div>
  );
}
