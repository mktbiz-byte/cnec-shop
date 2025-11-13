"""
Gemini API를 활용한 유튜브 영상 분석 서비스
"""
import google.generativeai as genai
from googleapiclient.discovery import build
from app.core.config import settings
from typing import Dict, Optional
import re

# Gemini API 설정
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def extract_video_id(url: str) -> Optional[str]:
    """유튜브 URL에서 video_id 추출"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
        r'youtube\.com\/embed\/([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_video_metadata(video_id: str) -> Optional[Dict]:
    """유튜브 API로 영상 메타데이터 가져오기"""
    if not settings.YOUTUBE_API_KEY:
        return None
    
    try:
        youtube = build('youtube', 'v3', developerKey=settings.YOUTUBE_API_KEY)
        
        request = youtube.videos().list(
            part='snippet,statistics',
            id=video_id
        )
        response = request.execute()
        
        if not response.get('items'):
            return None
        
        item = response['items'][0]
        snippet = item['snippet']
        statistics = item['statistics']
        
        return {
            'video_id': video_id,
            'title': snippet.get('title', ''),
            'channel_name': snippet.get('channelTitle', ''),
            'description': snippet.get('description', ''),
            'published_at': snippet.get('publishedAt', ''),
            'thumbnail_url': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
            'view_count': int(statistics.get('viewCount', 0)),
            'like_count': int(statistics.get('likeCount', 0)),
            'comment_count': int(statistics.get('commentCount', 0)),
            'tags': snippet.get('tags', [])
        }
    except Exception as e:
        print(f"Error fetching video metadata: {e}")
        return None

def generate_analysis_report(video_data: Dict) -> Dict:
    """Gemini API로 영상 분석 리포트 생성"""
    if not settings.GEMINI_API_KEY:
        return {
            'analysis_report': '# 분석 리포트\n\nGemini API 키가 설정되지 않았습니다.',
            'success_score': 0,
            'trending_keywords': []
        }
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
당신은 뷰티 유튜브 전문 분석가입니다. 다음 영상을 분석하여 상세한 리포트를 작성해주세요.

**영상 정보:**
- 제목: {video_data['title']}
- 채널: {video_data['channel_name']}
- 조회수: {video_data['view_count']:,}회
- 좋아요: {video_data['like_count']:,}개
- 댓글: {video_data['comment_count']:,}개
- 게시일: {video_data['published_at']}
- 태그: {', '.join(video_data.get('tags', [])[:10])}

**분석 요청사항:**
1. 이 영상의 성공 요인 분석 (제목, 썸네일, 타이밍, 트렌드 등)
2. 조회수/좋아요/댓글 비율 분석
3. 뷰티 카테고리 내 트렌드 키워드 추출
4. 성공 점수 (0-100점)
5. 다른 크리에이터를 위한 인사이트

**출력 형식 (Markdown):**
# 영상 분석 리포트

## 📊 성과 요약
- 성공 점수: XX/100점
- 주요 성과 지표 요약

## 🎯 성공 요인
(구체적인 성공 요인 분석)

## 📈 데이터 분석
(조회수/좋아요/댓글 비율 분석)

## 🔥 트렌드 키워드
(쉼표로 구분된 키워드 리스트)

## 💡 크리에이터 인사이트
(다른 크리에이터를 위한 실용적인 조언)

---
*분석 생성일: {video_data['published_at']}*
"""
        
        response = model.generate_content(prompt)
        analysis_text = response.text
        
        # 성공 점수 추출 (정규표현식)
        score_match = re.search(r'성공 점수:\s*(\d+)', analysis_text)
        success_score = int(score_match.group(1)) if score_match else 70
        
        # 트렌드 키워드 추출
        keywords_section = re.search(r'## 🔥 트렌드 키워드\s*\n(.+?)(?=\n##|\Z)', analysis_text, re.DOTALL)
        trending_keywords = []
        if keywords_section:
            keywords_text = keywords_section.group(1).strip()
            # 쉼표, 줄바꿈, 불릿 포인트로 구분된 키워드 추출
            keywords = re.findall(r'[가-힣a-zA-Z0-9\s]+', keywords_text)
            trending_keywords = [k.strip() for k in keywords if k.strip() and len(k.strip()) > 1][:10]
        
        return {
            'analysis_report': analysis_text,
            'success_score': min(max(success_score, 0), 100),  # 0-100 범위 보장
            'trending_keywords': trending_keywords
        }
        
    except Exception as e:
        print(f"Error generating analysis report: {e}")
        return {
            'analysis_report': f'# 분석 오류\n\n분석 중 오류가 발생했습니다: {str(e)}',
            'success_score': 0,
            'trending_keywords': []
        }

async def analyze_video(video_url: str) -> Optional[Dict]:
    """유튜브 영상 URL을 받아 완전한 분석 리포트 생성"""
    # 1. video_id 추출
    video_id = extract_video_id(video_url)
    if not video_id:
        return None
    
    # 2. 메타데이터 가져오기
    metadata = get_video_metadata(video_id)
    if not metadata:
        return None
    
    # 3. Gemini로 분석 리포트 생성
    analysis = generate_analysis_report(metadata)
    
    # 4. 전체 데이터 결합
    return {
        **metadata,
        'video_url': video_url,
        **analysis
    }
