import { useRef, useState, useEffect } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType, CameraSource } from "@capacitor/camera";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const captureWithNativeCamera = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
      });

      if (image.dataUrl) {
        onCapture(image.dataUrl);
      }
    } catch (error) {
      console.error("Error capturing with native camera:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const startCamera = async () => {
    // If running as a native app, use native camera
    if (isNative) {
      await captureWithNativeCamera();
      return;
    }

    // Otherwise use browser camera API
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
        
        // Add event listeners for better mobile support
        video.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          video.play()
            .then(() => {
              console.log("Video playing successfully");
              setIsCameraActive(true);
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              // Try to play again after user interaction
              setIsCameraActive(true);
            });
        };
        
        video.onerror = (err) => {
          console.error("Video element error:", err);
          alert("Unable to display camera feed. Please try again.");
        };
        
        video.srcObject = mediaStream;
        setStream(mediaStream);
        console.log("Video source set");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted and try again.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.9);
        stopCamera();
        onCapture(imageData);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md overflow-hidden shadow-[var(--shadow-elegant)]">
        <div className="relative bg-card">
          {!isCameraActive ? (
            <div className="aspect-[4/3] flex flex-col items-center justify-center p-8 bg-muted/50">
              <Camera className="w-16 h-16 mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-2 text-center text-foreground">Golf Green Analyzer</h2>
              <p className="text-muted-foreground text-center mb-6">
                Capture an image of the putting green to get AI-powered line recommendations
              </p>
              <Button 
                variant="camera" 
                size="lg" 
                onClick={startCamera}
                className="w-full"
              >
                <Camera className="mr-2" />
                Start Camera
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 border-4 border-primary/20 pointer-events-none">
                <div className="absolute inset-4 border-2 border-primary/40 border-dashed" />
              </div>
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {isCameraActive && (
          <div className="p-6 space-y-3 bg-card">
            <Button 
              variant="camera" 
              size="lg" 
              onClick={captureImage}
              className="w-full"
            >
              <Camera className="mr-2" />
              Capture Green
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={stopCamera}
              className="w-full"
            >
              <RotateCcw className="mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6 text-center max-w-md">
        <p className="text-sm text-muted-foreground">
          Position the green in the frame and capture the image. Our AI will analyze the slope and break to suggest the optimal putting line.
        </p>
      </div>
    </div>
  );
};
