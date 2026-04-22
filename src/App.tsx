/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, ChangeEvent } from "react";
import { GoogleGenAI } from "@google/genai";
import { Upload, Wand2, RefreshCcw, Search, Image as ImageIcon, Sparkles, Loader2, Download, Eye, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PRESET_STYLES = [
  { 
    id: "studio", 
    name: "質感工作室", 
    prompt: "Identify the main product. Remove the background and place the product in a minimalist studio setting with soft professional lighting, subtle shadows, and a clean solid-colored background. Professional product photography.", 
    icon: "📸" 
  },
  { 
    id: "luxury", 
    name: "大理石奢華", 
    prompt: "Identify the main product. Remove the background and place the product on a polished white marble countertop with elegant soft lighting and subtle golden accents in the background. High-end luxury aesthetic.", 
    icon: "💎" 
  },
  { 
    id: "nature", 
    name: "大自然背景", 
    prompt: "Identify the main product. Remove the background and place the product on a weathered wooden surface surrounded by soft green leaves and dappled sunlight. Organic and healthy lifestyle photography.", 
    icon: "🌿" 
  },
  { 
    id: "urban", 
    name: "都市潮流", 
    prompt: "Identify the main product. Remove the background and place the product in a trendy urban lifestyle setting with industrial concrete textures, soft daylight shadows, and a modern city cafe vibe.", 
    icon: "🏙️" 
  },
  { 
    id: "summer", 
    name: "清新夏日", 
    prompt: "Identify the main product. Remove the background and place the product on a sandy beach or wooden deck with bright tropical sunlight, deep shadows, and a vacation resort atmosphere.", 
    icon: "☀️" 
  },
];

const PRO_MODIFIERS = [
  { label: "電影級光影", value: "Cinematic lighting, dramatic shadows" },
  { label: "背景虛化", value: "Bokeh, soft depth of field" },
  { label: "細節強化", value: "8k resolution, hyper-realistic, macro detail" },
  { label: "景深感", value: "Volumetric fog, atmospheric perspective" },
  { label: "黃昏金光", value: "Golden hour, warm directional light" },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(PRESET_STYLES[0].id);
  const [customStyle, setCustomStyle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setTransformedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const transformImage = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setError(null);

    // 2026 年建議的備選模型清單
    const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}...`);
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const style = selectedStyleId === "custom" 
          ? `A professional marketing photo. Place the product in a setting described as: ${customStyle}.`
          : PRESET_STYLES.find(s => s.id === selectedStyleId)?.prompt;

        const base64Data = selectedImage.split(",")[1];
        const mimeType = selectedImage.split(";")[0].split(":")[1];

        const response = await ai.models.generateContent({
          model: modelName, 
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: `TASK: Background Replacement.
1. Identify the main product in this image.
2. KEEP the product's original appearance, colors, and textures exactly as they are.
3. REMOVE everything else (the current background).
4. GENERATE a new background based on this style: "${style}".
5. Ensure the product lighting and shadows blend naturally with the new environment.
6. OUTPUT the final merged image directly as an image part.`,
              },
            ],
          },
        });

        let foundImage = false;
        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              setTransformedImage(`data:image/png;base64,${part.inlineData.data}`);
              foundImage = true;
              break;
            }
          }
        }

        if (foundImage) {
          console.log(`Successfully used model: ${modelName}`);
          setIsProcessing(false);
          return; // 成功後直接結束
        }

        const textReason = response.candidates?.[0]?.content?.parts?.[0]?.text;
        throw new Error(textReason || "Model failed to return image data.");

      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;
        // 如果是 429 或 404，迴圈會繼續嘗試下一個模型
      }
    }

    // 如果所有模型都嘗試失敗
    console.error("All models failed:", lastError);
    setError(lastError?.message || "轉換失敗，請確認 API Key 權限或稍後再試。");
    setIsProcessing(false);
  };

  const downloadImage = () => {
    if (!transformedImage) return;
    const link = document.createElement("a");
    link.href = transformedImage;
    link.download = `product-morph-${Date.now()}.png`;
    link.click();
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const addModifier = (mod: string) => {
    if (selectedStyleId !== "custom") setSelectedStyleId("custom");
    setCustomStyle(prev => prev ? `${prev}, ${mod}` : mod);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans selection:bg-[#8B5CF6] selection:text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0A0A0B] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20">
            P
          </div>
          <h1 className="text-xl font-semibold tracking-tight">ProductMorph AI</h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-[#A1A1AA] hidden md:flex">
          <p className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-3 py-1 rounded-full border border-violet-400/20">
            去背 & 場景合成模式
          </p>
          <div className="h-8 w-8 rounded-full bg-[#18181B] border border-white/10"></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Content: Comparison Display */}
        <section className="flex-1 p-8 flex flex-col gap-6 items-center justify-start bg-[radial-gradient(circle_at_50%_50%,rgba(35,35,40,1)_0%,rgba(10,10,11,1)_100%)] min-h-[500px] overflow-y-auto">
          
          <div className="w-full max-w-5xl flex flex-col items-center gap-10 mt-4">
             <AnimatePresence mode="wait">
               {transformedImage ? (
                 <motion.div 
                   key="comparison"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="w-full grid md:grid-cols-2 gap-4 lg:gap-8"
                 >
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
                        <Eye className="w-3 h-3" /> 原始圖片 (Before)
                      </div>
                      <div className="aspect-square rounded-2xl overflow-hidden glass border border-white/5 bg-black/20 relative">
                        <img src={selectedImage!} alt="Original" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                   </div>

                   <div className="space-y-3 relative">
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-widest px-1">
                        <Sparkles className="w-3 h-3" /> 廣告形象照 (After)
                      </div>
                      <div className="aspect-square rounded-2xl overflow-hidden glass border border-violet-500/30 bg-black/40 shadow-2xl shadow-violet-500/10 group relative">
                        <img src={transformedImage} alt="Result" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                           <button onClick={downloadImage} className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-violet-500/20 transition-all active:scale-95">
                             <Download className="w-5 h-5" /> 下載廣告圖
                           </button>
                           <button onClick={() => setTransformedImage(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold flex items-center gap-2">
                             <RefreshCcw className="w-5 h-5" /> 重新選擇場景
                           </button>
                        </div>
                      </div>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-1/2 -left-6 lg:-left-10 -translate-y-1/2 w-12 h-12 bg-violet-600 rounded-full hidden md:flex items-center justify-center border-4 border-[#0A0A0B] shadow-lg z-10"
                      >
                         <ArrowRight className="w-6 h-6 text-white" />
                      </motion.div>
                   </div>
                 </motion.div>
               ) : (
                 <motion.div
                   key="uploader"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="w-full max-w-2xl aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-violet-500/50 transition-colors bg-[#18181B]/30 relative overflow-hidden"
                 >
                   {isProcessing && (
                     <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md">
                        <div className="relative">
                          <motion.div 
                            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-violet-500 rounded-full blur-3xl opacity-30"
                          />
                          <div className="w-20 h-20 border-t-2 border-violet-500 rounded-full animate-spin flex items-center justify-center">
                             <Wand2 className="w-8 h-8 text-violet-400 animate-pulse" />
                          </div>
                        </div>
                        <div className="mt-8 space-y-2 text-center px-12">
                          <p className="font-bold text-white text-lg tracking-tight">正在為您的產品建立專屬場景...</p>
                          <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">Identifying product boundaries • Synthesizing shadows • Re-lighting</p>
                        </div>
                     </div>
                   )}
                   
                   {selectedImage ? (
                     <div className="w-full h-full relative group">
                        <img src={selectedImage} alt="Input" className="w-full h-full object-contain opacity-80" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={triggerUpload} className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold border border-white/20">
                             換一張產品照
                           </button>
                        </div>
                     </div>
                   ) : (
                     <>
                        <div onClick={triggerUpload} className="w-16 h-16 rounded-full bg-[#18181B] flex items-center justify-center text-zinc-500 group-hover:text-violet-400 transition-colors cursor-pointer border border-white/5">
                           <Upload className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                          <p onClick={triggerUpload} className="text-lg font-medium text-[#E4E4E7] cursor-pointer hover:text-white transition-colors">點擊或拖放產品照片至此</p>
                          <p className="text-sm text-zinc-500 mt-1 uppercase tracking-wider text-[10px]">建議背景乾淨、光線充足</p>
                        </div>
                     </>
                   )}
                   <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Pro Tips Section */}
             <div className="w-full max-w-5xl grid sm:grid-cols-3 gap-4 pb-12">
                <div className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-3">
                   <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Sparkles className="w-4 h-4" /></div>
                   <h4 className="text-sm font-bold text-white">指令技巧</h4>
                   <p className="text-xs text-zinc-400 leading-relaxed">描述「場景材質」與「光影」效果最佳。例如：「木質桌面、黃昏光影」。</p>
                </div>
                <div className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-3">
                   <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400"><ImageIcon className="w-4 h-4" /></div>
                   <h4 className="text-sm font-bold text-white">圖片選擇</h4>
                   <p className="text-xs text-zinc-400 leading-relaxed">主控光線與解析度。主體越清晰，AI 生成的陰影與光影融合度就越高。</p>
                </div>
                <div className="glass p-5 rounded-2xl border-white/5 flex flex-col gap-3">
                   <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400"><Search className="w-4 h-4" /></div>
                   <h4 className="text-sm font-bold text-white">專業修飾詞</h4>
                   <p className="text-xs text-zinc-400 leading-relaxed">善用側邊欄的「專業修飾詞」標籤，可大幅強化生成成果的商業質感。</p>
                </div>
             </div>
          </div>

          {!transformedImage && (
            <div className="flex gap-4 w-full max-w-2xl justify-center">
              <div className="px-4 py-2 rounded-full glass text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider backdrop-blur-md">行銷優化: 已開啟</div>
              <div className="px-4 py-2 rounded-full glass text-[10px] font-mono text-zinc-600 uppercase tracking-wider backdrop-blur-md">自動去背: 使用中</div>
            </div>
          )}
        </section>

        {/* Sidebar: Controls */}
        <aside className="w-full lg:w-80 glass border-t lg:border-t-0 lg:border-l border-white/10 p-6 flex flex-col gap-8 bg-[#18181B]/40 overflow-y-auto backdrop-blur-xl shrink-0">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest opacity-60">行銷應用場景</h3>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_STYLES.map((style) => (
                <div 
                  key={style.id}
                  onClick={() => { setSelectedStyleId(style.id); setCustomStyle(""); }}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border border-white/5 hover:border-violet-500/50 hover:bg-violet-500/10 ${
                    selectedStyleId === style.id ? "border-violet-500 bg-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]" : ""
                  }`}
                >
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform shrink-0">
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-white">{style.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                      {style.id === "studio" && "IG/FB 最愛極簡"}
                      {style.id === "luxury" && "提升產品溢價感"}
                      {style.id === "nature" && "健康/有機第一首選"}
                      {style.id === "urban" && "現代生活生活感"}
                      {style.id === "summer" && "夏日促銷必備"}
                    </p>
                  </div>
                </div>
              ))}
              <div 
                onClick={() => setSelectedStyleId("custom")}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border border-white/5 hover:border-violet-500/50 hover:bg-violet-500/10 ${
                  selectedStyleId === "custom" ? "border-violet-500 bg-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]" : ""
                }`}
              >
                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform shrink-0">
                  🎨
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-white">自定義描述</p>
                  <p className="text-[10px] text-zinc-500">輸入特定品牌氛圍</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest opacity-60">場景細節描述</h3>
            <div className="relative">
              <textarea 
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                disabled={selectedStyleId !== "custom"}
                className={`w-full h-24 bg-[#0A0A0B]/50 border border-white/5 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50 placeholder:text-zinc-700 resize-none transition-all ${
                  selectedStyleId !== "custom" ? "opacity-30 grayscale pointer-events-none" : ""
                }`} 
                placeholder="例如：放在充滿巴黎街頭風情的窗台..."
              />
              {selectedStyleId === "custom" && !customStyle && (
                 <Search className="absolute right-3 bottom-3 w-4 h-4 text-zinc-800" />
              )}
            </div>

            {/* Keyword Helper Tags */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">加入專業修飾詞 (一鍵優化)</h4>
              <div className="flex flex-wrap gap-2">
                {PRO_MODIFIERS.map((mod) => (
                  <button
                    key={mod.label}
                    onClick={() => addModifier(mod.value)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-[10px] text-zinc-300 transition-colors"
                  >
                    + {mod.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={transformImage}
              disabled={!selectedImage || isProcessing || (selectedStyleId === "custom" && !customStyle)}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                !selectedImage || isProcessing 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5" 
                  : "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/40 active:scale-[0.98]"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成廣告圖中...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  轉換為廣告形象照
                </>
              )}
            </button>
            {error && <p className="text-[10px] text-red-400 text-center font-medium animate-pulse">{error}</p>}
          </div>
        </aside>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-white/5 flex items-center justify-between px-8 text-[10px] text-zinc-600 uppercase tracking-widest bg-[#0A0A0B]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div> 引擎狀態: 已連線</span>
          <span>© 2026 PRODUCTMORPH AI</span>
        </div>
        <div className="hidden sm:block">專為電商、廣告行銷打造</div>
      </footer>

      <style>{`
        .glass {
          background: rgba(24, 24, 27, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        ::-webkit-scrollbar {
          width: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
