"""
더미 리포트 생성 스크립트 (테스트용)
"""
import asyncio
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent))

from app.db.supabase_client import supabase

# 더미 뷰티 영상 데이터
DUMMY_REPORTS = [
    {
        "video_id": "beauty_2025_001",
        "video_url": "https://www.youtube.com/watch?v=example001",
        "title": "2025 봄 메이크업 트렌드 완벽 정리 | 핑크 블러쉬가 대세!",
        "channel_name": "뷰티크리에이터A",
        "view_count": 245000,
        "like_count": 8900,
        "comment_count": 432,
        "published_at": (datetime.now() - timedelta(days=1)).isoformat(),
        "thumbnail_url": "https://i.ytimg.com/vi/example001/maxresdefault.jpg",
        "analysis_report": """# 🎯 영상 분석 리포트

## 📊 성공 요인 분석

### 1. 트렌드 타이밍 ⭐⭐⭐⭐⭐
- **봄 시즌 메이크업**이라는 시의적절한 주제 선택
- 2025년 최신 트렌드를 빠르게 반영
- 핑크 블러쉬 트렌드를 정확하게 포착

### 2. 썸네일 전략 ⭐⭐⭐⭐
- 밝고 화사한 핑크 톤 사용
- Before/After 비교로 시각적 임팩트
- 한눈에 들어오는 텍스트 배치

### 3. 콘텐츠 구성 ⭐⭐⭐⭐⭐
- 명확한 단계별 튜토리얼
- 제품 정보 상세 제공
- 실용적인 팁 포함

## 💡 개선 제안

1. **영상 길이 최적화**: 현재 15분 → 10분으로 단축 권장
2. **자막 추가**: 핵심 포인트에 자막 효과 추가
3. **제품 링크**: 설명란에 제품 구매 링크 추가

## 🎬 예상 성장 가능성

- **단기(1주)**: 50만 조회수 돌파 예상
- **중기(1개월)**: 100만 조회수 가능
- **떡상 확률**: 85%

## 🔑 핵심 키워드
- 봄 메이크업
- 핑크 블러쉬
- 2025 트렌드
- 뷰티 튜토리얼
""",
        "success_score": 85,
        "trending_keywords": ["봄메이크업", "핑크블러쉬", "2025트렌드", "뷰티튜토리얼"]
    },
    {
        "video_id": "beauty_2025_002",
        "video_url": "https://www.youtube.com/watch?v=example002",
        "title": "올리브영 1월 득템 리스트 | 가성비 신상품 BEST 10",
        "channel_name": "뷰티크리에이터B",
        "view_count": 189000,
        "like_count": 7200,
        "comment_count": 356,
        "published_at": (datetime.now() - timedelta(hours=18)).isoformat(),
        "thumbnail_url": "https://i.ytimg.com/vi/example002/maxresdefault.jpg",
        "analysis_report": """# 🎯 영상 분석 리포트

## 📊 성공 요인 분석

### 1. 실용성 ⭐⭐⭐⭐⭐
- **올리브영 득템**이라는 대중적 관심사
- 가성비 중심의 제품 선정
- 실제 구매 가능한 제품 소개

### 2. 타이밍 ⭐⭐⭐⭐
- 1월 신상품 출시 시즌과 맞춤
- 새해 뷰티 쇼핑 수요 반영

### 3. 구성 ⭐⭐⭐⭐
- BEST 10 형식으로 명확한 구조
- 각 제품별 상세 리뷰
- 가격 정보 명시

## 💡 개선 제안

1. **제품 스와치**: 실제 피부 톤별 발색 비교
2. **가격 비교**: 다른 브랜드 유사 제품과 비교
3. **쿠폰 정보**: 할인 쿠폰 정보 추가

## 🎬 예상 성장 가능성

- **단기(1주)**: 30만 조회수 예상
- **중기(1개월)**: 70만 조회수 가능
- **떡상 확률**: 72%

## 🔑 핵심 키워드
- 올리브영
- 득템리스트
- 가성비
- 신상품
""",
        "success_score": 72,
        "trending_keywords": ["올리브영", "득템리스트", "가성비", "신상품"]
    },
    {
        "video_id": "beauty_2025_003",
        "video_url": "https://www.youtube.com/watch?v=example003",
        "title": "피부과 의사가 알려주는 겨울 피부 관리법 | 건조함 완벽 해결",
        "channel_name": "뷰티닥터C",
        "view_count": 312000,
        "like_count": 11500,
        "comment_count": 589,
        "published_at": (datetime.now() - timedelta(days=2)).isoformat(),
        "thumbnail_url": "https://i.ytimg.com/vi/example003/maxresdefault.jpg",
        "analysis_report": """# 🎯 영상 분석 리포트

## 📊 성공 요인 분석

### 1. 전문성 ⭐⭐⭐⭐⭐
- **피부과 의사**라는 권위 있는 출처
- 과학적 근거 기반 설명
- 신뢰도 높은 정보 제공

### 2. 시즌 적합성 ⭐⭐⭐⭐⭐
- 겨울철 필수 정보
- 건조함이라는 보편적 고민 해결
- 즉시 적용 가능한 실용 팁

### 3. 콘텐츠 깊이 ⭐⭐⭐⭐⭐
- 단순 제품 추천이 아닌 원리 설명
- 피부 타입별 맞춤 솔루션
- Q&A 형식으로 궁금증 해소

## 💡 개선 제안

1. **제품 추천**: 구체적인 제품명 언급
2. **루틴 예시**: 아침/저녁 루틴 시연
3. **비포/애프터**: 실제 사용 전후 비교

## 🎬 예상 성장 가능성

- **단기(1주)**: 50만 조회수 돌파 예상
- **중기(1개월)**: 150만 조회수 가능
- **떡상 확률**: 92%

## 🔑 핵심 키워드
- 피부과의사
- 겨울피부관리
- 건조함해결
- 전문가팁
""",
        "success_score": 92,
        "trending_keywords": ["피부과의사", "겨울피부관리", "건조함해결", "전문가팁"]
    }
]

async def main():
    """
    더미 리포트 생성
    """
    print("=" * 60)
    print("🎯 더미 리포트 생성 (테스트용)")
    print("=" * 60)
    
    # 환경 변수 확인
    print("\n📋 환경 변수 확인:")
    print(f"  - SUPABASE_URL: {'✅' if os.getenv('SUPABASE_URL') else '❌'}")
    print(f"  - SUPABASE_KEY: {'✅' if os.getenv('SUPABASE_KEY') else '❌'}")
    
    print(f"\n📊 총 {len(DUMMY_REPORTS)}개 더미 리포트 생성 시작...")
    
    created_reports = []
    
    for i, report_data in enumerate(DUMMY_REPORTS, 1):
        try:
            print(f"\n[{i}/{len(DUMMY_REPORTS)}] {report_data['title']}")
            
            # 기존 리포트 확인
            existing = supabase.table('video_reports').select('*').eq('video_id', report_data['video_id']).execute()
            
            if existing.data:
                print(f"  ℹ️  이미 존재하는 리포트")
                created_reports.append(existing.data[0])
                continue
            
            # Supabase에 저장
            result = supabase.table('video_reports').insert(report_data).execute()
            
            if result.data:
                print(f"  ✅ 리포트 생성 완료: {result.data[0]['id']}")
                created_reports.append(result.data[0])
            else:
                print(f"  ❌ 리포트 생성 실패")
                
        except Exception as e:
            print(f"  ❌ 오류 발생: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # 결과 요약
    print("\n" + "=" * 60)
    print(f"✅ 완료! 총 {len(created_reports)}개 리포트 생성")
    print("=" * 60)
    
    for report in created_reports:
        print(f"\n📄 {report['title']}")
        print(f"   - 성공 점수: {report['success_score']}/100")
        print(f"   - 조회수: {report['view_count']:,}")
        print(f"   - 리포트 ID: {report['id']}")
    
    print(f"\n🌐 웹사이트에서 확인: https://cnecplus.onrender.com/reports")

if __name__ == "__main__":
    asyncio.run(main())
