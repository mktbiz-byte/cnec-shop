import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Sparkles, ArrowLeft, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

interface TrendKeyword {
  keyword: string;
  impact_score: number;
  video_count: number;
  avg_views: number;
}

interface WeeklyTrends {
  week_number: number;
  year: number;
  top_keywords: TrendKeyword[];
  success_patterns: {
    optimal_length?: string;
    best_upload_time?: string;
    thumbnail_type?: string;
  };
  rising_trends: string[];
}

export default function Trends() {
  const [trends, setTrends] = useState<WeeklyTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 백엔드 API URL로 변경 필요
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      const response = await fetch(`${apiUrl}/api/trends/weekly`);
      
      if (!response.ok) {
        throw new Error("트렌드 데이터를 가져오는데 실패했습니다.");
      }

      const data: WeeklyTrends = await response.json();
      setTrends(data);
    } catch (error) {
      console.error(error);
      toast.error("트렌드 데이터를 불러오는 중 오류가 발생했습니다.");
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
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold flex items-center justify-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              실시간 트렌드
            </h2>
            <p className="text-muted-foreground">
              뷰티 카테고리의 최신 트렌드와 성공 패턴을 확인하세요.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">트렌드 데이터를 불러오는 중...</p>
            </div>
          ) : trends ? (
            <>
              {/* Week Info */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>
                    {trends.year}년 {trends.week_number}주차 트렌드
                  </CardTitle>
                  <CardDescription>
                    최근 7일간 수집된 데이터를 기반으로 분석되었습니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Top Keywords */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    상위 트렌드 키워드
                  </CardTitle>
                  <CardDescription>
                    현재 가장 영향력 있는 키워드들입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trends.top_keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{keyword.keyword}</h4>
                            <p className="text-sm text-muted-foreground">
                              {keyword.video_count}개 영상 · 평균 {(keyword.avg_views / 1000).toFixed(1)}K 조회수
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {(keyword.impact_score * 100).toFixed(0)}
                          </div>
                          <div className="text-xs text-muted-foreground">영향력 점수</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Success Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>성공 패턴 분석</CardTitle>
                  <CardDescription>
                    떡상한 영상들의 공통점을 분석했습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-secondary/30 p-4">
                      <div className="text-sm text-muted-foreground mb-1">최적 영상 길이</div>
                      <div className="text-xl font-bold">
                        {trends.success_patterns.optimal_length || "분석 중"}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-secondary/30 p-4">
                      <div className="text-sm text-muted-foreground mb-1">최적 업로드 시간</div>
                      <div className="text-xl font-bold">
                        {trends.success_patterns.best_upload_time || "분석 중"}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-secondary/30 p-4">
                      <div className="text-sm text-muted-foreground mb-1">추천 썸네일 유형</div>
                      <div className="text-xl font-bold">
                        {trends.success_patterns.thumbnail_type || "분석 중"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rising Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>떠오르는 트렌드</CardTitle>
                  <CardDescription>
                    지금 주목해야 할 새로운 키워드들입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {trends.rising_trends.map((trend, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {trend}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refresh Button */}
              <div className="text-center">
                <Button onClick={fetchTrends} variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  데이터 새로고침
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  트렌드 데이터를 불러올 수 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
