'use client';

import { Settings, RotateCcw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/store/workflowStore';
import { useTranslation } from '@/lib/i18n';
import { motion } from 'framer-motion';

interface HeaderProps {
    onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
    const { language, setLanguage, resetProject } = useWorkflowStore();
    const t = useTranslation(language);

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-40 backdrop-blur-xl bg-black/20 border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
                            <span className="text-black font-bold text-sm">AI</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                            {t('appTitle')}
                        </h1>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Language Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                            className="text-slate-400 hover:text-white hover:bg-white/5"
                        >
                            <Globe className="w-4 h-4 mr-1.5" />
                            {language === 'en' ? 'EN' : '中文'}
                        </Button>

                        {/* Reset Project */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetProject}
                            className="text-slate-400 hover:text-white hover:bg-white/5"
                        >
                            <RotateCcw className="w-4 h-4 mr-1.5" />
                            {t('resetProject')}
                        </Button>

                        {/* Settings */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOpenSettings}
                            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-amber-500/50 transition-colors"
                        >
                            <Settings className="w-4 h-4 mr-1.5" />
                            {t('settings')}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
