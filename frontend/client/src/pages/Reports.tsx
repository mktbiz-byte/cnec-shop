import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Eye, ThumbsUp, MessageCircle, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface VideoReport {
  id: string;
  video_id: string;
  video_url: string;
  title: string;
  channel_name: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  thumbnail_url: string;
  success_score: number;
  trending_keywords: string[];
  created_at: string;
}

export default function Reports() {
  const [reports, setReports] = useState<VideoReport[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://cnecplus.onrender.com/api/reports?limit=20");
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("리포트 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };



  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              CnecPlus AI
            </a>
          </Link>
          <nav className="flex gap-6">
            <Link href="/"><a className="text-gray-300 hover:text-white transition">홈</a></Link>
            <Link href="/reports"><a className="text-white font-semibold">리포트</a></Link>
            <Link href="/newsletter"><a className="text-gray-300 hover:text-white transition">뉴스레터</a></Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* 리포트 목록 */}
        <h2 className="text-3xl font-bold text-white mb-8">최근 분석 리포트</h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
        ) : reports.length === 0 ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 text-lg">아직 분석된 영상이 없습니다.</p>
              <p className="text-gray-500 mt-2">위에서 유튜브 URL을 입력하여 첫 리포트를 생성해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`}>
                <a>
                  <Card className="h-full bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition group">
                    {/* 썸네일 */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={report.thumbnail_url}
                        alt={report.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {report.success_score}점
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-white line-clamp-2 text-lg">
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {report.channel_name}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {/* 통계 */}
                      <div className="flex gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(report.view_count)}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {formatNumber(report.like_count)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {formatNumber(report.comment_count)}
                        </div>
                      </div>

                      {/* 트렌드 키워드 */}
                      {report.trending_keywords && report.trending_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {report.trending_keywords.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(report.created_at)}</span>
                        <ExternalLink className="w-4 h-4 group-hover:text-purple-400 transition" />
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
