import { useState, useEffect, useRef } from "react";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { Motion } from "@capacitor/motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "./ui/button";
import { X, Camera, Loader2, ChevronRight } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string, imageMetadata: { width: number; height: number }) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ pitch: 0, roll: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  const lastHapticStatus = useRef<string>('');

  useEffect(() => {
    if (!showInstructions) {
      setIsStartingCamera(true);
      startCamera();
      startMotionTracking();
      document.body.classList.add('camera-active');
    }
    
    return () => {
      stopCamera();
      stopMotionTracking();
      document.body.classList.remove('camera-active');
    };
  }, [showInstructions]);

  useEffect(() => {
    const status = getLevelStatus().status;
    if (isCameraActive && status !== lastHapticStatus.current) {
      lastHapticStatus.current = status;
      
      if (status === 'good') {
        Haptics.impact({ style: ImpactStyle.Light });
      } else if (status === 'ok') {
        Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        Haptics.impact({ style: ImpactStyle.Heavy });
      }
    }
  }, [deviceOrientation, isCameraActive]);

  const startMotionTracking = async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            console.log("Motion permission denied");
            return;
          }
        }
        
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } catch (error) {
      console.log("Motion tracking not available:", error);
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    setDeviceOrientation({
      pitch: event.beta || 90,
      roll: event.gamma || 0
    });
  };

  const stopMotionTracking = async () => {
    try {
      window.removeEventListener('deviceorientation', handleOrientation);
      await Motion.removeAllListeners();
    } catch (error) {
      console.log("Error stopping motion tracking:", error);
    }
  };

  const startCamera = async () => {
    try {
      await CameraPreview.start({
        position: 'rear',
        toBack: true,
        enableHighResolution: true,
        disableAudio: true,
      });
      
      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch (error) {
      console.error("Error starting camera:", error);
      setIsStartingCamera(false);
    }
  };

  const stopCamera = async () => {
    try {
      await CameraPreview.stop();
      setIsCameraActive(false);
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  };

  const getLevelStatus = () => {
    const { pitch, roll } = deviceOrientation;
    const absRoll = Math.abs(roll);
    const absPitch = Math.abs(pitch - 90);
    
    if (absRoll < 5 && absPitch < 5) {
      return { status: 'good', color: 'bg-green-500', isLevel: true };
    }
    if (absRoll < 15 && absPitch < 15) {
      return { status: 'ok', color: 'bg-yellow-500', isLevel: false };
    }
    return { status: 'bad', color: 'bg-red-500', isLevel: false };
  };

  const captureImage = async () => {
    try {
      setIsCapturing(true);
      
      const result = await CameraPreview.capture({ quality: 90 });
      const base64Image = `data:image/jpeg;base64,${result.value}`;
      
      await stopCamera();
      
      // Get image dimensions
      const img = new Image();
      img.src = base64Image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const metadata = { width: img.width, height: img.height };
      
      console.log("Image captured with dimensions:", metadata);
      
      onCapture(base64Image, metadata);
      
    } catch (error) {
      console.error("Failed to capture image:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Photo Guide</h2>
            <p className="text-muted-foreground">För bästa resultat, följ dessa tips:</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Stå bakom bollen</h3>
                <p className="text-sm text-muted-foreground">Positionera dig bakom bollen mot hålet för bästa perspektiv</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Håll telefonen rakt</h3>
                <p className="text-sm text-muted-foreground">En nivå-indikator guidar dig när kameran är aktiv. Håll telefonen parallellt med marken.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Optimalt avstånd</h3>
                <p className="text-sm text-muted-foreground">Stå cirka 2-3 meter från bollen för att få med hela putting-linjen.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Inkludera både boll och hål</h3>
                <p className="text-sm text-muted-foreground">Se till att både bollen och hålet syns tydligt i bilden</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowInstructions(false)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
            size="lg"
          >
            Fortsätt till kamera
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0">
      {/* Camera loading indicator */}
      {isStartingCamera && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
            <p className="text-white text-lg">Startar kamera...</p>
          </div>
        </div>
      )}

      {/* Main camera view with UI overlay */}
      {!showInstructions && (
        <>
          {/* iPhone-style Level Indicator - Centered */}
          {isCameraActive && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="relative w-[280px] h-[50px] bg-black/60 backdrop-blur-lg rounded-2xl border border-white/30 flex items-center justify-center overflow-hidden">
                {/* Gradient background track */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                {/* Center crosshair lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[2px] h-6 bg-white/60 rounded-full" />
                </div>
                
                {/* Level bubble - moves left/right based on roll */}
                <div 
                  className={`absolute w-12 h-12 rounded-full transition-all duration-200 ease-out border-2 ${
                    getLevelStatus().isLevel 
                      ? 'border-green-400 bg-green-400/40 shadow-[0_0_20px_rgba(34,197,94,0.6)]' 
                      : 'border-white bg-white/20'
                  }`}
                  style={{
                    left: `calc(50% + ${Math.max(-100, Math.min(100, deviceOrientation.roll * 4))}px)`,
                    transform: 'translateX(-50%)',
                    boxShadow: getLevelStatus().isLevel 
                      ? '0 0 20px rgba(34,197,94,0.6), inset 0 0 10px rgba(255,255,255,0.3)'
                      : '0 0 10px rgba(255,255,255,0.3), inset 0 0 10px rgba(255,255,255,0.2)'
                  }}
                >
                  {/* Inner bubble core */}
                  <div className={`absolute inset-2 rounded-full ${
                    getLevelStatus().isLevel ? 'bg-green-400/60' : 'bg-white/40'
                  } backdrop-blur-sm`} />
                </div>
                
                {/* Side markers */}
                <div className="absolute left-8 w-[2px] h-3 bg-white/50 rounded-full" />
                <div className="absolute right-8 w-[2px] h-3 bg-white/50 rounded-full" />
              </div>
            </div>
          )}

          {/* Camera controls - Bottom */}
          <div className="fixed bottom-8 left-0 right-0 px-8 z-10">
            <div className="flex items-center justify-between">
              {/* Left - Cancel button */}
              <button 
                onClick={async () => {
                  await stopCamera();
                  window.location.href = '/';
                }}
                className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              
              {/* Center - Snapchat-style capture button */}
              <button 
                onClick={captureImage}
                disabled={isCapturing}
                className="relative flex-shrink-0 disabled:opacity-50"
              >
                {/* Outer ring */}
                <div className="w-20 h-20 rounded-full border-4 border-white/90 flex items-center justify-center">
                  {/* Inner circle */}
                  <div className={`w-16 h-16 rounded-full bg-white ${isCapturing ? 'scale-90' : ''} transition-transform duration-150`} />
                </div>
              </button>
              
              {/* Right - Placeholder */}
              <div className="w-12 h-12" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
