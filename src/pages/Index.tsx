import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { AnalysisResults } from "@/components/AnalysisResults";

const Index = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleReset = () => {
    setCapturedImage(null);
  };

  return (
    <>
      {!capturedImage ? (
        <CameraCapture onCapture={handleCapture} />
      ) : (
        <AnalysisResults imageData={capturedImage} onReset={handleReset} />
      )}
    </>
  );
};

export default Index;
