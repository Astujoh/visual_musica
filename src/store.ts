import { create } from 'zustand';

interface AudioStore {
  audioElement: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isRecording: boolean;
  audioData: Float32Array | null;
  mediaRecorder: MediaRecorder | null;
  recordedChunks: Blob[];
  recordingProgress: number;
  setAudioFile: (file: File) => void;
  togglePlay: () => void;
  startRecording: () => void;
  stopRecording: () => Promise<void>;
}

export const useStore = create<AudioStore>((set, get) => ({
  audioElement: null,
  audioContext: null,
  analyser: null,
  isPlaying: false,
  isRecording: false,
  audioData: null,
  mediaRecorder: null,
  recordedChunks: [],
  recordingProgress: 0,

  setAudioFile: (file: File) => {
    const { audioElement: oldAudio } = get();
    if (oldAudio) {
      oldAudio.pause();
      oldAudio.src = '';
    }

    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    set({
      audioElement,
      audioContext,
      analyser,
      isPlaying: false,
      audioData: new Float32Array(analyser.frequencyBinCount),
      recordingProgress: 0
    });
  },

  togglePlay: () => {
    const { audioElement, isPlaying, audioContext } = get();
    if (!audioElement) return;

    if (audioContext?.state === 'suspended') {
      audioContext.resume();
    }

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    set({ isPlaying: !isPlaying });
  },

  startRecording: () => {
    const { audioElement } = get();
    if (!audioElement) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // Reset audio to beginning
    audioElement.currentTime = 0;

    // Create a high-quality MediaStream from the canvas
    const stream = canvas.captureStream(60);

    // Add audio track to the stream
    const audioStream = new MediaStream();
    const audioTracks = audioElement.mozCaptureStream?.() || 
                       (audioElement as any).captureStream?.() || 
                       new MediaStream();
    audioTracks.getAudioTracks().forEach(track => {
      audioStream.addTrack(track);
    });

    // Combine video and audio streams
    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ]);

    // Create MediaRecorder with high quality settings
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 12000000, // 12 Mbps for better quality
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        const { recordedChunks } = get();
        set({ recordedChunks: [...recordedChunks, event.data] });
      }
    };

    // Update progress based on audio time
    const updateProgress = () => {
      if (!audioElement) return;
      const progress = audioElement.currentTime / audioElement.duration;
      set({ recordingProgress: progress });

      // Stop recording when audio ends
      if (audioElement.currentTime >= audioElement.duration) {
        const { stopRecording } = get();
        stopRecording();
      }
    };

    const progressInterval = setInterval(updateProgress, 100);

    mediaRecorder.start(1000); // Collect data every second
    set({ 
      mediaRecorder, 
      isRecording: true, 
      recordedChunks: [],
      recordingProgress: 0
    });

    // Start audio playback
    audioElement.play();
    set({ isPlaying: true });

    // Store interval ID for cleanup
    (mediaRecorder as any).progressInterval = progressInterval;
  },

  stopRecording: async () => {
    const { mediaRecorder, recordedChunks, audioElement } = get();
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    return new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        // Clear progress update interval
        clearInterval((mediaRecorder as any).progressInterval);

        // Create a high-quality video blob
        const blob = new Blob(recordedChunks, { 
          type: 'video/webm;codecs=vp9'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audio-visualization.webm';
        a.click();
        URL.revokeObjectURL(url);

        // Reset recording state
        set({ 
          mediaRecorder: null, 
          recordedChunks: [],
          isRecording: false,
          recordingProgress: 0
        });

        // Pause audio if it was playing
        if (audioElement) {
          audioElement.pause();
          set({ isPlaying: false });
        }

        resolve();
      };

      mediaRecorder.stop();
    });
  },
}));