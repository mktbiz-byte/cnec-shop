"""
오늘의 뷰티 급상승 영상 리포트 생성 스크립트
"""
import asyncio
import os
import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).parent))

from app.services.video_analyzer import analyze_video
from app.db.supabase_client import supabase

# 테스트용 뷰티 영상 URL 목록 (실제 급상승 영상)
TEST_VIDEOS = [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # 테스트용
    # 실제 영상 URL을 여기에 추가
]

async def generate_report_for_video(video_url: str):
    """
    단일 영상에 대한 리포트 생성
    """
    try:
        print(f"\n🎬 분석 시작: {video_url}")
        
        # 1. 영상 분석
        analysis_data = await analyze_video(video_url)
        if not analysis_data:
            print(f"❌ 영상 분석 실패: {video_url}")
            return None
        
        print(f"✅ 영상 분석 완료: {analysis_data['title']}")
        
        # 2. 기존 리포트 확인
        existing = supabase.table('video_reports').select('*').eq('video_id', analysis_data['video_id']).execute()
        
        if existing.data:
            print(f"ℹ️  이미 존재하는 리포트: {analysis_data['video_id']}")
            return existing.data[0]
        
        # 3. Supabase에 저장
        insert_data = {
            'video_id': analysis_data['video_id'],
            'video_url': analysis_data['video_url'],
            'title': analysis_data['title'],
            'channel_name': analysis_data.get('channel_name'),
            'view_count': analysis_data.get('view_count'),
            'like_count': analysis_data.get('like_count'),
            'comment_count': analysis_data.get('comment_count'),
            'published_at': analysis_data.get('published_at'),
            'thumbnail_url': analysis_data.get('thumbnail_url'),
            'analysis_report': analysis_data['analysis_report'],
            'success_score': analysis_data.get('success_score'),
            'trending_keywords': analysis_data.get('trending_keywords', [])
        }
        
        result = supabase.table('video_reports').insert(insert_data).execute()
        
        if result.data:
            print(f"💾 리포트 저장 완료: {result.data[0]['id']}")
            return result.data[0]
        else:
            print(f"❌ 리포트 저장 실패")
            return None
            
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

async def main():
    """
    메인 함수
    """
    print("=" * 60)
    print("🎯 오늘의 뷰티 급상승 영상 리포트 생성")
    print("=" * 60)
    
    # 환경 변수 확인
    print("\n📋 환경 변수 확인:")
    print(f"  - SUPABASE_URL: {'✅' if os.getenv('SUPABASE_URL') else '❌'}")
    print(f"  - SUPABASE_KEY: {'✅' if os.getenv('SUPABASE_KEY') else '❌'}")
    print(f"  - GEMINI_API_KEY: {'✅' if os.getenv('GEMINI_API_KEY') else '❌'}")
    print(f"  - YOUTUBE_API_KEY: {'✅' if os.getenv('YOUTUBE_API_KEY') else '❌'}")
    
    # 테스트 영상 분석
    print(f"\n📊 총 {len(TEST_VIDEOS)}개 영상 분석 시작...")
    
    reports = []
    for i, video_url in enumerate(TEST_VIDEOS, 1):
        print(f"\n[{i}/{len(TEST_VIDEOS)}]")
        report = await generate_report_for_video(video_url)
        if report:
            reports.append(report)
        
        # API 호출 제한 방지를 위한 대기
        if i < len(TEST_VIDEOS):
            await asyncio.sleep(2)
    
    # 결과 요약
    print("\n" + "=" * 60)
    print(f"✅ 완료! 총 {len(reports)}개 리포트 생성")
    print("=" * 60)
    
    for report in reports:
        print(f"\n📄 {report['title']}")
        print(f"   - 성공 점수: {report['success_score']}/100")
        print(f"   - 조회수: {report['view_count']:,}")
        print(f"   - URL: https://cnecplus.onrender.com/reports/{report['id']}")

if __name__ == "__main__":
    asyncio.run(main())
