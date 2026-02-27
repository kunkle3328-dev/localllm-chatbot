
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChatSession, Message, LocalModel, 
  AppConfig, DeviceStats, ReasoningStep, PerformanceMode, TaskType, MemoryEntry, LMStudioModel
} from './types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, STORAGE_KEYS, APP_NAME } from './constants';
import { storageService } from './services/storageService';
import { localInference } from './services/localInference';
import { lmStudioService } from './services/lmStudioService';
import { initLLM } from './native/LocalLLM';
import { webllmService, WebLLMInitProgress } from './services/webllmService';
import { 
  SendIcon, MenuIcon, PlusIcon, SettingsIcon, 
  TrashIcon, BotIcon, MicIcon, SpeakerIcon
} from './components/Icons';
import { MemoryPanel } from './app/components/MemoryPanel';
import { SplashScreen } from './components/SplashScreen';
import { AnimatedLogo } from './components/AnimatedLogo';

const App: React.FC = () => {
  const [booting, setBooting] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({ 
    ramUsage: 1.2, totalRam: 12, temp: 34, npuLoad: 4, batteryLevel: 98 
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSteps, setActiveSteps] = useState<ReasoningStep[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [currentTps, setCurrentTps] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [lmModels, setLmModels] = useState<LMStudioModel[]>([]);
  const [webllmProgress, setWebllmProgress] = useState<WebLLMInitProgress | null>(null);
  const [webllmLoading, setWebllmLoading] = useState(false);
  const [webllmReady, setWebllmReady] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentSession = sessions.find(s => s.id === currentSessionId);

  useEffect(() => {
    // Initialize Local Engine
    initLLM("/data/data/com.nexus/models/qwen2.5-coder-7b.gguf");

    // Neural Node Initialization Phase
    const loaded = storageService.loadSessions();
    if (loaded.length > 0) {
      setSessions(loaded);
      setCurrentSessionId(loaded[0].id);
    } else createNewSession();
    
    const loadedConfig = storageService.loadConfig();
    if (loadedConfig) setConfig(loadedConfig);

    const loadedMemories = localStorage.getItem(STORAGE_KEYS.COGNITIVE_MEMORY);
    if (loadedMemories) setMemories(JSON.parse(loadedMemories));
  }, []);

  const isWebGPUSupported = typeof (navigator as any).gpu !== 'undefined';

  const loadWebLLMModel = useCallback(async () => {
    try {
      const modelId = config.webllm?.selectedModel;
      if (!modelId) {
        alert('Pick a model first.');
        return;
      }
      if (!isWebGPUSupported) {
        alert('WebGPU is not available in this browser. Try updating Chrome, enabling WebGPU flags, or use a different device/browser.');
        return;
      }
      setWebllmLoading(true);
      setWebllmReady(false);
      setWebllmProgress({ text: 'Starting…', progress: 0 });
      await webllmService.ensureLoaded(modelId, (p) => setWebllmProgress(p));
      setWebllmReady(true);
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || 'Failed to load model.');
    } finally {
      setWebllmLoading(false);
    }
  }, [config.webllm?.selectedModel, isWebGPUSupported]);

  const refreshLmStudioModels = useCallback(async () => {
    try {
      const lm = config.lmStudio;
      if (!lm?.baseUrl) throw new Error('Set LM Studio base URL first.');
      const models = await lmStudioService.fetchModels(lm);
      setLmModels(models);
      // Auto-select first model if none selected
      if (!lm.selectedModel && models.length > 0) {
        setConfig(prev => ({
          ...prev,
          lmStudio: { ...(prev.lmStudio as any), selectedModel: models[0].id }
        }));
      }
    } catch (e) {
      console.error(e);
      alert((e as any)?.message || 'Failed to fetch LM Studio models.');
    }
  }, [config.lmStudio]);

  const handleFinishBooting = useCallback(() => {
    setBooting(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const multiplier = config.profile === 'Performance' ? 1.5 : config.profile === 'Eco' ? 0.5 : 1;
      setDeviceStats(prev => ({
        ...prev,
        ramUsage: +(prev.ramUsage + (isStreaming ? 0.4 * multiplier : -0.1)).toFixed(2),
        temp: isStreaming ? Math.min(prev.temp + 0.5 * multiplier, 55) : Math.max(prev.temp - 0.2, 30),
        npuLoad: isStreaming ? 75 * multiplier : 2,
        batteryLevel: Math.max(0, prev.batteryLevel - (isStreaming ? 0.03 * multiplier : 0.001))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isStreaming, config.profile]);

  useEffect(() => { storageService.saveSessions(sessions); }, [sessions]);
  useEffect(() => { storageService.saveConfig(config); }, [config]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentSession?.messages, isStreaming, activeSteps]);

  const createNewSession = () => {
    const s: ChatSession = {
      id: Date.now().toString(),
      title: 'Nexus Node Alpha',
      messages: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      modelId: config.activeModelId
    };
    setSessions(prev => [s, ...prev]);
    setCurrentSessionId(s.id);
    setShowSidebar(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const taskType = localInference.classifyTask(input);
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: input, 
      timestamp: Date.now(),
      taskType
    };
    
    setSessions(prev => prev.map(s => s.id === currentSessionId ? {
      ...s, messages: [...s.messages, userMsg],
      title: s.messages.length === 0 ? input.slice(0, 24) : s.title
    } : s));

    setInput('');
    setIsStreaming(true);
    setActiveSteps([]);

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), reasoningSteps: [] };
    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s));

    await localInference.streamResponse(
      config,
      [...(currentSession?.messages || []), userMsg],
      (newSteps) => setActiveSteps(newSteps),
      (token, tps) => {
        setCurrentTps(tps);
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const msgs = [...s.messages];
            const idx = msgs.findIndex(m => m.id === assistantId);
            if (idx !== -1) msgs[idx] = { ...msgs[idx], content: msgs[idx].content + token, tokensPerSec: tps };
            return { ...s, messages: msgs };
          }
          return s;
        }));
      },
      (full, sources, toolCalls) => {
        setIsStreaming(false);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? {
          ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, sources, toolCalls, reasoningSteps: [], isPersonalized: sources.length > 0 } : m)
        } : s));
        
        const updatedMemories = localStorage.getItem(STORAGE_KEYS.COGNITIVE_MEMORY);
        if (updatedMemories) setMemories(JSON.parse(updatedMemories));
        
        if (config.voiceEnabled) speak(full);
      },
      (err) => { setIsStreaming(false); console.error(err); }
    );
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem(STORAGE_KEYS.COGNITIVE_MEMORY, JSON.stringify(updated));
  };

  const pinMemory = (id: string) => {
    const updated = memories.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m);
    setMemories(updated);
    localStorage.setItem(STORAGE_KEYS.COGNITIVE_MEMORY, JSON.stringify(updated));
  };

  const toggleListening = () => {
    if (isListening) setIsListening(false);
    else {
      setIsListening(true);
      setTimeout(() => {
        if (isListening) setInput("Analyze my Nexus workspace.");
        setIsListening(false);
      }, 1500);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 150));
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderContent = (content: string) => {
    const blocks = content.split(/(\n\n|```[\s\S]*?```)/g);
    return blocks.map((block, i) => {
      const trimmed = block.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('```')) {
        const lines = trimmed.split('\n');
        const lang = lines[0].replace('```', '').trim() || 'code';
        const code = lines.slice(1, -1).join('\n');
        return (
          <div key={i} className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md font-mono shadow-xl">
             <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lang}</span>
                <button onClick={() => navigator.clipboard.writeText(code)} className="text-[9px] text-indigo-400 font-black uppercase hover:text-white transition-colors">Copy Node</button>
             </div>
             <div className="p-4 overflow-x-auto no-scrollbar">
                <pre className="text-[11px] leading-relaxed text-indigo-100/90 whitespace-pre">{code}</pre>
             </div>
          </div>
        );
      }
      return <p key={i} className="mb-4 last:mb-0 leading-[1.65] font-medium text-[13px] text-slate-200 whitespace-pre-wrap">{trimmed}</p>;
    });
  };

  if (booting) {
    return <SplashScreen duration={5000} onFinish={handleFinishBooting} />;
  }

  return (
    <div className="flex h-full w-full max-w-md mx-auto bg-[#07070a] text-slate-100 overflow-hidden relative font-sans transition-all duration-700 ease-out opacity-0 animate-[nexus-fade-in_1s_forwards]">
      <style>{`
        @keyframes nexus-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {/* Background Cinematic Lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600 rounded-full blur-[140px]" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-600 rounded-full blur-[140px]" />
      </div>

      {/* Sidebar Navigation */}
      {(showSidebar || showMemory) && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={() => { setShowSidebar(false); setShowMemory(false); }} />}
      
      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#0d0d14]/95 backdrop-blur-2xl z-50 transform transition-transform duration-700 cubic-bezier(0.19, 1, 0.22, 1) ${showSidebar ? 'translate-x-0' : '-translate-x-full'} border-r border-white/10 shadow-[30px_0_60px_rgba(0,0,0,0.5)]`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <AnimatedLogo className="w-10 h-10" />
            <div className="flex flex-col">
               <h2 className="text-md font-black tracking-tighter italic text-white uppercase leading-none">{APP_NAME}</h2>
               <span className="text-[8px] font-black text-slate-500 tracking-[0.2em] mt-1.5 uppercase">Neural Node v4.5</span>
            </div>
          </div>
          
          <button onClick={createNewSession} className="flex items-center justify-center gap-4 w-full p-4 mb-8 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black shadow-2xl shadow-indigo-600/30 active:scale-[0.96] transition-all text-xs uppercase tracking-widest">
            <PlusIcon className="w-4 h-4" /> Initialize Link
          </button>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1 mb-2">Workspace Hub</h3>
            {sessions.map(s => (
              <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setShowSidebar(false); }} className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-lg' : 'hover:bg-white/5 border-transparent'}`}>
                <span className="truncate flex-1 text-[12px] font-bold tracking-tight">{s.title || 'Nexus Stream'}</span>
                <TrashIcon className="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all" onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); }} />
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-3 pt-6 border-t border-white/5">
            <button onClick={() => { setShowMemory(true); setShowSidebar(false); }} className="flex items-center gap-4 p-4 w-full rounded-2xl hover:bg-white/5 transition-all group">
              <BotIcon className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" /> <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Cognitive Vault</span>
            </button>
            <button onClick={() => { setShowSettings(true); setShowSidebar(false); }} className="flex items-center gap-4 p-4 w-full rounded-2xl hover:bg-white/5 transition-all group">
              <SettingsIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 transition-colors" /> <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Core Matrix</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Memory Panel overlay */}
      <aside className={`fixed left-0 top-0 h-full w-80 bg-[#0d0d14]/98 backdrop-blur-3xl z-[60] transform transition-transform duration-700 cubic-bezier(0.19, 1, 0.22, 1) ${showMemory ? 'translate-x-0' : '-translate-x-full'} border-r border-white/10 shadow-[30px_0_60px_rgba(0,0,0,0.5)]`}>
        <MemoryPanel memories={memories} onDelete={deleteMemory} onPin={pinMemory} onClose={() => setShowMemory(false)} />
      </aside>

      {/* Main Experience */}
      <main className="flex flex-col flex-1 h-full w-full relative z-10 shadow-inner">
        <header className="px-5 py-4 border-b border-white/10 bg-[#07070a]/80 backdrop-blur-2xl sticky top-0 z-30 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-2xl transition-all active:scale-90"><MenuIcon className="w-6 h-6 text-slate-300" /></button>
            <div className="flex flex-col">
              <h1 className="text-[12px] font-black tracking-widest text-white uppercase truncate max-w-[150px] italic">{currentSession?.title || 'NEXUS NODE'}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                 <span className={`w-1.5 h-1.5 rounded-full ${deviceStats.temp > 50 ? 'bg-amber-500' : 'bg-cyan-500 animate-pulse'} shadow-[0_0_8px_rgba(34,211,238,0.6)]`} />
                 <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">{config.profile} Matrix Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right flex flex-col items-end mr-2">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural Link</span>
                <span className="text-[11px] font-black text-indigo-400 tabular-nums">{isStreaming ? currentTps : '0.0'} TPS</span>
             </div>
             <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-2xl transition-all active:scale-90"><SettingsIcon className="w-5 h-5 text-slate-400" /></button>
          </div>
        </header>

        {/* Chat Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-8 space-y-12 no-scrollbar pb-40 scroll-smooth">
          {currentSession?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-12 py-16 animate-in zoom-in-95 duration-[2000ms] cubic-bezier(0.19, 1, 0.22, 1)">
              <div className="relative">
                <AnimatedLogo className="w-28 h-28" />
                <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full animate-pulse" />
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-[0.3em] text-white uppercase italic drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{APP_NAME}</h2>
                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.5em] leading-relaxed max-w-[300px] mx-auto opacity-70">Personal AI Node | local ARM64 Inference | Cinematic UX</p>
              </div>
              <div className="flex flex-col gap-4 w-full max-w-[260px]">
                {['Architect Nexus Node', 'Audit System Identity', 'Generate Logic Stream'].map(h => (
                  <button key={h} onClick={() => setInput(h)} className="p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-left flex items-center justify-between active:scale-[0.97] group shadow-xl">
                    {h} <PlusIcon className="w-4 h-4 text-indigo-500 group-hover:scale-125 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentSession?.messages.map(m => (
            <div key={m.id} className={`flex w-full ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-700 cubic-bezier(0.23, 1, 0.32, 1)`}>
              <div className={`flex flex-col gap-4 max-w-[96%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.role === 'user' && m.taskType && (
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-indigo-600/15 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">{m.taskType} NODE</span>
                )}
                
                {m.role === 'assistant' && activeSteps.length > 0 && m.id === currentSession?.messages[currentSession?.messages.length - 1].id && (
                  <div className="flex flex-wrap gap-2.5 mb-2">
                    {activeSteps.map((s, idx) => (
                      <div key={idx} className={`flex items-center gap-2.5 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 ${
                        s.status === 'active' ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.5)] animate-pulse' : 
                        s.status === 'complete' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 
                        'bg-white/5 text-slate-700 border-transparent opacity-50'
                      }`}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                )}

                <div className={`p-6 rounded-[2.5rem] text-[14px] leading-[1.65] shadow-2xl transition-all duration-700 ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-800 text-white rounded-tr-none font-bold' 
                    : 'bg-[#12121c]/90 backdrop-blur-3xl text-slate-100 rounded-tl-none border border-white/10'
                }`}>
                  {renderContent(m.content || '')}
                  {isStreaming && !m.content && m.role === 'assistant' && (
                    <div className="flex gap-2.5 py-2.5"><div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div>
                  )}
                </div>

                {m.toolCalls && m.toolCalls.length > 0 && (
                  <div className="mt-2 w-full flex flex-col gap-4">
                    {m.toolCalls.map((tc, idx) => (
                      <div key={idx} className="bg-cyan-600/10 border border-cyan-500/30 p-5 rounded-[2rem] backdrop-blur-xl animate-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Neural Tool: {tc.name}</span>
                          <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/20">Synced</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 italic leading-relaxed">System Result: {tc.result}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Interface */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#07070a] via-[#07070a]/95 to-transparent z-40">
          <div className="bg-[#1c1c2b]/90 backdrop-blur-3xl p-3.5 rounded-[2.5rem] border border-white/15 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex items-end gap-4 focus-within:ring-2 ring-indigo-500/50 transition-all duration-700">
            <button onClick={toggleListening} className={`p-3.5 rounded-full transition-all duration-500 ${isListening ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'hover:bg-white/10 text-slate-400'}`}>
              <MicIcon className="w-6 h-6" active={isListening} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isStreaming ? "Neural processing..." : "Neural prompt link..."}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] p-2.5 no-scrollbar resize-none max-h-36 min-h-[44px] placeholder:text-slate-700 font-bold text-white transition-all"
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button onClick={handleSend} disabled={!input.trim() || isStreaming} className={`p-4 rounded-full transition-all duration-500 flex items-center justify-center ${!input.trim() || isStreaming ? 'bg-white/5 text-slate-800' : 'bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 text-white shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-90'}`}>
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setShowSettings(false)} />
          <div className="relative bg-[#0d0d14] w-full max-w-sm rounded-t-[3.5rem] sm:rounded-[3.5rem] p-10 space-y-10 border-t border-white/15 animate-in slide-in-from-bottom-96 duration-1000 cubic-bezier(0.19, 1, 0.22, 1) shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-xl font-black tracking-tighter text-white uppercase italic tracking-widest">Core Matrix</h2>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Neural System Governance</span>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-slate-300 hover:text-white transition-all active:scale-90">×</button>
            </div>
            
            <div className="space-y-8">
              {/* Provider */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-1">Inference Provider</label>
                <div className="grid grid-cols-4 bg-white/5 p-2 rounded-[1.5rem] border border-white/10">
                  {([
                    { id: 'webllm', label: 'Offline' },
                    { id: 'lmstudio', label: 'Local' },
                    { id: 'native', label: 'Device' },
                    { id: 'gemini', label: 'Cloud' }
                  ] as const).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setConfig({ ...config, provider: p.id })}
                      className={`py-3.5 text-[10px] font-black rounded-2xl transition-all ${config.provider === p.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}
                      title={p.id === 'webllm' ? 'Runs fully on-device in Chrome via WebGPU (after model download)' : p.id === 'lmstudio' ? 'LM Studio / local server (no internet)' : p.id === 'native' ? 'On-device native engine (requires native app build)' : 'Gemini API (internet)'}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {config.provider === 'webllm' && (
                  <div className="space-y-4 p-5 rounded-[2rem] border border-white/10 bg-white/[0.03]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">On-device (Browser) – WebLLM</div>
                        <div className="text-[10px] text-slate-500 font-bold leading-relaxed mt-2">
                          This runs <b>fully on your phone</b> using WebGPU. First time you load a model it downloads a few GB and then it can run offline (cached by the browser).
                        </div>
                      </div>
                      <div className={`text-[10px] font-black px-3 py-2 rounded-full border ${isWebGPUSupported ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10' : 'border-rose-500/40 text-rose-300 bg-rose-500/10'}`}>
                        {isWebGPUSupported ? 'WebGPU: OK' : 'WebGPU: OFF'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Recommended Models</div>
                      <select
                        value={config.webllm?.selectedModel || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          webllm: { selectedModel: e.target.value }
                        })}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[12px] font-bold text-white outline-none focus:border-indigo-500/60"
                      >
                        <option value="">Select…</option>
                        {webllmService.getRecommendedModels().map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <div className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        Tip: start with <b>Qwen2 1.5B</b>. If it feels too weak, try <b>Phi-3 Mini</b>.
                      </div>
                    </div>

                    <button
                      onClick={loadWebLLMModel}
                      disabled={webllmLoading}
                      className={`w-full py-4 border border-white/10 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] text-slate-200 transition-all active:scale-[0.98] ${webllmLoading ? 'bg-white/5 opacity-70' : 'bg-white/10 hover:bg-white/15'}`}
                    >
                      {webllmLoading ? 'Downloading / Loading…' : (webllmReady ? 'Model Loaded' : 'Download / Load Model')}
                    </button>

                    {webllmProgress && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 font-bold">{webllmProgress.text || 'Loading…'}</div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-indigo-500"
                            style={{ width: `${Math.max(0, Math.min(100, Math.round((webllmProgress.progress || 0) * 100)))}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold">
                          {typeof webllmProgress.progress === 'number' ? `${Math.round(webllmProgress.progress * 100)}%` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {config.provider === 'lmstudio' && (
                  <div className="space-y-4 p-5 rounded-[2rem] border border-white/10 bg-white/[0.03]">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">LM Studio Base URL</div>
                      <input
                        value={config.lmStudio?.baseUrl || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          lmStudio: { ...(config.lmStudio || { baseUrl: '', apiKey: 'lm-studio', selectedModel: '' }), baseUrl: e.target.value }
                        })}
                        placeholder="http://localhost:1234/v1"
                        className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[12px] font-bold text-white outline-none focus:border-indigo-500/60"
                      />
                      <div className="text-[10px] text-slate-500 font-bold leading-relaxed">Tip: In LM Studio enable <b>Local Server</b> + <b>CORS</b>. Keep this app on <b>http://</b> to avoid HTTPS→HTTP mixed-content blocks.</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">API Key</div>
                        <input
                          value={config.lmStudio?.apiKey || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            lmStudio: { ...(config.lmStudio || { baseUrl: '', apiKey: '', selectedModel: '' }), apiKey: e.target.value }
                          })}
                          placeholder="lm-studio"
                          className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[12px] font-bold text-white outline-none focus:border-indigo-500/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Model</div>
                        <select
                          value={config.lmStudio?.selectedModel || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            lmStudio: { ...(config.lmStudio || { baseUrl: '', apiKey: '', selectedModel: '' }), selectedModel: e.target.value }
                          })}
                          className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[12px] font-bold text-white outline-none focus:border-indigo-500/60"
                        >
                          <option value="">Select…</option>
                          {(lmModels.length ? lmModels : (config.lmStudio?.selectedModel ? [{ id: config.lmStudio.selectedModel }] as any : [])).map((m: any) => (
                            <option key={m.id} value={m.id}>{m.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={refreshLmStudioModels}
                      className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] text-slate-200 transition-all active:scale-[0.98]"
                    >
                      Refresh Local Models
                    </button>
                  </div>
                )}

                {config.provider === 'gemini' && (
                  <div className="space-y-3 p-5 rounded-[2rem] border border-white/10 bg-white/[0.03]">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Gemini API Key</div>
                    <input
                      value={config.geminiApiKey || ''}
                      onChange={(e) => setConfig({ ...config, geminiApiKey: e.target.value })}
                      placeholder="Paste key (or set VITE_GEMINI_API_KEY in .env)"
                      className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[12px] font-bold text-white outline-none focus:border-indigo-500/60"
                    />
                    <div className="text-[10px] text-slate-500 font-bold leading-relaxed">Cloud mode uses your quota. Switch to <b>Local</b> to stop burning Gemini requests.</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-1">Active Neural Model</label>
                <div className="space-y-4">
                  {AVAILABLE_MODELS.map(m => (
                    <div key={m.id} onClick={() => setConfig({ ...config, activeModelId: m.id })} className={`p-5 rounded-[2rem] border-2 transition-all duration-500 cursor-pointer ${config.activeModelId === m.id ? 'border-cyan-500 bg-cyan-500/15 shadow-[0_0_30px_rgba(34,211,238,0.2)]' : 'border-white/5 bg-white/[0.04] hover:bg-white/[0.08]'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-[14px] font-black ${config.activeModelId === m.id ? 'text-cyan-400' : 'text-white'}`}>{m.name}</span>
                        <span className="text-[9px] font-black bg-white/15 text-slate-400 px-3 py-1.5 rounded-full uppercase border border-white/10">{m.version}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Power Node</label>
                   <div className="grid grid-cols-3 bg-white/5 p-2 rounded-[1.5rem] border border-white/10">
                     {(['Eco', 'Balanced', 'Performance'] as PerformanceMode[]).map(p => (
                       <button key={p} onClick={() => setConfig({...config, profile: p})} className={`py-3.5 text-[10px] font-black rounded-2xl transition-all ${config.profile === p ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'}`}>{p[0]}</button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Cognitive Sync</label>
                   <div onClick={() => setConfig({ ...config, useCognitiveMemory: !config.useCognitiveMemory })} className={`w-full py-4 rounded-[1.5rem] text-[11px] font-black text-center cursor-pointer transition-all border-2 flex items-center justify-center gap-4 ${config.useCognitiveMemory ? 'border-cyan-500 bg-cyan-500/15 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-white/10 text-slate-700 hover:border-white/30'}`}>
                     <div className={`w-2.5 h-2.5 rounded-full ${config.useCognitiveMemory ? 'bg-cyan-400 shadow-[0_0_12px_cyan]' : 'bg-slate-800'}`} />
                     {config.useCognitiveMemory ? 'Linked' : 'Offline'}
                   </div>
                 </div>
              </div>
            </div>
            
            <button onClick={() => setShowSettings(false)} className="w-full py-6 bg-gradient-to-r from-white via-slate-100 to-slate-300 text-black rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl transition-transform active:scale-95 hover:brightness-110">Commit Neural Node</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
