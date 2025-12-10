'use client';

import { useWorkflowStore } from '@/store/workflowStore';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const steps = [
    { step: 1 as const, titleKey: 'step1Title', descKey: 'step1Desc' },
    { step: 2 as const, titleKey: 'step2Title', descKey: 'step2Desc' },
    { step: 3 as const, titleKey: 'step3Title', descKey: 'step3Desc' },
];

export function Stepper() {
    const { language, currentStep, setCurrentStep, generatedSchema } = useWorkflowStore();
    const t = useTranslation(language);

    const canNavigateTo = (step: 1 | 2 | 3) => {
        if (step === 1) return true;
        if (step === 2) return !!generatedSchema;
        if (step === 3) return !!generatedSchema;
        return false;
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-8">
            <div className="relative flex items-center justify-between">
                {/* Connecting Line Background */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 rounded-full -z-10" />

                {steps.map((item, index) => {
                    const isActive = currentStep === item.step;
                    const isCompleted = currentStep > item.step;

                    return (
                        <div key={item.step} className="relative flex-1 flex flex-col items-center">
                            {/* Connecting Line Progress (only for first 2 segments) */}
                            {index < steps.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-full h-0.5 -z-10">
                                    <div
                                        className={`h-full transition-all duration-500 ease-in-out ${isCompleted ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-transparent'
                                            }`}
                                    />
                                </div>
                            )}

                            {/* Step indicator */}
                            <button
                                onClick={() => canNavigateTo(item.step) && setCurrentStep(item.step)}
                                disabled={!canNavigateTo(item.step)}
                                className={`group relative flex flex-col items-center ${canNavigateTo(item.step) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                            >
                                {/* Circle */}
                                <motion.div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${isActive
                                            ? 'bg-black border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                            : isCompleted
                                                ? 'bg-amber-500 border-amber-500 text-black'
                                                : 'bg-black border-white/20 text-slate-500 group-hover:border-white/40'
                                        }`}
                                    whileHover={canNavigateTo(item.step) ? { scale: 1.1 } : {}}
                                    whileTap={canNavigateTo(item.step) ? { scale: 0.9 } : {}}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="font-bold text-sm">{item.step}</span>
                                    )}
                                </motion.div>

                                {/* Label */}
                                <div className="mt-4 text-center">
                                    <p
                                        className={`font-medium text-sm transition-colors ${isActive ? 'text-amber-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'
                                            }`}
                                    >
                                        {t(item.titleKey as any)}
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-light">
                                        {t(item.descKey as any)}
                                    </p>
                                </div>
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
