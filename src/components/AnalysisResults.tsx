import { useState, useEffect, useRef } from "react";
import { RotateCcw, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisResultsProps {
  imageData: string;
  markers: {
    ball: { x: number; y: number };
    hole: { x: number; y: number };
  };
  onReset: () => void;
}

interface AnalysisData {
  puttingLine: {
    direction: string;
    break: string;
    confidence: string;
  };
  recommendations: string[];
}

export const AnalysisResults = ({ imageData, markers, onReset }: AnalysisResultsProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    analyzeGreen();
  }, []);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      });
    }
  };

  // Create curved path for putting line with break
  const createPuttingPath = () => {
    if (!imageDimensions.width || !imageDimensions.height) return "";
    
    const startX = (markers.ball.x * imageDimensions.width) / 100;
    const startY = (markers.ball.y * imageDimensions.height) / 100;
    const endX = (markers.hole.x * imageDimensions.width) / 100;
    const endY = (markers.hole.y * imageDimensions.height) / 100;
    
    // Calculate control point for bezier curve (simulate break)
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Offset perpendicular to the line to create break
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const breakAmount = length * 0.15; // 15% break
    
    const controlX = midX + (dy / length) * breakAmount;
    const controlY = midY - (dx / length) * breakAmount;
    
    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  };

  const analyzeGreen = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log("Sending image for analysis...");
      
      const { data, error: functionError } = await supabase.functions.invoke("analyze-green", {
        body: { imageData, markers }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Analysis received:", data);
      setAnalysis(data);
      toast.success("Analysis complete!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze the green. Please try again.";
      setError(errorMessage);
      console.error("Analysis error:", err);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-background to-muted flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="relative w-full bg-black">
          <img 
            ref={imageRef}
            src={imageData} 
            alt="Captured green" 
            className="w-full object-contain max-h-[40vh]"
            onLoad={handleImageLoad}
          />
          {imageDimensions.width > 0 && (
            <svg 
              className="absolute inset-0 pointer-events-none"
              width={imageDimensions.width}
              height={imageDimensions.height}
              style={{ 
                left: '50%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)'
              }}
            >
              <defs>
                <linearGradient id="puttLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 0.9 }} />
                  <stop offset="50%" style={{ stopColor: 'rgba(255, 215, 0, 0.95)', stopOpacity: 0.95 }} />
                  <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 0.9 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Putting line with glow effect - PuttView style */}
              {!isAnalyzing && analysis && (
                <>
                  {/* Shadow/glow layer */}
                  <path
                    d={createPuttingPath()}
                    stroke="rgba(255, 215, 0, 0.6)"
                    strokeWidth="12"
                    fill="none"
                    filter="url(#glow)"
                    className="animate-pulse"
                  />
                  {/* Main line */}
                  <path
                    d={createPuttingPath()}
                    stroke="url(#puttLineGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Animated dash overlay */}
                  <path
                    d={createPuttingPath()}
                    stroke="rgba(255, 255, 255, 0.8)"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    className="animate-[dash_1s_linear_infinite]"
                  />
                </>
              )}
              
              {/* Ball marker */}
              <circle
                cx={(markers.ball.x * imageDimensions.width) / 100}
                cy={(markers.ball.y * imageDimensions.height) / 100}
                r="12"
                fill="rgba(34, 197, 94, 0.3)"
                stroke="rgb(34, 197, 94)"
                strokeWidth="3"
              />
              <circle
                cx={(markers.ball.x * imageDimensions.width) / 100}
                cy={(markers.ball.y * imageDimensions.height) / 100}
                r="4"
                fill="rgb(34, 197, 94)"
              />
              
              {/* Hole marker */}
              <circle
                cx={(markers.hole.x * imageDimensions.width) / 100}
                cy={(markers.hole.y * imageDimensions.height) / 100}
                r="12"
                fill="rgba(239, 68, 68, 0.3)"
                stroke="rgb(239, 68, 68)"
                strokeWidth="3"
              />
              <circle
                cx={(markers.hole.x * imageDimensions.width) / 100}
                cy={(markers.hole.y * imageDimensions.height) / 100}
                r="4"
                fill="rgb(239, 68, 68)"
              />
            </svg>
          )}
        </div>

        <div className="p-6 space-y-4">
          {isAnalyzing ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Green...</h3>
              <p className="text-sm text-muted-foreground">
                Our AI is reading the slope and calculating the optimal putting line
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="camera" onClick={analyzeGreen}>
                Try Again
              </Button>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Putting Line Analysis</h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm text-primary mb-1">Aim Point</h4>
                  <p className="text-foreground">{analysis.puttingLine.direction}</p>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm text-primary mb-1">Break Analysis</h4>
                  <p className="text-foreground">{analysis.puttingLine.break}</p>
                </div>

                <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                  <h4 className="font-semibold text-sm text-accent-foreground mb-1">Confidence</h4>
                  <p className="text-foreground">{analysis.puttingLine.confidence}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold text-sm mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <Button 
            variant="outline" 
            size="lg" 
            onClick={onReset}
            className="w-full mt-4"
            disabled={isAnalyzing}
          >
            <RotateCcw className="mr-2" />
            Analyze Another Green
          </Button>
        </div>
      </div>
    </div>
  );
};
