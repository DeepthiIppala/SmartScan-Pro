'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import toast from 'react-hot-toast';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export default function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasCalledOnScanRef = useRef(false);
  const isScanningActiveRef = useRef(false);

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Could not play beep:', error);
    }
  };

  const startScanner = async () => {
    if (isScanning || isScanningActiveRef.current) {
      console.log('Scanner already active, ignoring start request');
      return;
    }

    try {
      console.log('Starting barcode scanner...');
      setIsScanning(true);
      isScanningActiveRef.current = true;

      // Wait for video element to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        console.error('Video element not found');
        setIsScanning(false);
        isScanningActiveRef.current = false;
        toast.error('Video element not ready. Please try again.');
        return;
      }

      console.log('Video element ready, initializing scanner...');

      // Enable all barcode formats for maximum compatibility
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.UPC_E,
        BarcodeFormat.UPC_A,
        BarcodeFormat.EAN_8,
        BarcodeFormat.EAN_13,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR,
        BarcodeFormat.ITF,
        BarcodeFormat.RSS_14,
        BarcodeFormat.PDF_417,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = codeReader;

      console.log('Requesting camera access...');
      await codeReader.decodeFromVideoDevice(
        null, // Use default camera
        videoRef.current,
        (result, error) => {
          // Log scanning attempts for debugging
          if (error) {
            // Don't log NotFoundException - it's normal when no barcode is visible
            if (error.name !== 'NotFoundException') {
              console.error('Barcode scanning error:', error);
            }
            return;
          }

          // Check if scanning is still active
          if (!isScanningActiveRef.current) {
            return;
          }

          if (result) {
            const barcode = result.getText();
            console.log('Barcode detected:', barcode);

            // Quadruple protection against duplicates
            if (lastScannedRef.current === barcode || hasCalledOnScanRef.current || !isScanningActiveRef.current) {
              return;
            }

            // Mark this barcode as scanned (but keep scanner running)
            hasCalledOnScanRef.current = true;
            lastScannedRef.current = barcode;

            // Play beep sound
            playBeep();

            // Call the onScan callback ONCE (removed toast from here)
            onScan(barcode);

            // Clear previous timeout if exists
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
            }

            // Reset after 2 seconds to allow rescanning or scanning different items
            scanTimeoutRef.current = setTimeout(() => {
              lastScannedRef.current = null;
              hasCalledOnScanRef.current = false;
            }, 2000);
          }
        }
      );

      console.log('Barcode scanner started successfully');
      toast.success('Camera scanner started! Point at a barcode.');
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      console.error('Failed to start scanner:', error);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);

      // Provide specific error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera access denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError') {
        toast.error('Camera constraints cannot be satisfied.');
      } else if (err.message?.includes('https') || err.message?.includes('secure')) {
        toast.error('Camera requires HTTPS connection. Please use https:// or localhost.');
      } else if (err.message?.includes('getUserMedia')) {
        toast.error('Camera access not supported. Please use HTTPS or localhost, or try a different browser.');
      } else {
        toast.error(`Failed to start camera: ${err.message || 'Unknown error'}`);
      }

      setIsScanning(false);
      isScanningActiveRef.current = false;
    }
  };

  const stopScanner = () => {
    // IMMEDIATELY disable scanning
    isScanningActiveRef.current = false;

    // Stop the video stream
    const videoElement = videoRef.current;
    if (videoElement && videoElement.srcObject) {
      try {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      } catch (error) {
        console.error('Error stopping video stream:', error);
      }
    }

    // Clear the code reader reference
    codeReaderRef.current = null;
    setIsScanning(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  useEffect(() => {
    return () => {
      // Clear timeout
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Cleanup video stream
      if (codeReaderRef.current) {
        try {
          const videoElement = videoRef.current;
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.log('Scanner cleanup error:', err);
        }
      }
    };
  }, []);

  return (
    <div>
      {/* Manual Input */}
      <form onSubmit={handleManualSubmit} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Enter Barcode</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type barcode number"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1] transition-all"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#4169E1] text-white font-medium rounded-lg hover:bg-[#3557C1] focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all"
          >
            Add
          </button>
        </div>
      </form>

      {/* Camera Scanner */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="w-full px-4 py-3 bg-[#4169E1] text-white font-medium rounded-lg hover:bg-[#3557C1] focus:outline-none focus:ring-2 focus:ring-gray-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Start Camera Scanner
          </button>
        ) : (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg mb-3 bg-black border-2 border-gray-700"
              style={{ minHeight: '300px', maxHeight: '400px' }}
            />
            <p className="text-center text-sm text-gray-600 mb-3">Position barcode within frame</p>
            <button
              onClick={stopScanner}
              className="w-full px-4 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
            >
              Stop Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
