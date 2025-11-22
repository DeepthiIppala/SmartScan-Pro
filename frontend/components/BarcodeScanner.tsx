'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
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
  const controlsRef = useRef<{ stop: () => void } | null>(null);

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
    if (isScanning || isScanningActiveRef.current) return;

    try {
      setIsScanning(true);
      isScanningActiveRef.current = true;

      // Wait for video element to render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!videoRef.current) {
        setIsScanning(false);
        isScanningActiveRef.current = false;
        toast.error('Video element not ready');
        return;
      }

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

      const controls = await codeReader.decodeFromVideoDevice(
        undefined, // Use default camera
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

      // Store controls to stop scanning later
      controlsRef.current = controls;
    } catch (error) {
      console.error('Failed to start scanner:', error);
      toast.error('Failed to start camera');
      setIsScanning(false);
      isScanningActiveRef.current = false;
    }
  };

  const stopScanner = () => {
    // IMMEDIATELY disable scanning
    isScanningActiveRef.current = false;

    // Stop using controls if available
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
        controlsRef.current = null;
      } catch (error) {
        console.error('Error stopping controls:', error);
      }
    }

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Scan Product</h3>

      {/* Manual Input */}
      <form onSubmit={handleManualSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter barcode manually"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
      </form>

      {/* Camera Scanner */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        {!isScanning ? (
          <button
            onClick={startScanner}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Start Camera Scanner
          </button>
        ) : (
          <div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg mb-4 bg-black"
              style={{ minHeight: '300px', maxHeight: '400px' }}
            />
            <button
              onClick={stopScanner}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Stop Scanner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
