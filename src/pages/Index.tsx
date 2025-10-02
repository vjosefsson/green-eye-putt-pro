import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { AnalysisResults } from "@/components/AnalysisResults";

interface Markers {
  ball: { x: number; y: number };
  hole: { x: number; y: number };
}

const Index = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Markers | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);

  const handleCapture = (
    imageData: string, 
    ballPosition: { x: number; y: number }, 
    holePosition: { x: number; y: number },
    metadata: { width: number; height: number }
  ) => {
    setCapturedImage(imageData);
    setMarkers({ ball: ballPosition, hole: holePosition });
    setImageMetadata(metadata);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setMarkers(null);
    setImageMetadata(null);
  };

  return (
    <>
      {!capturedImage || !markers || !imageMetadata ? (
        <CameraCapture onCapture={handleCapture} />
      ) : (
        <AnalysisResults 
          imageData={capturedImage} 
          markers={markers}
          imageMetadata={imageMetadata}
          onReset={handleReset} 
        />
      )}
    </>
  );
};

export default Index;
