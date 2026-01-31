"use client";
import imageCompression from 'browser-image-compression';

import { useState, useEffect, useRef } from "react";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { analyze } from "@/app/actions/analyze";
import { getLeaderboard } from "@/app/actions/leaderboard";
import { RoastCard } from "@/components/RoastCard";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Send, Trophy, Skull, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { nickname, loading: loadingUser } = useAnonymousUser();
  const [activeTab, setActiveTab] = useState<"roast" | "hall">("roast");

  // Roast State
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [roastResult, setRoastResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    if (activeTab === "hall") {
      setLoadingLeaderboard(true);
      getLeaderboard()
        .then(setLeaderboard)
        .finally(() => setLoadingLeaderboard(false));
    }
  }, [activeTab]);



  // ... (inside Home component)

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (file.type.startsWith('image/')) {
        try {
          const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          };

          const compressedFile = await imageCompression(file, options);

          // Store Compressed File
          setImageFiles(prev => [...prev, compressedFile]);

          // Generate Preview (from compressed file)
          const reader = new FileReader();
          reader.onloadend = () => {
            setImages(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(compressedFile);
        } catch (error) {
          console.error("Compression failed:", error);
          // Fallback to original
          setImageFiles(prev => [...prev, file]);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImages(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRoast = async () => {
    if ((!input.trim() && imageFiles.length === 0) || !nickname) return;
    setLoadingRoast(true);
    setRoastResult(null);
    try {
      const formData = new FormData();
      formData.append("text", input);
      formData.append("nickname", nickname);
      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      const result = await analyze(formData);
      setRoastResult(result);
    } catch (e) {
      console.error(e);
      alert("Something went wrong. The AI refused to cook.");
    } finally {
      setLoadingRoast(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-100 via-white to-white text-slate-900 pb-20 overflow-x-hidden selection:bg-[#FF007F] selection:text-white">
      {/* Glossy Header */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-[#FF007F] p-1.5 rounded-lg text-white shadow-lg group-hover:rotate-12 transition-transform">
              <Flame size={20} className="fill-white" />
            </div>
            <h1 className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">COOKED OR NOT</h1>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium bg-white/50 px-4 py-1.5 rounded-full border border-white/50 shadow-sm backdrop-blur-md">
            {loadingUser ? (
              <div className="w-24 h-5 bg-slate-200 animate-pulse rounded" />
            ) : (
              <>
                <span className="text-slate-500">Identity:</span>
                <span className="text-[#FF007F] font-extrabold tracking-tight">{nickname}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-28 px-4 max-w-2xl mx-auto relative z-10">
        {/* Modern Tabs */}
        <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-10 w-full max-w-sm mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab("roast")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === "roast"
                ? "bg-white shadow-lg text-[#FF007F] shadow-[#FF007F]/10 scale-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <Skull size={18} />
            THE ROAST
          </button>
          <button
            onClick={() => setActiveTab("hall")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === "hall"
                ? "bg-white shadow-lg text-[#FF007F] shadow-[#FF007F]/10 scale-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <Trophy size={18} />
            HALL OF FLAME
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "roast" ? (
            <motion.div
              key="roast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {!roastResult ? (
                <div className="space-y-8">
                  <div className="text-center space-y-3 mb-10">
                    <motion.h2
                      className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      AM I COOKED?
                    </motion.h2>
                    <p className="text-slate-500 font-medium text-lg">
                      Drop your shame below. Text, screenshot, or both.
                    </p>
                  </div>

                  {/* Glassy Input Area */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                      "relative bg-white/60 backdrop-blur-xl rounded-3xl border-2 transition-all duration-300 p-1 group shadow-2xl shadow-indigo-500/5",
                      isDragging ? "border-[#FF007F] scale-[1.02] shadow-[#FF007F]/20" : "border-white hover:border-slate-200"
                    )}
                  >
                    <div className="bg-white/50 rounded-[1.4rem] p-4">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Type your situation here or paste/drop an image..."
                        className="w-full h-40 bg-transparent outline-none resize-none text-lg text-slate-800 placeholder:text-slate-400 font-medium"
                      />

                      {/* Image Previews Grid */}
                      {images.length > 0 && (
                        <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                          <AnimatePresence>
                            {images.map((img, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="relative flex-shrink-0 group/img"
                              >
                                <img src={img} alt="upload" className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-md" />
                                <button
                                  onClick={() => removeImage(i)}
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover/img:opacity-100 transition-all scale-90 group-hover/img:scale-100"
                                >
                                  <X size={12} strokeWidth={3} />
                                </button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-slate-200/50 pt-3 mt-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold text-sm transition-colors flex items-center gap-2 group/btn"
                          >
                            <div className="bg-white p-1 rounded-md shadow-sm group-hover/btn:scale-110 transition-transform">
                              <ImageIcon size={14} className="text-[#FF007F]" />
                            </div>
                            ADD IMAGE
                          </button>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                          />
                        </div>
                        <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                          {input.length} chars
                        </div>
                      </div>
                    </div>

                    {/* Drag Overlay */}
                    {isDragging && (
                      <div className="absolute inset-0 bg-[#FF007F]/10 backdrop-blur-sm rounded-3xl flex items-center justify-center border-2 border-[#FF007F] border-dashed z-50 pointer-events-none">
                        <div className="bg-white p-4 rounded-xl shadow-xl flex flex-col items-center gap-2 animate-bounce">
                          <Upload className="text-[#FF007F]" size={32} />
                          <span className="font-bold text-[#FF007F]">DROP IT LIKE IT'S HOT</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRoast}
                    disabled={loadingRoast || (!input.trim() && imageFiles.length === 0)}
                    className="group relative w-full py-5 overflow-hidden bg-gradient-to-br from-[#FF4D9E] via-[#FF007F] to-[#D9006C] text-white rounded-2xl font-black text-2xl tracking-widest shadow-[0_4px_0_0_#99004C,0_10px_20px_rgba(255,0,127,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_#99004C,0_15px_25px_rgba(255,0,127,0.5)] active:translate-y-1 active:shadow-[0_0px_0_0_#99004C,0_0px_0px_rgba(0,0,0,0)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 border-t border-white/30"
                  >
                    {/* Gloss Shine */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-75" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />

                    {loadingRoast ? (
                      <span className="flex items-center gap-2 animate-pulse relative z-10">
                        <Flame className="animate-bounce" size={28} />
                        COOKING...
                      </span>
                    ) : (
                      <>
                        <span className="group-hover:tracking-[0.25em] transition-all relative z-10 drop-shadow-sm">COOK ME</span>
                        <Flame className="group-hover:scale-125 group-hover:rotate-12 transition-transform relative z-10 drop-shadow-sm" size={28} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <RoastCard
                    score={roastResult.score}
                    verdict={roastResult.verdict}
                    roast={roastResult.roast}
                    analysis={roastResult.analysis}
                    nickname={nickname || "Anon"}
                  />
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setRoastResult(null);
                        setInput("");
                        setImages([]);
                        setImageFiles([]);
                      }}
                      className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-black text-lg hover:bg-slate-50 hover:border-[#FF007F]/30 transition-all cursor-pointer shadow-lg shadow-slate-200/50 active:scale-[0.98]"
                    >
                      AGAIN
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="hall"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {loadingLeaderboard ? (
                <div className="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest">LOADING VICTIMS...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-20 text-slate-400">No victims yet. Be the first.</div>
              ) : (
                leaderboard.map((item) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={item.id}
                    className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-[#FF007F]/10 hover:scale-[1.01] transition-all cursor-default"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-sm text-[#FF007F] bg-pink-50 px-2 py-1 rounded-lg">{item.nickname}</span>
                      <span className={cn(
                        "font-black text-xs px-2 py-1 rounded-full",
                        item.score > 50 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      )}>
                        {item.score}% COOKED
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium mb-3 italic">" {item.roast_text} "</p>
                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-slate-200">
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Skull size={12} />
                        Verdict: <span className="font-bold text-slate-600">{item.verdict}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
