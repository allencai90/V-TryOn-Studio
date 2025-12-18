import React, { useState } from 'react';
import { GenerationState, Category, ImageData } from './types';
import ImageUploader from './components/ImageUploader';
import { performTryOn } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({
    modelImage: null,
    itemImage: null,
    category: 'clothes',
    loading: false,
    result: null,
    error: null,
  });

  const handleTryOn = async () => {
    if (!state.modelImage || !state.itemImage) return;

    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    
    try {
      const resultImageUrl = await performTryOn(
        state.modelImage,
        state.itemImage,
        state.category
      );
      setState(prev => ({ ...prev, loading: false, result: resultImageUrl }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || "无法生成试穿结果，请稍后再试。" 
      }));
    }
  };

  const setCategory = (category: Category) => {
    setState(prev => ({ ...prev, category, result: null }));
  };

  const clearAll = () => {
    setState({
      modelImage: null,
      itemImage: null,
      category: 'clothes',
      loading: false,
      result: null,
      error: null,
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center shadow-indigo-200 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              V-TryOn Studio
            </h1>
          </div>
          <button 
            onClick={clearAll}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Reset All
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel rounded-3xl p-6 space-y-6 shadow-xl border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Step 1: Category</h2>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold uppercase">Required</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['clothes', 'pants', 'shoes', 'full-outfit'] as Category[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                        state.category === cat 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 italic">Choosing the right category improves fit accuracy.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <ImageUploader 
                  label="Model Image" 
                  image={state.modelImage}
                  onUpload={(data) => setState(prev => ({ ...prev, modelImage: data }))}
                  onClear={() => setState(prev => ({ ...prev, modelImage: null }))}
                />
                <ImageUploader 
                  label="Product Item" 
                  image={state.itemImage}
                  onUpload={(data) => setState(prev => ({ ...prev, itemImage: data }))}
                  onClear={() => setState(prev => ({ ...prev, itemImage: null }))}
                  aspectRatio="aspect-square"
                />
              </div>

              <button
                disabled={!state.modelImage || !state.itemImage || state.loading}
                onClick={handleTryOn}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-95 ${
                  !state.modelImage || !state.itemImage || state.loading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'gradient-btn cursor-pointer'
                }`}
              >
                {state.loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing Replace...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    <span>Run Replacement</span>
                  </>
                )}
              </button>

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-bounce">
                  {state.error}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass-panel rounded-[32px] p-4 sm:p-8 h-full min-h-[600px] flex flex-col shadow-xl border-white/50">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Result Preview</h2>
                  <p className="text-sm text-slate-500 mt-1">AI-driven outfit replacement</p>
                </div>
                {state.result && (
                  <a 
                    href={state.result} 
                    download={`try-on-${state.category}.png`}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Save Result</span>
                  </a>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden bg-slate-100/30 border-2 border-dashed border-slate-200 relative group">
                {state.loading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center px-6">
                      <p className="text-slate-700 font-bold text-lg animate-pulse">Replacing Original Outfit...</p>
                      <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">This process removes the old garment and resynthesizes the person's form with the new item.</p>
                    </div>
                  </div>
                ) : state.result ? (
                  <img 
                    src={state.result} 
                    alt="AI Try On Result" 
                    className="w-full h-full object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-700"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <div className="w-32 h-32 mb-4 opacity-10 bg-indigo-900 rounded-full flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                    </div>
                    <p className="text-lg font-medium text-slate-400">Ready for transformation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
