'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Paperclip, FileText, Image as ImageIcon, X, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflowStore } from '@/store/workflowStore';
import { useTranslation } from '@/lib/i18n';
import { generateSchema } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadedFile {
    name: string;
    base64: string;
    type: string;
    preview?: string;
}

// PDF.js will be loaded dynamically
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;
    if (typeof window === 'undefined') return null;

    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    pdfjsLib = pdfjs;
    return pdfjs;
}

async function convertPdfToImages(file: File): Promise<string[]> {
    const pdfjs = await loadPdfJs();
    if (!pdfjs) throw new Error('PDF.js not available');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const scale = 2;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        } as Parameters<typeof page.render>[0]).promise;

        const imageData = canvas.toDataURL('image/png');
        images.push(imageData);
    }

    return images;
}

export function ArchitectStep() {
    const {
        language,
        paperContent,
        setPaperContent,
        setGeneratedSchema,
        setCurrentStep,
        logicConfig,
    } = useWorkflowStore();
    const t = useTranslation(language);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isProcessingFiles, setIsProcessingFiles] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [processedImages, setProcessedImages] = useState<string[]>([]);
    const [pdfJsReady, setPdfJsReady] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadPdfJs().then(() => setPdfJsReady(true)).catch(console.error);
    }, []);

    const handleGenerate = async () => {
        if (!logicConfig.apiKey) {
            toast.error(t('missingApiKey'));
            return;
        }

        if (!paperContent.trim() && processedImages.length === 0) {
            toast.error(language === 'zh' ? '请输入文本或上传文件' : 'Please enter text or upload files');
            return;
        }

        setIsGenerating(true);
        try {
            const contentToSend = paperContent.trim() ||
                (language === 'zh'
                    ? '请分析上传的文档并生成视觉架构。'
                    : 'Please analyze the uploaded document(s) and generate a Visual Schema.');

            const response = await generateSchema(
                contentToSend,
                logicConfig,
                processedImages.length > 0 ? processedImages : undefined
            );
            setGeneratedSchema(response.schema);
            setCurrentStep(2);
            toast.success(language === 'zh' ? '蓝图生成成功！' : 'Blueprint generated successfully!');
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`${t('generationFailed')}: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;

        setIsProcessingFiles(true);
        const newFiles: UploadedFile[] = [];
        const newImages: string[] = [];

        try {
            for (const file of Array.from(files)) {
                if (file.type === 'application/pdf') {
                    toast.info(language === 'zh' ? `正在处理 PDF: ${file.name}...` : `Processing PDF: ${file.name}...`);
                    const pdfImages = await convertPdfToImages(file);

                    newFiles.push({
                        name: file.name,
                        base64: '',
                        type: file.type,
                        preview: pdfImages[0],
                    });

                    newImages.push(...pdfImages);
                    toast.success(language === 'zh'
                        ? `PDF 已转换为 ${pdfImages.length} 张图片`
                        : `PDF converted to ${pdfImages.length} images`);
                } else if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    const imageData = await new Promise<string>((resolve) => {
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(file);
                    });

                    newFiles.push({
                        name: file.name,
                        base64: imageData,
                        type: file.type,
                        preview: imageData,
                    });

                    newImages.push(imageData);
                }
            }

            setUploadedFiles(prev => [...prev, ...newFiles]);
            setProcessedImages(prev => [...prev, ...newImages]);
        } catch (error) {
            console.error('Error processing files:', error);
            toast.error(language === 'zh' ? '文件处理失败' : 'Failed to process files');
        } finally {
            setIsProcessingFiles(false);
        }
    }, [language]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileUpload(e.dataTransfer.files);
    }, [handleFileUpload]);

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        const remainingFiles = uploadedFiles.filter((_, i) => i !== index);
        if (remainingFiles.length === 0) {
            setProcessedImages([]);
        }
    };

    const clearAllFiles = () => {
        setUploadedFiles([]);
        setProcessedImages([]);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
        >
            <div className={`glass-card rounded-2xl p-8 transition-all duration-300 ${isDragging ? 'ring-2 ring-amber-500/50 bg-black/60' : ''}`}>
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-500">
                            {t('step1Title')}
                        </h2>
                        <p className="text-slate-400 mt-2 font-light">
                            {t('step1Desc')}
                        </p>
                    </div>
                    {/* Character Count */}
                    <div className="text-xs text-slate-500 font-mono">
                        {paperContent.length} {language === 'zh' ? '字符' : 'chars'}
                    </div>
                </div>

                {/* Unified Input Area */}
                <div
                    className="relative group"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {/* Text Input */}
                    <Textarea
                        value={paperContent}
                        onChange={(e) => setPaperContent(e.target.value)}
                        placeholder={t('paperPlaceholder')}
                        className="glass-input min-h-[350px] resize-none rounded-xl p-6 font-mono text-sm leading-relaxed pb-20 transition-all focus:ring-2 focus:ring-amber-500/30"
                    />

                    {/* Drag Overlay Hint */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-dashed border-amber-500/50 z-10 pointer-events-none">
                            <div className="text-amber-200 font-medium flex flex-col items-center gap-2">
                                <UploadCloud className="w-10 h-10" />
                                <p>{language === 'zh' ? '释放以上传文件' : 'Drop files to upload'}</p>
                            </div>
                        </div>
                    )}

                    {/* Bottom Toolbar */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-2 bg-black/20 backdrop-blur-md rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            {/* Attachment Button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessingFiles || !pdfJsReady}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-50 group"
                            >
                                {isProcessingFiles ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                ) : (
                                    <Paperclip className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                )}
                                {language === 'zh' ? '添加附件' : 'Add Attachment'}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
                                multiple
                                className="hidden"
                                onChange={(e) => handleFileUpload(e.target.files)}
                            />

                            {/* Image count */}
                            {processedImages.length > 0 && (
                                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 font-medium">
                                    {processedImages.length} {language === 'zh' ? '张图片' : 'images'}
                                </span>
                            )}
                        </div>

                        <div className="text-xs text-slate-500 pr-2 hidden sm:block">
                            {language === 'zh' ? '支持 PDF / PNG / JPG' : 'Supports PDF / PNG / JPG'}
                        </div>
                    </div>
                </div>

                {/* Uploaded Files */}
                <AnimatePresence>
                    {uploadedFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    {language === 'zh' ? '已添加文件' : 'Attached Files'}
                                </p>
                                <button
                                    onClick={clearAllFiles}
                                    className="text-xs px-2 py-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"
                                >
                                    {language === 'zh' ? '清除全部' : 'Clear all'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {uploadedFiles.map((file, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative group flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors cursor-default"
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 flex items-center justify-center flex-shrink-0">
                                            {file.preview ? (
                                                <img
                                                    src={file.preview}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : file.type.includes('pdf') ? (
                                                <FileText className="w-5 h-5 text-red-400" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5 text-blue-400" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-300 truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                {(file.base64.length / 1024 / 1.33).toFixed(1)} KB
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => removeFile(index)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md transform scale-90 group-hover:scale-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Generate Button */}
                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || isProcessingFiles || (!paperContent.trim() && processedImages.length === 0)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold px-8 py-6 rounded-xl shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {t('generating')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                {t('generateBlueprint')}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Hint Text */}
            <div className="mt-4 text-center">
                <p className="text-xs text-slate-500/80">
                    {language === 'zh'
                        ? '💡 AI 将基于您的输入生成符合 NeurIPS / CVPR 标准的学术图表'
                        : '💡 AI will generate academic diagrams following NeurIPS / CVPR standards based on your input'}
                </p>
            </div>
        </motion.div>
    );
}
