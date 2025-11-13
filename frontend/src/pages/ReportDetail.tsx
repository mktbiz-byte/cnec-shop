import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Eye, ThumbsUp, MessageCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Streamdown } from "streamdown";

interface VideoReport {
  id: string;
  video_id: string;
  video_url: string;
  title: string;
  channel_name: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  thumbnail_url: string;
  analysis_report: string;
  success_score: number;
  trending_keywords: string[];
  created_at: string;
}

export default function ReportDetail() {
  const [, params] = useRoute("/reports/:id");
  const [report, setReport] = useState<VideoReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchReport(params.id);
    }
  }, [params?.id]);

  const fetchReport = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://cnecplus.onrender.com/api/reports/${id}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error("리포트 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString("ko-KR");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 text-lg">리포트를 찾을 수 없습니다.</p>
            <Link href="/reports">
              <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600">
                목록으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 뒤로 가기 */}
        <Link href="/reports">
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </Link>

        {/* 영상 정보 카드 */}
        <Card className="mb-8 bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <img
              src={report.thumbnail_url}
              alt={report.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-lg px-4 py-2">
                <TrendingUp className="w-5 h-5 mr-2" />
                성공 점수: {report.success_score}/100
              </Badge>
            </div>
          </div>

          <CardHeader>
            <CardTitle className="text-2xl text-white mb-2">{report.title}</CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-lg">{report.channel_name}</p>
              <a
                href={report.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
              >
                유튜브에서 보기
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </CardHeader>

          <CardContent>
            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <Eye className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl font-bold text-white">{formatNumber(report.view_count)}</div>
                <div className="text-sm text-gray-400">조회수</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <ThumbsUp className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                <div className="text-2xl font-bold text-white">{formatNumber(report.like_count)}</div>
                <div className="text-sm text-gray-400">좋아요</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold text-white">{formatNumber(report.comment_count)}</div>
                <div className="text-sm text-gray-400">댓글</div>
              </div>
            </div>

            {/* 트렌드 키워드 */}
            {report.trending_keywords && report.trending_keywords.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">🔥 트렌드 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {report.trending_keywords.map((keyword, idx) => (
                    <Badge key={idx} className="bg-purple-600/20 text-purple-300 border-purple-500/50">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 게시일 */}
            <div className="text-sm text-gray-500">
              게시일: {formatDate(report.published_at)} | 분석일: {formatDate(report.created_at)}
            </div>
          </CardContent>
        </Card>

        {/* AI 분석 리포트 */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white">AI 분석 리포트</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="text-gray-300">
              <Streamdown>{report.analysis_report}</Streamdown>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
