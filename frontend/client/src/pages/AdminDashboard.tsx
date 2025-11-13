import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Users, DollarSign, TrendingUp } from "lucide-react";

interface SponsorshipRequest {
  id: string;
  creator_id: string;
  requested_rate: number;
  preferred_brands: string[];
  message: string;
  status: string;
  admin_notes: string;
  final_rate: number | null;
  commission_rate: number;
  commission_amount: number | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<SponsorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SponsorshipRequest | null>(null);
  const [updateData, setUpdateData] = useState({
    status: "",
    admin_notes: "",
    final_rate: 0
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("https://cnecplus.onrender.com/api/sponsorships/");
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      toast.error("데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async (requestId: string) => {
    try {
      const response = await fetch(`https://cnecplus.onrender.com/api/sponsorships/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast.success("업데이트 완료");
        fetchRequests();
        setSelectedRequest(null);
      } else {
        toast.error("업데이트 실패");
      }
    } catch (error) {
      toast.error("오류 발생");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "대기중", className: "bg-yellow-100 text-yellow-800" },
      in_progress: { label: "진행중", className: "bg-blue-100 text-blue-800" },
      completed: { label: "완료", className: "bg-green-100 text-green-800" },
      cancelled: { label: "취소", className: "bg-gray-100 text-gray-800" }
    };
    
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    completed: requests.filter(r => r.status === "completed").length,
    totalRevenue: requests
      .filter(r => r.status === "completed" && r.commission_amount)
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-purple-600">CnecPlus 관리자</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 요청</CardTitle>
              <Users className="w-4 h-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">대기중</CardTitle>
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">완료</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 수수료</CardTitle>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}원</div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>협찬 중개 요청 목록</CardTitle>
            <CardDescription>모든 협찬 중개 요청을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="pending">대기중</TabsTrigger>
                <TabsTrigger value="in_progress">진행중</TabsTrigger>
                <TabsTrigger value="completed">완료</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {requests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(request.status)}
                            <span className="text-sm text-gray-600">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="font-semibold mb-1">
                            희망 단가: {request.requested_rate.toLocaleString()}원
                          </p>
                          
                          {request.preferred_brands.length > 0 && (
                            <p className="text-sm text-gray-600 mb-1">
                              선호 브랜드: {request.preferred_brands.join(", ")}
                            </p>
                          )}
                          
                          {request.message && (
                            <p className="text-sm text-gray-600 mb-2">
                              메시지: {request.message}
                            </p>
                          )}
                          
                          {request.status === "completed" && request.final_rate && (
                            <div className="mt-2 p-3 bg-green-50 rounded">
                              <p className="text-sm font-semibold text-green-800">
                                최종 협찬비: {request.final_rate.toLocaleString()}원
                              </p>
                              <p className="text-sm text-green-700">
                                수수료 (30%): {request.commission_amount?.toLocaleString()}원
                              </p>
                            </div>
                          )}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setUpdateData({
                                  status: request.status,
                                  admin_notes: request.admin_notes || "",
                                  final_rate: request.final_rate || 0
                                });
                              }}
                            >
                              관리
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>요청 관리</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>상태</Label>
                                <Select
                                  value={updateData.status}
                                  onValueChange={(value) => setUpdateData({...updateData, status: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">대기중</SelectItem>
                                    <SelectItem value="in_progress">진행중</SelectItem>
                                    <SelectItem value="completed">완료</SelectItem>
                                    <SelectItem value="cancelled">취소</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>최종 협찬비 (원)</Label>
                                <Input
                                  type="number"
                                  value={updateData.final_rate}
                                  onChange={(e) => setUpdateData({...updateData, final_rate: parseInt(e.target.value)})}
                                />
                              </div>

                              <div>
                                <Label>관리자 메모</Label>
                                <Textarea
                                  value={updateData.admin_notes}
                                  onChange={(e) => setUpdateData({...updateData, admin_notes: e.target.value})}
                                />
                              </div>

                              <Button
                                className="w-full"
                                onClick={() => handleUpdateRequest(request.id)}
                              >
                                업데이트
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* 다른 탭들도 동일한 구조 */}
              <TabsContent value="pending">
                {requests.filter(r => r.status === "pending").map((request) => (
                  <Card key={request.id} className="mb-4">
                    <CardContent className="pt-6">
                      <p>희망 단가: {request.requested_rate.toLocaleString()}원</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
