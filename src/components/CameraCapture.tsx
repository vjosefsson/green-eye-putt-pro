import { useRef, useState, useEffect } from "react";
import { Camera, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";

interface CameraCaptureProps {
  onCapture: (imageData: string, ballPosition: { x: number; y: number }, holePosition: { x: number; y: number }) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [holePosition, setHolePosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    // Auto-start camera
    startCamera();
    
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    // For consistent UX with markers, we always use web camera API
    // even on native platforms

    // Show camera UI first so video element is in DOM
    setIsStartingCamera(true);
    
    // Wait for next render cycle to ensure video element exists
    setTimeout(async () => {
      try {
        console.log("Requesting camera access...");
        
        // Try with environment camera first, fallback to any camera
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false,
          });
          console.log("Camera access granted with environment camera");
        } catch (error) {
          console.log("Environment camera not available, trying any camera...");
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          console.log("Camera access granted with default camera");
        }
        
        if (videoRef.current) {
          const video = videoRef.current;
          
          video.srcObject = mediaStream;
          setStream(mediaStream);
          setIsCameraActive(true);
          setIsStartingCamera(false);
          console.log("Video source set, camera active");
          
          // Add event listeners for better mobile support
          video.onloadedmetadata = () => {
            console.log("Video metadata loaded, readyState:", video.readyState);
            video.play()
              .then(() => {
                console.log("Video playing successfully");
              })
              .catch((err) => {
                console.error("Error playing video (autoplay blocked?):", err);
                alert("Tap the video to start camera feed");
              });
          };
          
          video.onerror = (err) => {
            console.error("Video element error:", err);
            alert("Unable to display camera feed. Please try again.");
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Unable to access camera. Please ensure camera permissions are granted and try again.");
        setIsStartingCamera(false);
        setIsCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    if (!videoRef.current) return;

    const rect = videoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!ballPosition) {
      setBallPosition({ x, y });
    } else if (!holePosition) {
      setHolePosition({ x, y });
    }
  };

  const handleResetMarkers = () => {
    setBallPosition(null);
    setHolePosition(null);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current && ballPosition && holePosition) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        stopCamera();
        onCapture(imageData, ballPosition, holePosition);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onClick={handleVideoClick}
          className="w-full h-full object-cover cursor-crosshair"
        />
        
        {isStartingCamera && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
              <Camera className="w-12 h-12 mb-3 text-primary mx-auto animate-pulse" />
              <p className="text-white text-lg">Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Guide overlay */}
        {isCameraActive && !ballPosition && !holePosition && (
          <div className="absolute inset-0 border-4 border-primary/20 pointer-events-none">
            <div className="absolute inset-4 border-2 border-primary/40 border-dashed" />
          </div>
        )}

        {/* Ball marker */}
        {ballPosition && (
          <div
            className="absolute w-10 h-10 rounded-full border-4 border-green-500 bg-green-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-scale-in"
            style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse" />
          </div>
        )}
        
        {/* Hole marker */}
        {holePosition && (
          <div
            className="absolute w-10 h-10 rounded-full border-4 border-red-500 bg-red-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-scale-in"
            style={{ left: `${holePosition.x}%`, top: `${holePosition.y}%` }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-pulse" />
          </div>
        )}

        {/* Instructions */}
        {isCameraActive && (
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-center">
              <p className="text-white text-lg font-semibold animate-fade-in">
                {!ballPosition ? "Tap to mark the ball position" : !holePosition ? "Tap to mark the hole" : "Ready to capture!"}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/30" />
                  <span className="text-white text-sm">Ball {ballPosition && "✓"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500/30" />
                  <span className="text-white text-sm">Hole {holePosition && "✓"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        {isCameraActive && (
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3 bg-gradient-to-t from-black/90 to-transparent">
            {ballPosition && holePosition && (
              <Button 
                variant="camera" 
                size="lg" 
                onClick={captureImage}
                className="w-full animate-fade-in"
              >
                <Camera className="mr-2" />
                Capture & Analyze
              </Button>
            )}
            
            <div className="flex gap-3">
              {(ballPosition || holePosition) && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleResetMarkers}
                  className="flex-1"
                >
                  Reset Markers
                </Button>
              )}
              <Button 
                variant="outline" 
                size="lg" 
                onClick={stopCamera}
                className="flex-1"
              >
                <RotateCcw className="mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
