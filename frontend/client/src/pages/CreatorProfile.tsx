import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mail, Youtube, Star, TrendingUp } from "lucide-react";

interface CreatorProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  profile_image_url: string;
  youtube_channel_url: string;
  subscriber_count: number;
  average_views: number;
  sponsorship_rate: number;
  sponsorship_available: boolean;
  preferred_categories: string[];
  featured_videos: Array<{
    video_id: string;
    title: string;
    thumbnail: string;
    views: number;
  }>;
  is_verified: boolean;
}

export default function CreatorProfile() {
  const [, params] = useRoute("/@:username");
  const username = params?.username;
  
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    requested_rate: 0,
    preferred_brands: "",
    message: ""
  });

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`https://cnecplus.onrender.com/api/creators/@${username}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setRequestData(prev => ({ ...prev, requested_rate: data.sponsorship_rate }));
      } else {
        toast.error("프로필을 찾을 수 없습니다");
      }
    } catch (error) {
      toast.error("프로필 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    try {
      const response = await fetch("https://cnecplus.onrender.com/api/sponsorships/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator_id: profile.id,
          requested_rate: requestData.requested_rate,
          preferred_brands: requestData.preferred_brands.split(",").map(b => b.trim()),
          message: requestData.message
        })
      });

      if (response.ok) {
        toast.success("협찬 중개 요청이 접수되었습니다!");
        setRequestDialogOpen(false);
      } else {
        toast.error("요청 실패");
      }
    } catch (error) {
      toast.error("요청 중 오류 발생");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>프로필을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-600">CnecPlus</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={profile.profile_image_url || "https://via.placeholder.com/150"}
                alt={profile.display_name}
                className="w-32 h-32 rounded-full object-cover"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <Star className="w-3 h-3 mr-1" />
                      인증됨
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">@{profile.username}</p>
                
                <p className="text-gray-700 mb-4">{profile.bio}</p>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span className="font-semibold">{profile.subscriber_count.toLocaleString()}</span>
                    <span className="text-gray-600">구독자</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">{profile.average_views.toLocaleString()}</span>
                    <span className="text-gray-600">평균 조회수</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sponsorship Info */}
        {profile.sponsorship_available && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>협찬 문의</span>
                <Badge className="bg-purple-600">500+ 브랜드 네트워크</Badge>
              </CardTitle>
              <CardDescription>
                CnecPlus를 통해 주요 화장품 브랜드와 협업하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">협찬 단가</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {profile.sponsorship_rate.toLocaleString()}원
                  </p>
                </div>
                
                <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      협찬 중개 요청
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>협찬 중개 요청</DialogTitle>
                      <DialogDescription>
                        🎯 CnecPlus 협찬 중개 서비스<br/><br/>
                        ✅ 500개 이상의 화장품 브랜드와 연결<br/>
                        ✅ 전문 매칭으로 최적의 협찬 기회 제공<br/>
                        ✅ 투명한 수수료 구조 (성사 시 30%)
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSponsorshipRequest} className="space-y-4">
                      <div>
                        <Label>희망 협찬 단가 (원)</Label>
                        <Input
                          type="number"
                          value={requestData.requested_rate}
                          onChange={(e) => setRequestData({...requestData, requested_rate: parseInt(e.target.value)})}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label>선호 브랜드 (쉼표로 구분)</Label>
                        <Input
                          placeholder="예: 이니스프리, 에뛰드, 미샤"
                          value={requestData.preferred_brands}
                          onChange={(e) => setRequestData({...requestData, preferred_brands: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <Label>추가 메시지</Label>
                        <Textarea
                          placeholder="협찬 관련 추가 정보를 입력해주세요"
                          value={requestData.message}
                          onChange={(e) => setRequestData({...requestData, message: e.target.value})}
                        />
                      </div>
                      
                      <Button type="submit" className="w-full">요청 제출</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• 성사 시 수수료: 30%</p>
                <p>• 평균 매칭 기간: 7-14일</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Featured Videos */}
        {profile.featured_videos && profile.featured_videos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>대표 영상</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.featured_videos.map((video) => (
                  <a
                    key={video.video_id}
                    href={`https://www.youtube.com/watch?v=${video.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="relative overflow-hidden rounded-lg">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h3 className="mt-2 font-semibold line-clamp-2 group-hover:text-purple-600">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {video.views.toLocaleString()} 조회수
                    </p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
