
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
        error: err.message || "生成效果失败，请重试或更换图片素材。" 
      }));
    }
  };

  const clear = () => {
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
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              V-TryOn Studio
            </h1>
          </div>
          
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button 
              onClick={() => setState(s => ({ ...s, category: 'clothes', result: null }))}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.category === 'clothes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              衣物换装
            </button>
            <button 
              onClick={() => setState(s => ({ ...s, category: 'shoes', result: null }))}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${state.category === 'shoes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              鞋子换装
            </button>
          </div>

          <button onClick={clear} className="text-sm font-medium text-slate-400 hover:text-slate-800 transition-colors">
            重置
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-[32px] p-6 space-y-6 shadow-xl border-slate-100">
              <div className="grid grid-cols-1 gap-4">
                <ImageUploader 
                  label="1. 模特人像 (Model)" 
                  image={state.modelImage}
                  onUpload={(data) => setState(prev => ({ ...prev, modelImage: data }))}
                  onClear={() => setState(prev => ({ ...prev, modelImage: null }))}
                />
                <ImageUploader 
                  label="2. 服饰/泳衣单品 (Product)" 
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
                    ? 'bg-slate-300'
                    : 'gradient-btn cursor-pointer'
                }`}
              >
                {state.loading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>正在智能换装...</span>
                  </div>
                ) : (
                  <span>生成效果图</span>
                )}
              </button>

              {state.error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold leading-relaxed">
                  {state.error}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass-panel rounded-[40px] p-6 sm:p-8 h-full min-h-[600px] flex flex-col shadow-2xl border-white/50">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">渲染结果</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {state.loading ? '正在进行像素级服饰迁移...' : '效果已基于 Gemini 视觉逻辑生成'}
                  </p>
                </div>
                {state.result && (
                  <a 
                    href={state.result} 
                    download={`try-on-${state.category}.png`}
                    className="flex items-center space-x-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all"
                  >
                    <span>保存图片</span>
                  </a>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center rounded-[32px] overflow-hidden bg-slate-100/50 border-2 border-dashed border-slate-200 relative shadow-inner">
                {state.result ? (
                  <img 
                    src={state.result} 
                    alt="Result" 
                    className="w-full h-full object-contain animate-in fade-in zoom-in duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-300">
                    {state.loading ? (
                       <div className="flex flex-col items-center">
                         <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                         <p className="font-bold text-slate-400">正在处理服饰贴合与光影调整...</p>
                       </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="font-bold">就绪，等待上传并生成</p>
                      </>
                    )}
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
