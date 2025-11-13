import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [creatorType, setCreatorType] = useState("");
  const [subscriberRange, setSubscriberRange] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("이메일 주소를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: 실제 백엔드 API URL로 변경 필요
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      const response = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: name || undefined,
          creator_type: creatorType || undefined,
          subscriber_count_range: subscriberRange || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("구독 신청에 실패했습니다.");
      }

      const data = await response.json();
      
      if (data.success) {
        setIsSubscribed(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("구독 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
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

        <div className="container py-24">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-4xl font-bold">구독 완료!</h2>
            <p className="text-xl text-muted-foreground">
              매주 월요일 오전, AI가 분석한 최신 트렌드와 성공 공식을 이메일로 받아보실 수 있습니다.
            </p>
            <div className="pt-6">
              <Link href="/">
                <Button size="lg">홈으로 돌아가기</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold flex items-center justify-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              주간 뉴스레터
            </h2>
            <p className="text-muted-foreground">
              매주 월요일, AI가 분석한 성장 인사이트를 받아보세요.
            </p>
          </div>

          {/* Benefits */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>뉴스레터에서 받아볼 내용</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">주간 트렌드 키워드</h4>
                  <p className="text-sm text-muted-foreground">
                    이번 주 가장 핫한 뷰티 키워드와 검색량 분석
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">성공 패턴 분석</h4>
                  <p className="text-sm text-muted-foreground">
                    떡상한 영상들의 공통점과 성공 공식
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">AI 추천 전략</h4>
                  <p className="text-sm text-muted-foreground">
                    다음 주에 시도해볼 콘텐츠 아이디어와 최적 업로드 시간
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Form */}
          <Card>
            <CardHeader>
              <CardTitle>구독 신청</CardTitle>
              <CardDescription>
                이메일 주소만 입력하시면 바로 구독하실 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 주소 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="creator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">이름 (선택)</Label>
                  <Input
                    id="name"
                    placeholder="김뷰티"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creator-type">크리에이터 유형 (선택)</Label>
                  <Select value={creatorType} onValueChange={setCreatorType}>
                    <SelectTrigger id="creator-type">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="뷰티">뷰티</SelectItem>
                      <SelectItem value="패션">패션</SelectItem>
                      <SelectItem value="라이프스타일">라이프스타일</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriber-range">구독자 규모 (선택)</Label>
                  <Select value={subscriberRange} onValueChange={setSubscriberRange}>
                    <SelectTrigger id="subscriber-range">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1천 미만">1천 미만</SelectItem>
                      <SelectItem value="1천-1만">1천-1만</SelectItem>
                      <SelectItem value="1만-5만">1만-5만</SelectItem>
                      <SelectItem value="5만-10만">5만-10만</SelectItem>
                      <SelectItem value="10만 이상">10만 이상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Mail className="h-4 w-4 animate-pulse" />
                      구독 신청 중...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      뉴스레터 구독하기
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  구독하시면 개인정보 처리방침에 동의하는 것으로 간주됩니다.
                  <br />
                  언제든지 구독을 취소하실 수 있습니다.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
