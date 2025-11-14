#!/usr/bin/env python3
"""
YouTube 급상승 뷰티 영상 수집 및 Gemini AI 분석 스크립트
"""
import os
import sys
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수 로드
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Supabase 클라이언트
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Gemini 설정
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def get_trending_beauty_videos(max_results=10):
    """YouTube 급상승 뷰티 영상 가져오기"""
    youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    
    try:
        # 한국 급상승 동영상 가져오기 (뷰티 카테고리)
        request = youtube.videos().list(
            part="snippet,statistics",
            chart="mostPopular",
            regionCode="KR",
            videoCategoryId="26",  # Howto & Style (뷰티 포함)
            maxResults=max_results
        )
        response = request.execute()
        
        videos = []
        for item in response.get('items', []):
            video_id = item['id']
            snippet = item['snippet']
            stats = item['statistics']
            
            # 뷰티 관련 키워드 필터링
            beauty_keywords = ['메이크업', '뷰티', '화장', '스킨케어', '피부', '립스틱', '파운데이션', '아이섀도', '블러쉬', '마스카라']
            title_lower = snippet['title'].lower()
            
            if any(keyword in snippet['title'] for keyword in beauty_keywords):
                video_data = {
                    'video_id': video_id,
                    'video_url': f'https://www.youtube.com/watch?v={video_id}',
                    'title': snippet['title'],
                    'channel_name': snippet['channelTitle'],
                    'view_count': int(stats.get('viewCount', 0)),
                    'like_count': int(stats.get('likeCount', 0)),
                    'comment_count': int(stats.get('commentCount', 0)),
                    'published_at': snippet['publishedAt'],
                    'thumbnail_url': snippet['thumbnails']['high']['url']
                }
                videos.append(video_data)
                print(f"✅ 발견: {snippet['title'][:50]}...")
        
        print(f"\n총 {len(videos)}개의 뷰티 영상 발견")
        return videos
        
    except HttpError as e:
        print(f"YouTube API 오류: {e}")
        return []

def analyze_video_with_gemini(video_data):
    """Gemini AI로 영상 분석"""
    prompt = f"""
당신은 뷰티 크리에이터 전문 분석가입니다. 다음 YouTube 영상을 분석하여 떡상 가능성을 평가하세요.

**영상 정보:**
- 제목: {video_data['title']}
- 채널: {video_data['channel_name']}
- 조회수: {video_data['view_count']:,}
- 좋아요: {video_data['like_count']:,}
- 댓글: {video_data['comment_count']:,}

**분석 요청:**
1. **떡상 점수** (0-100점): 이 영상의 성공 가능성을 점수로 평가
2. **트렌드 키워드** (3-5개): 이 영상과 관련된 핵심 키워드
3. **분석 리포트**: 왜 이 영상이 성공했는지 또는 성공할 가능성이 있는지 분석

**응답 형식 (JSON):**
{{
  "success_score": 85,
  "trending_keywords": ["키워드1", "키워드2", "키워드3"],
  "analysis_report": "# 영상 분석 리포트\\n\\n## 떡상 요인\\n..."
}}
"""
    
    try:
        response = model.generate_content(prompt)
        analysis_text = response.text.strip()
        
        # JSON 파싱
        import json
        import re
        
        # JSON 블록 추출
        json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
        if json_match:
            analysis_json = json.loads(json_match.group(0))
            return analysis_json
        else:
            # JSON 형식이 아닌 경우 기본값 반환
            return {
                "success_score": 50,
                "trending_keywords": ["뷰티", "메이크업"],
                "analysis_report": f"# 분석 리포트\n\n{analysis_text}"
            }
            
    except Exception as e:
        print(f"Gemini 분석 오류: {e}")
        return {
            "success_score": 0,
            "trending_keywords": [],
            "analysis_report": f"# 분석 오류\n\n{str(e)}"
        }

def save_to_supabase(video_data, analysis):
    """Supabase에 저장"""
    try:
        # 기존 데이터 확인
        existing = supabase.table('video_reports')\
            .select('id')\
            .eq('video_id', video_data['video_id'])\
            .execute()
        
        if existing.data:
            print(f"⏭️  이미 존재: {video_data['title'][:50]}...")
            return False
        
        # 새 데이터 삽입
        data = {
            'video_id': video_data['video_id'],
            'video_url': video_data['video_url'],
            'title': video_data['title'],
            'channel_name': video_data['channel_name'],
            'view_count': video_data['view_count'],
            'like_count': video_data['like_count'],
            'comment_count': video_data['comment_count'],
            'published_at': video_data['published_at'],
            'thumbnail_url': video_data['thumbnail_url'],
            'analysis_report': analysis['analysis_report'],
            'success_score': analysis['success_score'],
            'trending_keywords': analysis['trending_keywords']
        }
        
        result = supabase.table('video_reports').insert(data).execute()
        print(f"💾 저장 완료: {video_data['title'][:50]}... (점수: {analysis['success_score']}점)")
        return True
        
    except Exception as e:
        print(f"Supabase 저장 오류: {e}")
        return False

def main():
    """메인 실행 함수"""
    print("=" * 80)
    print("YouTube 급상승 뷰티 영상 수집 및 분석 시작")
    print("=" * 80)
    print()
    
    # 1. YouTube 급상승 영상 수집
    print("📺 Step 1: YouTube 급상승 뷰티 영상 수집 중...")
    videos = get_trending_beauty_videos(max_results=20)
    
    if not videos:
        print("❌ 영상을 찾을 수 없습니다.")
        return
    
    print(f"\n✅ {len(videos)}개 영상 수집 완료\n")
    
    # 2. 각 영상 분석 및 저장
    print("🤖 Step 2: Gemini AI 분석 및 저장 중...")
    print()
    
    saved_count = 0
    for i, video in enumerate(videos, 1):
        print(f"[{i}/{len(videos)}] 분석 중: {video['title'][:50]}...")
        
        # Gemini 분석
        analysis = analyze_video_with_gemini(video)
        
        # Supabase 저장
        if save_to_supabase(video, analysis):
            saved_count += 1
        
        print()
    
    # 3. 결과 요약
    print("=" * 80)
    print(f"✅ 완료! {saved_count}개의 새로운 리포트가 저장되었습니다.")
    print("=" * 80)

if __name__ == "__main__":
    main()
