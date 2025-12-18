
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
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || "Failed to generate try-on result. Please try again." 
      }));
    }
  };

  const setCategory = (category: Category) => {
    setState(prev => ({ ...prev, category }));
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center">
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
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls / Inputs */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel rounded-3xl p-6 space-y-6 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-4">Configuration</h2>
                <div className="flex flex-wrap gap-2">
                  {(['clothes', 'pants', 'shoes', 'full-outfit'] as Category[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                        state.category === cat 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {cat.replace('-', ' ')}
                    </button>
                  ))}
                </div>
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
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center space-x-2 ${
                  !state.modelImage || !state.itemImage || state.loading
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'gradient-btn'
                }`}
              >
                {state.loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Blending Fabric...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    <span>Generate Try-On</span>
                  </>
                )}
              </button>

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                  {state.error}
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-8">
            <div className="glass-panel rounded-[32px] p-4 sm:p-8 h-full min-h-[600px] flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Result Preview</h2>
                  <p className="text-sm text-slate-500 mt-1">AI-powered seamless integration</p>
                </div>
                {state.result && (
                  <a 
                    href={state.result} 
                    download="v-try-on-result.png"
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Download</span>
                  </a>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden bg-slate-100/50 border border-slate-100 relative group">
                {state.loading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-slate-500 font-medium animate-pulse">Processing High-Res Blend...</p>
                  </div>
                ) : state.result ? (
                  <img 
                    src={state.result} 
                    alt="AI Try On Result" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium opacity-50">Upload images and click Generate</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Realistic Textures", 
              desc: "Maintains original fabric details, patterns, and drape quality.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            },
            { 
              title: "Pose Adaptation", 
              desc: "Intelligently warps garments to match the model's specific body pose.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            },
            { 
              title: "Footwear Support", 
              desc: "Switch from outfits to shoe try-on instantly with high-precision masking.",
              icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {item.icon}
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Footer Floating Action (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 lg:hidden z-40 bg-white/80 backdrop-blur-md border-t border-slate-200">
         <button
            disabled={!state.modelImage || !state.itemImage || state.loading}
            onClick={handleTryOn}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center space-x-2 ${
              !state.modelImage || !state.itemImage || state.loading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'gradient-btn'
            }`}
          >
            {state.loading ? 'Processing...' : 'Generate Try-On'}
          </button>
      </div>
    </div>
  );
};

export default App;
