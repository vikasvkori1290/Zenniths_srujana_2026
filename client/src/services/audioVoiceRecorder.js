import { API_BASE } from './api';

/**
 * AudioVoiceRecorder
 * Records user audio stream directly and transcribes using Groq Whisper Large V3 Turbo.
 * Includes live volume analysis for interactive waveform visualizers.
 */
export class AudioVoiceRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.mediaStream = null;
    this.audioContext = null;
    this.analyser = null;
    this.animFrameId = null;
    this.isRecording = false;
  }

  static isSupported() {
    return (
      typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window.MediaRecorder === 'function'
    );
  }

  async start({ onVolumeChange, language = 'en' } = {}) {
    if (this.isRecording) {
      this.stop();
    }

    this.audioChunks = [];
    this.language = language;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Optional real-time audio volume visualizer
      if (onVolumeChange && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.audioContext = new AudioCtx();
          const source = this.audioContext.createMediaStreamSource(this.mediaStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 64;
          source.connect(this.analyser);

          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!this.isRecording) return;
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            onVolumeChange(normalized);
            this.animFrameId = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (e) {
          console.warn('AudioContext visualization setup failed:', e);
        }
      }

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
      this.isRecording = true;
      return true;
    } catch (err) {
      this.cleanup();
      console.error('[AudioVoiceRecorder Start Error]:', err);
      throw err;
    }
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        this.cleanup();
        resolve(null);
        return;
      }

      this.isRecording = false;

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          this.cleanup();

          if (audioBlob.size < 500) {
            resolve({ text: '', empty: true });
            return;
          }

          // Transcribe via Groq Whisper endpoint
          const text = await this.transcribeBlob(audioBlob, mimeType);
          resolve({ text, blob: audioBlob });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
        this.mediaRecorder.stop();
      } catch (e) {
        this.cleanup();
        resolve(null);
      }
    });
  }

  cleanup() {
    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }

  async transcribeBlob(blob, mimeType) {
    // Convert Blob to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const apiKey = localStorage.getItem('ekhata_groq_key') || '';

    const res = await fetch(`${API_BASE}/groq/transcribe-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64,
        mimeType,
        language: this.language || 'en',
        apiKey,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Whisper error status ${res.status}`);
    }

    const data = await res.json();
    return data.text || '';
  }
}

export const audioVoiceRecorder = new AudioVoiceRecorder();
export default audioVoiceRecorder;
