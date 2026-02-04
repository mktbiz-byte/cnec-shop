'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search,
  Upload,
  Mail,
  UserPlus,
  Send,
  FileSpreadsheet,
  BookUser,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';

// =============================================================
// 타입 정의
// =============================================================

interface CreatorRow {
  id: string;
  email: string;
  name: string;
  channel?: string;
  subscribers?: string;
  category?: string;
  country?: string;
  selected: boolean;
}

interface StibeeAddressBook {
  id: number;
  name: string;
  subscriberCount?: number;
}

// =============================================================
// 구글 시트 CSV 파서
// =============================================================

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

// 이메일 유효성 검사
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =============================================================
// 메인 컴포넌트
// =============================================================

export default function YoutuberSearchPage() {
  // 크리에이터 목록 상태
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // 스티비 설정 상태
  const [stibeeApiKey, setStibeeApiKey] = useState('');
  const [addressBooks, setAddressBooks] = useState<StibeeAddressBook[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [autoEmailUrl, setAutoEmailUrl] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(false);

  // 이메일 템플릿 다이얼로그
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);

  // =============================================================
  // 구글 시트 CSV 가져오기
  // =============================================================

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      toast.error('CSV 또는 TSV 파일만 업로드할 수 있습니다.');
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);

        const mapped: CreatorRow[] = rows
          .map((row, idx) => {
            // 여러 가능한 이메일 컬럼명 시도
            const email =
              row['email'] || row['Email'] || row['이메일'] || row['EMAIL'] || '';
            const name =
              row['name'] || row['Name'] || row['이름'] || row['채널명'] || row['channel'] || '';
            const channel =
              row['channel'] || row['Channel'] || row['채널'] || row['youtube'] || row['YouTube'] || '';
            const subscribers =
              row['subscribers'] || row['Subscribers'] || row['구독자'] || row['구독자수'] || '';
            const category =
              row['category'] || row['Category'] || row['카테고리'] || row['분야'] || '';
            const country =
              row['country'] || row['Country'] || row['국가'] || '';

            return {
              id: `csv-${idx}`,
              email: email.trim(),
              name: name.trim(),
              channel: channel.trim(),
              subscribers: subscribers.trim(),
              category: category.trim(),
              country: country.trim(),
              selected: false,
            };
          })
          .filter((c) => c.email && isValidEmail(c.email));

        setCreators(mapped);
        toast.success(`${mapped.length}명의 크리에이터를 가져왔습니다.`);

        if (rows.length > mapped.length) {
          const skipped = rows.length - mapped.length;
          toast.warning(`${skipped}건은 이메일이 없거나 유효하지 않아 제외되었습니다.`);
        }
      } catch {
        toast.error('파일을 파싱할 수 없습니다. CSV 형식을 확인하세요.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
    // reset input
    e.target.value = '';
  }, []);

  // =============================================================
  // 스티비 주소록 불러오기
  // =============================================================

  const fetchAddressBooks = async () => {
    if (!stibeeApiKey) {
      toast.error('스티비 API 키를 입력하세요.');
      return;
    }
    setLoadingBooks(true);
    try {
      const resp = await fetch('https://api.stibee.com/v2/lists', {
        headers: {
          'Content-Type': 'application/json',
          AccessToken: stibeeApiKey,
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const lists: StibeeAddressBook[] = (data?.data || data || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          id: item.id,
          name: item.name,
          subscriberCount: item.subscriberCount,
        })
      );
      setAddressBooks(lists);
      if (lists.length > 0 && !selectedListId) {
        setSelectedListId(lists[0].id);
      }
      toast.success(`${lists.length}개의 주소록을 불러왔습니다.`);
    } catch (err) {
      console.error(err);
      toast.error('주소록을 불러올 수 없습니다. API 키를 확인하세요.');
    } finally {
      setLoadingBooks(false);
    }
  };

  // =============================================================
  // 선택된 크리에이터를 스티비 주소록에 추가
  // =============================================================

  const addToAddressBook = async () => {
    const selected = creators.filter((c) => c.selected);
    if (selected.length === 0) {
      toast.error('추가할 크리에이터를 선택하세요.');
      return;
    }
    if (!selectedListId) {
      toast.error('주소록을 선택하세요.');
      return;
    }
    if (!stibeeApiKey) {
      toast.error('스티비 API 키를 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const subscribers = selected.map((c) => ({
        email: c.email,
        name: c.name,
        ...(c.channel && { channel: c.channel }),
        ...(c.category && { category: c.category }),
        ...(c.country && { country: c.country }),
      }));

      const resp = await fetch(
        `https://api.stibee.com/v2/lists/${selectedListId}/subscribers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            AccessToken: stibeeApiKey,
          },
          body: JSON.stringify({
            eventOccuredBy: 'MANUAL',
            confirmEmailYN: 'N',
            subscribers,
          }),
        }
      );

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      const successCount = result?.data?.success?.length || selected.length;
      toast.success(`${successCount}명이 주소록에 추가되었습니다.`);

      // 추가된 크리에이터 선택 해제
      setCreators((prev) =>
        prev.map((c) => (c.selected ? { ...c, selected: false } : c))
      );
    } catch (err) {
      console.error(err);
      toast.error('주소록 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // 자동 이메일 발송
  // =============================================================

  const sendEmails = async () => {
    const selected = creators.filter((c) => c.selected);
    if (selected.length === 0) {
      toast.error('발송할 크리에이터를 선택하세요.');
      return;
    }
    if (!autoEmailUrl) {
      toast.error('자동 이메일 트리거 URL을 입력하세요.');
      return;
    }
    if (!stibeeApiKey) {
      toast.error('스티비 API 키를 입력하세요.');
      return;
    }

    setSending(true);
    setSendResults(null);

    let successCount = 0;
    let failCount = 0;

    for (const creator of selected) {
      try {
        const payload: Record<string, string> = {
          subscriber: creator.email,
        };
        if (creator.name) payload.name = creator.name;
        if (creator.channel) payload.channel = creator.channel;

        const resp = await fetch(autoEmailUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            AccessToken: stibeeApiKey,
          },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }

      // Rate limit: 3 requests/second
      await new Promise((r) => setTimeout(r, 350));
    }

    setSendResults({
      total: selected.length,
      success: successCount,
      failed: failCount,
    });
    setSending(false);

    if (failCount === 0) {
      toast.success(`${successCount}건의 이메일 발송이 요청되었습니다.`);
    } else {
      toast.warning(
        `성공: ${successCount}건, 실패: ${failCount}건`
      );
    }
  };

  // =============================================================
  // 선택 관리
  // =============================================================

  const selectedCount = creators.filter((c) => c.selected).length;

  const toggleAll = (checked: boolean) => {
    const filtered = filteredCreators.map((c) => c.id);
    setCreators((prev) =>
      prev.map((c) => (filtered.includes(c.id) ? { ...c, selected: checked } : c))
    );
  };

  const toggleOne = (id: string) => {
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const removeSelected = () => {
    setCreators((prev) => prev.filter((c) => !c.selected));
    toast.success('선택한 크리에이터를 삭제했습니다.');
  };

  // 검색 필터
  const filteredCreators = creators.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.channel || '').toLowerCase().includes(search.toLowerCase())
  );

  const allFilteredSelected =
    filteredCreators.length > 0 && filteredCreators.every((c) => c.selected);

  // =============================================================
  // 렌더링
  // =============================================================

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-headline font-bold">크리에이터 이메일 관리</h1>
        <p className="text-muted-foreground">
          구글 시트에서 크리에이터를 가져오고, 스티비 주소록에 추가하고, 이메일을 발송합니다.
        </p>
      </div>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            크리에이터 가져오기
          </TabsTrigger>
          <TabsTrigger value="stibee">
            <BookUser className="h-4 w-4 mr-2" />
            스티비 연동
          </TabsTrigger>
          <TabsTrigger value="send">
            <Mail className="h-4 w-4 mr-2" />
            이메일 발송
          </TabsTrigger>
        </TabsList>

        {/* =========================================================== */}
        {/* 탭 1: 크리에이터 가져오기 */}
        {/* =========================================================== */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                구글 시트에서 가져오기
              </CardTitle>
              <CardDescription>
                구글 시트를 CSV로 내보내기 한 후 업로드하세요. 이메일, 이름, 채널명 등의 컬럼이 자동으로 매핑됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 가져오기 방법 안내 */}
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">구글 시트에서 CSV 내보내기 방법:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>구글 시트에서 <strong>파일 &gt; 다운로드 &gt; 쉼표로 구분된 값(.csv)</strong> 선택</li>
                  <li>다운로드된 CSV 파일을 아래에서 업로드</li>
                  <li>이메일 컬럼은 필수입니다 (email, Email, 이메일 등의 헤더 지원)</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  지원하는 컬럼: email, name/이름/채널명, channel/채널, subscribers/구독자, category/카테고리, country/국가
                </p>
              </div>

              {/* 파일 업로드 */}
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="csv-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV 파일 업로드
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv,.tsv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {creators.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {creators.length}명의 크리에이터가 로드됨
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 크리에이터 목록 */}
          {creators.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>크리에이터 목록</CardTitle>
                    <CardDescription>
                      {selectedCount > 0
                        ? `${selectedCount}명 선택됨 / 전체 ${filteredCreators.length}명`
                        : `전체 ${filteredCreators.length}명`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="이메일, 이름, 채널 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {selectedCount > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeSelected}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        선택 삭제
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allFilteredSelected}
                            onCheckedChange={(checked) =>
                              toggleAll(checked === true)
                            }
                          />
                        </TableHead>
                        <TableHead>이메일</TableHead>
                        <TableHead>이름</TableHead>
                        <TableHead>채널</TableHead>
                        <TableHead>구독자</TableHead>
                        <TableHead>카테고리</TableHead>
                        <TableHead>국가</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCreators.map((creator) => (
                        <TableRow key={creator.id}>
                          <TableCell>
                            <Checkbox
                              checked={creator.selected}
                              onCheckedChange={() => toggleOne(creator.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {creator.email}
                          </TableCell>
                          <TableCell>{creator.name || '-'}</TableCell>
                          <TableCell>{creator.channel || '-'}</TableCell>
                          <TableCell>{creator.subscribers || '-'}</TableCell>
                          <TableCell>
                            {creator.category ? (
                              <Badge variant="outline">{creator.category}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {creator.country ? (
                              <Badge variant="secondary">{creator.country}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* =========================================================== */}
        {/* 탭 2: 스티비 연동 */}
        {/* =========================================================== */}
        <TabsContent value="stibee" className="space-y-4">
          {/* API 키 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookUser className="h-5 w-5" />
                스티비 API 연동
              </CardTitle>
              <CardDescription>
                스티비 워크스페이스 설정에서 API 키를 생성하고 입력하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">스티비 API 키 생성 방법:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>스티비 로그인 후 <strong>워크스페이스 설정 &gt; API 키</strong> 이동</li>
                  <li><strong>+ 새로 만들기</strong> 클릭하여 API 키 생성</li>
                  <li>생성된 API 키를 아래에 입력</li>
                </ol>
              </div>

              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>스티비 API 키</Label>
                  <Input
                    type="password"
                    placeholder="스티비 API 키를 입력하세요..."
                    value={stibeeApiKey}
                    onChange={(e) => setStibeeApiKey(e.target.value)}
                  />
                </div>
                <Button onClick={fetchAddressBooks} disabled={loadingBooks}>
                  {loadingBooks ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BookUser className="h-4 w-4 mr-2" />
                  )}
                  주소록 불러오기
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 주소록 목록 및 구독자 추가 */}
          {addressBooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>주소록 선택</CardTitle>
                <CardDescription>
                  크리에이터를 추가할 주소록을 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {addressBooks.map((book) => (
                    <label
                      key={book.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedListId === book.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="addressBook"
                          checked={selectedListId === book.id}
                          onChange={() => setSelectedListId(book.id)}
                          className="accent-primary"
                        />
                        <div>
                          <p className="font-medium">{book.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {book.id}
                            {book.subscriberCount !== undefined &&
                              ` | ${book.subscriberCount}명`}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={addToAddressBook}
                    disabled={loading || selectedCount === 0}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    선택한 {selectedCount}명을 주소록에 추가
                  </Button>
                  {selectedCount === 0 && (
                    <span className="text-sm text-muted-foreground">
                      &larr; 먼저 &quot;크리에이터 가져오기&quot; 탭에서 크리에이터를 선택하세요
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 스티비 주소록 생성 안내 */}
          <Card>
            <CardHeader>
              <CardTitle>주소록이 없으시면?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">스티비에서 새 주소록 만들기:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>스티비 대시보드 &gt; <strong>주소록</strong> 메뉴 이동</li>
                  <li><strong>+ 주소록 만들기</strong> 클릭</li>
                  <li>주소록 이름 입력 (예: &quot;크리에이터 리스트&quot;)</li>
                  <li>생성 후 위에서 <strong>주소록 불러오기</strong>를 다시 클릭</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================== */}
        {/* 탭 3: 이메일 발송 */}
        {/* =========================================================== */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                자동 이메일 발송
              </CardTitle>
              <CardDescription>
                스티비 자동 이메일 기능을 사용하여 선택한 크리에이터에게 이메일을 발송합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 자동 이메일 설정 방법 안내 */}
              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">스티비 자동 이메일 설정 방법:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>스티비 대시보드 &gt; <strong>자동 이메일</strong> &gt; <strong>+ 새로 만들기</strong></li>
                  <li>트리거를 <strong>&quot;API로 직접 요청&quot;</strong>으로 설정</li>
                  <li>이메일 템플릿 작성 (제목, 본문 디자인)</li>
                  <li>
                    본문에서 커스텀 필드 사용 가능: <code className="bg-muted px-1 rounded">{'$%name%$'}</code>,{' '}
                    <code className="bg-muted px-1 rounded">{'$%channel%$'}</code> 등
                  </li>
                  <li>설정 완료 후 표시되는 <strong>트리거 URL</strong>을 아래에 입력</li>
                </ol>
              </div>

              {/* 이메일 템플릿 안내 */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 space-y-2">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  스티비 메일 템플릿 만드는 방법:
                </p>
                <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
                  <li>스티비 대시보드 &gt; <strong>이메일</strong> &gt; <strong>+ 새로 만들기</strong></li>
                  <li>템플릿 종류 선택 (드래그앤드롭 에디터 / HTML 직접 입력)</li>
                  <li>발신자, 제목, 프리헤더 설정</li>
                  <li>본문에 로고, 이미지, 텍스트, 버튼 등을 드래그하여 배치</li>
                  <li>
                    개인화를 위해 구독자 필드 삽입:{' '}
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'$%name%$'}</code> = 이름,{' '}
                    <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'$%email%$'}</code> = 이메일
                  </li>
                  <li>미리보기 &amp; 테스트 발송으로 확인 후 저장</li>
                </ol>
              </div>

              {/* 트리거 URL 입력 */}
              <div className="space-y-2">
                <Label>자동 이메일 트리거 URL</Label>
                <Input
                  placeholder="https://stibee.com/api/v1.0/auto/..."
                  value={autoEmailUrl}
                  onChange={(e) => setAutoEmailUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  스티비 자동 이메일 설정 화면에서 복사할 수 있습니다.
                </p>
              </div>

              {/* 발송 액션 */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    if (selectedCount === 0) {
                      toast.error('크리에이터를 선택하세요.');
                      return;
                    }
                    if (!autoEmailUrl) {
                      toast.error('트리거 URL을 입력하세요.');
                      return;
                    }
                    if (!stibeeApiKey) {
                      toast.error('스티비 연동 탭에서 API 키를 먼저 입력하세요.');
                      return;
                    }
                    setShowEmailDialog(true);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  선택한 {selectedCount}명에게 이메일 발송
                </Button>
                {selectedCount === 0 && (
                  <span className="text-sm text-muted-foreground">
                    &larr; &quot;크리에이터 가져오기&quot; 탭에서 크리에이터를 선택하세요
                  </span>
                )}
              </div>

              {/* 발송 결과 */}
              {sendResults && (
                <div className="rounded-lg border p-4 space-y-2">
                  <p className="font-medium">발송 결과</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">성공: {sendResults.success}건</span>
                    </div>
                    {sendResults.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">실패: {sendResults.failed}건</span>
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                      / 전체 {sendResults.total}건
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    200 OK 응답은 발송 요청이 접수된 것이며, 실제 발송 결과는 스티비 대시보드에서 확인하세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================== */}
      {/* 이메일 발송 확인 다이얼로그 */}
      {/* =========================================================== */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이메일 발송 확인</DialogTitle>
            <DialogDescription>
              선택한 {selectedCount}명의 크리에이터에게 자동 이메일을 발송합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <p className="text-sm">
              <strong>트리거 URL:</strong>{' '}
              <code className="text-xs bg-muted px-1 rounded break-all">
                {autoEmailUrl}
              </code>
            </p>
            <p className="text-sm">
              <strong>발송 대상:</strong> {selectedCount}명
            </p>
            <p className="text-xs text-muted-foreground">
              이메일은 한 건씩 순차적으로 발송됩니다 (초당 최대 3건). 발송 완료까지 잠시 기다려주세요.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={sending}
            >
              취소
            </Button>
            <Button
              onClick={async () => {
                setShowEmailDialog(false);
                await sendEmails();
              }}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              발송 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
