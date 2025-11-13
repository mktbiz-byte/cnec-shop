import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles, Mail, BarChart3 } from "lucide-react";
import { APP_TITLE } from "@/const";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/prediction">
              <Button variant="ghost">AI 예측</Button>
            </Link>
            <Link href="/trends">
              <Button variant="ghost">트렌드</Button>
            </Link>
            <Link href="/newsletter">
              <Button variant="outline">뉴스레터 구독</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            ✨ AI 기반 성장 컨설팅
          </div>
          <h2 className="text-5xl font-bold tracking-tight">
            뷰티 크리에이터를 위한
            <br />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              떡상 예측 AI
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            데이터 기반 인사이트로 다음 영상의 성공을 예측하고,
            <br />
            매주 최신 트렌드를 받아보세요.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link href="/prediction">
              <Button size="lg" className="gap-2">
                <TrendingUp className="h-5 w-5" />
                지금 예측하기
              </Button>
            </Link>
            <Link href="/newsletter">
              <Button size="lg" variant="outline" className="gap-2">
                <Mail className="h-5 w-5" />
                주간 리포트 받기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI 떡상 예측</CardTitle>
              <CardDescription>
                영상 제목과 설명을 입력하면 AI가 성공 확률을 분석하고 구체적인 개선 가이드를 제공합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/prediction">
                <Button variant="ghost" className="w-full">
                  예측 시작하기 →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <BarChart3 className="h-6 w-6 text-purple-500" />
              </div>
              <CardTitle>실시간 트렌드</CardTitle>
              <CardDescription>
                뷰티 카테고리의 최신 트렌드 키워드와 성공 패턴을 실시간으로 확인하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/trends">
                <Button variant="ghost" className="w-full">
                  트렌드 보기 →
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>주간 뉴스레터</CardTitle>
              <CardDescription>
                매주 월요일, AI가 분석한 성공 공식과 떠오르는 트렌드를 이메일로 받아보세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/newsletter">
                <Button variant="ghost" className="w-full">
                  구독하기 →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 최근 분석 리포트 섹션 */}
      <section className="border-t bg-secondary/30 py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-2">최근 분석된 급상승 영상</h3>
            <p className="text-muted-foreground">AI가 분석한 최신 성공 사례를 확인하세요</p>
          </div>
          <div className="flex justify-center">
            <Link href="/reports">
              <Button size="lg" variant="outline" className="gap-2">
                <BarChart3 className="h-5 w-5" />
                분석 리포트 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-4">© 2025 CnecPlus AI. Powered by AI & YouTube Data API.</p>
            <div className="max-w-3xl mx-auto text-xs space-y-2 border-t pt-4">
              <p className="font-semibold">유튜브 API 사용 약관</p>
              <p>본 서비스는 YouTube API Services를 사용하며, 사용 시 <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">YouTube 서비스 약관</a> 및 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google 개인정보처리방침</a>에 동의하는 것으로 간주됩니다.</p>
              <p>수집된 데이터는 30일 동안 보관되며, YouTube API 정책에 따라 자동으로 삭제됩니다.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
