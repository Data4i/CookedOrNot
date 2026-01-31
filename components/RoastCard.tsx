"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";
import { toBlob } from "html-to-image";

interface RoastCardProps {
    score: number;
    verdict: string;
    roast: string;
    analysis: string;
    nickname: string;
}

export function RoastCard({ score, verdict, roast, analysis, nickname }: RoastCardProps) {
    const isCooked = score > 50;
    const colorClass = isCooked ? "text-red-600" : "text-green-600";
    const bgClass = isCooked ? "bg-red-50" : "bg-green-50";
    const borderClass = isCooked ? "border-red-200" : "border-green-200";

    const handleShare = async () => {
        const element = document.getElementById("roast-card-content");
        if (element) {
            try {
                // html-to-image handles modern CSS (lab/lch/oklch) better
                const blob = await toBlob(element, {
                    backgroundColor: "#ffffff",
                    pixelRatio: 3, // Higher res
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    style: {
                        margin: '0',
                        transform: 'none', // Prevent interference from potential parent transforms
                        maxWidth: 'none',
                        maxHeight: 'none'
                    }
                });

                if (blob) {
                    const file = new File([blob], "roast_card.png", { type: "image/png" });

                    if (navigator.share) {
                        try {
                            await navigator.share({
                                files: [file],
                                // title required by some implementations, but text removed as requested
                                title: 'Cooked Or Not Result'
                            });
                        } catch (e) {
                            console.log("Share skipped", e);
                        }
                    } else {
                        // Fallback download
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "roast_card.png";
                        a.click();
                    }
                }
            } catch (e) {
                console.error("Capture failed", e);
            }
        }
    };

    return (
        <div className="space-y-4">
            <motion.div
                id="roast-card-content"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className={cn(
                    "w-full max-w-md mx-auto p-6 rounded-xl border-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white",
                    borderClass
                )}
            >
                <div className="flex justify-between items-start mb-4 border-b-2 border-dashed border-gray-200 pb-4">
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tighter">Report Card</h2>
                        <p className="text-sm text-gray-500 font-mono">{nickname}</p>
                    </div>
                    <div className={cn("text-4xl font-black rotate-12", colorClass)}>
                        {score}%
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Verdict</h3>
                        <div className={cn("text-3xl font-black uppercase italic tracking-tighter", colorClass)}>
                            {verdict}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Roast</h3>
                        <p className="text-lg font-medium leading-snug">{roast}</p>
                    </div>

                    <div className={cn("p-3 rounded-lg text-sm border-l-4", bgClass, borderClass)}>
                        <span className="font-bold">Analysis:</span> {analysis}
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono">
                    <span>COOKED OR NOT AI</span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
            </motion.div>

            <button
                onClick={handleShare}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
                <Share2 size={18} />
                SHARE DISGRACE
            </button>
        </div>
    );
}
