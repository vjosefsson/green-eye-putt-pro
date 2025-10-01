import { useState, useEffect } from "react";
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

  useEffect(() => {
    analyzeGreen();
  }, []);

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
        <div className="relative w-full">
          <img 
            src={imageData} 
            alt="Captured green" 
            className="w-full object-contain max-h-[40vh]"
          />
          <div className="absolute inset-0 pointer-events-none">
            {/* Ball marker */}
            <div
              className="absolute w-6 h-6 rounded-full border-3 border-green-500 bg-green-500/30 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${markers.ball.x}%`, top: `${markers.ball.y}%` }}
            />
            
            {/* Hole marker */}
            <div
              className="absolute w-6 h-6 rounded-full border-3 border-red-500 bg-red-500/30 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${markers.hole.x}%`, top: `${markers.hole.y}%` }}
            />
            
            {/* Putting line */}
            {!isAnalyzing && analysis && (
              <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line 
                  x1={markers.ball.x} 
                  y1={markers.ball.y} 
                  x2={markers.hole.x} 
                  y2={markers.hole.y} 
                  stroke="hsl(var(--accent))" 
                  strokeWidth="0.5" 
                  strokeDasharray="2,2"
                  className="drop-shadow-lg"
                />
              </svg>
            )}
          </div>
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
