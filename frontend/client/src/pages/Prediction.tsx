import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, TrendingUp, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

interface PredictionResult {
  probability: number;
  is_viral_predicted: boolean;
  guideline: string;
  top_features: Array<{ feature: string; impact: number }>;
}

export default function Prediction() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("영상 제목을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // TODO: 실제 백엔드 API URL로 변경 필요
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      const response = await fetch(`${apiUrl}/api/prediction/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("예측 요청에 실패했습니다.");
      }

      const data: PredictionResult = await response.json();
      setResult(data);
      toast.success("예측이 완료되었습니다!");
    } catch (error) {
      console.error(error);
      toast.error("예측 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              홈으로
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              AI 떡상 예측
            </h2>
            <p className="text-muted-foreground">
              영상 정보를 입력하면 AI가 성공 확률을 분석해드립니다.
            </p>
          </div>

          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>영상 정보 입력</CardTitle>
              <CardDescription>
                업로드 예정인 영상의 제목과 설명을 입력해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">영상 제목 *</Label>
                  <Input
                    id="title"
                    placeholder="예: 올리브영 신상 틴트 내돈내산 리뷰"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/200 글자
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">영상 설명 (선택)</Label>
                  <Textarea
                    id="description"
                    placeholder="영상 내용을 간단히 설명해주세요..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/5000 글자
                  </p>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI 예측 시작
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  예측 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Probability */}
                <div className="text-center space-y-2">
                  <div className="text-6xl font-bold text-primary">
                    {result.probability.toFixed(1)}%
                  </div>
                  <div className="text-lg text-muted-foreground">
                    {result.is_viral_predicted ? (
                      <span className="text-green-500 font-semibold">
                        🎉 떡상 가능성 높음!
                      </span>
                    ) : (
                      <span className="text-yellow-500 font-semibold">
                        💡 개선이 필요합니다
                      </span>
                    )}
                  </div>
                </div>

                {/* Guideline */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">AI 성장 가이드라인</h3>
                  <div className="rounded-lg bg-secondary/50 p-4 whitespace-pre-line text-sm">
                    {result.guideline}
                  </div>
                </div>

                {/* Top Features */}
                {result.top_features.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">주요 영향 요인</h3>
                    <div className="space-y-2">
                      {result.top_features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                        >
                          <span className="text-sm font-medium">
                            {feature.feature.replace("keyword_", "")}
                          </span>
                          <span className="text-sm text-primary font-semibold">
                            +{(feature.impact * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => {
                      setTitle("");
                      setDescription("");
                      setResult(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    다른 영상 예측하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
