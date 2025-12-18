
import React, { useRef } from 'react';
import { ImageData } from '../types';

interface ImageUploaderProps {
  label: string;
  image: ImageData | null;
  onUpload: (data: ImageData) => void;
  onClear: () => void;
  aspectRatio?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  image, 
  onUpload, 
  onClear,
  aspectRatio = "aspect-[3/4]"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        onUpload({
          base64: base64String,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{label}</label>
      <div 
        className={`relative group w-full ${aspectRatio} rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center transition-all hover:border-indigo-400 hover:bg-slate-100 cursor-pointer`}
        onClick={() => !image && fileInputRef.current?.click()}
      >
        {image ? (
          <div className="relative w-full h-full">
            <img 
              src={`data:${image.mimeType};base64,${image.base64}`} 
              alt={label} 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-3 right-3 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center p-6">
            <div className="mx-auto w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 font-medium">Click to upload</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG or WebP</p>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
