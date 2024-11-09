import React, { useRef } from 'react';
import { Upload, Play, Pause, Download } from 'lucide-react';
import { useStore } from '../store';

export function Controls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    isPlaying, 
    audioElement, 
    togglePlay, 
    setAudioFile, 
    startRecording, 
    stopRecording, 
    isRecording,
    recordingProgress 
  } = useStore();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleExport = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-4">
      {isRecording && (
        <div className="w-full max-w-md bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-1 bg-red-500 transition-all duration-300 ease-linear"
            style={{ width: `${recordingProgress * 100}%` }}
          />
        </div>
      )}
      <div className="flex justify-center items-center gap-4 bg-gradient-to-t from-black to-transparent p-4 rounded-lg">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <Upload className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={togglePlay}
          disabled={!audioElement}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white" />
          )}
        </button>
        <button
          onClick={handleExport}
          disabled={!audioElement}
          className={`p-3 rounded-full transition-colors ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-white/10 hover:bg-white/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Download className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}