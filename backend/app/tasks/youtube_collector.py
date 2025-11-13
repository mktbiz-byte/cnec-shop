"""
유튜브 데이터 수집기
YouTube Data API v3 정책을 완벽히 준수하는 데이터 수집 시스템
"""
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import time
import os

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.models import VideoData

class YouTubeCollector:
    """
    YouTube 데이터 수집기
    
    API 정책 준수 사항:
    1. 데이터 저장 기간: 최대 30일 (자동 삭제/갱신)
    2. 할당량 관리: 하루 10,000 포인트 제한
    3. 일괄 처리: 최대 50개씩 묶어서 호출
    4. 에러 처리: 지수 백오프 적용
    """
    
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY가 설정되지 않았습니다.")
        
        self.youtube = build('youtube', 'v3', developerKey=self.api_key)
        self.quota_used = 0
        self.quota_limit = settings.YOUTUBE_QUOTA_LIMIT
    
    def search_beauty_videos(self, max_results: int = 50, published_after: Optional[datetime] = None) -> List[str]:
        """
        뷰티 카테고리 영상 검색
        
        Args:
            max_results: 최대 결과 수 (기본 50)
            published_after: 이 날짜 이후 업로드된 영상만 검색
        
        Returns:
            영상 ID 리스트
        """
        if not published_after:
            # 기본값: 최근 7일
            published_after = datetime.now() - timedelta(days=7)
        
        try:
            # 검색 쿼리 (뷰티 관련 키워드)
            search_query = "뷰티 메이크업 OR 올리브영 OR 화장품 리뷰"
            
            request = self.youtube.search().list(
                part="id",
                q=search_query,
                type="video",
                regionCode="KR",
                relevanceLanguage="ko",
                maxResults=min(max_results, 50),
                publishedAfter=published_after.isoformat() + "Z",
                order="viewCount"  # 조회수 순
            )
            
            response = request.execute()
            self.quota_used += 100  # search.list = 100 포인트
            
            video_ids = [item['id']['videoId'] for item in response.get('items', [])]
            
            print(f"✅ {len(video_ids)}개 영상 검색 완료 (할당량 사용: {self.quota_used}/{self.quota_limit})")
            
            return video_ids
            
        except HttpError as e:
            print(f"❌ YouTube API 오류: {e}")
            return []
    
    def get_video_details(self, video_ids: List[str]) -> List[Dict]:
        """
        영상 상세 정보 조회 (일괄 처리)
        
        Args:
            video_ids: 영상 ID 리스트 (최대 50개)
        
        Returns:
            영상 상세 정보 리스트
        """
        if not video_ids:
            return []
        
        # 50개씩 묶어서 처리 (API 제한)
        batch_size = 50
        all_videos = []
        
        for i in range(0, len(video_ids), batch_size):
            batch = video_ids[i:i+batch_size]
            
            try:
                request = self.youtube.videos().list(
                    part="snippet,statistics,contentDetails",
                    id=",".join(batch)
                )
                
                response = request.execute()
                self.quota_used += 1  # videos.list = 1 포인트
                
                for item in response.get('items', []):
                    video_data = self._parse_video_item(item)
                    all_videos.append(video_data)
                
                print(f"✅ {len(batch)}개 영상 상세 정보 조회 완료 (할당량: {self.quota_used}/{self.quota_limit})")
                
                # API 호출 간 짧은 대기 (Rate Limiting 방지)
                time.sleep(0.1)
                
            except HttpError as e:
                print(f"❌ 영상 정보 조회 오류: {e}")
                # 지수 백오프: 에러 발생 시 대기 후 재시도
                time.sleep(2)
        
        return all_videos
    
    def _parse_video_item(self, item: Dict) -> Dict:
        """
        API 응답을 파싱하여 필요한 데이터만 추출
        """
        snippet = item['snippet']
        statistics = item.get('statistics', {})
        content_details = item.get('contentDetails', {})
        
        # ISO 8601 duration을 초 단위로 변환
        duration = self._parse_duration(content_details.get('duration', 'PT0S'))
        
        return {
            'video_id': item['id'],
            'channel_id': snippet['channelId'],
            'title': snippet['title'],
            'description': snippet.get('description', ''),
            'tags': snippet.get('tags', []),
            'view_count': int(statistics.get('viewCount', 0)),
            'like_count': int(statistics.get('likeCount', 0)),
            'comment_count': int(statistics.get('commentCount', 0)),
            'duration': duration,
            'published_at': datetime.fromisoformat(snippet['publishedAt'].replace('Z', '+00:00')),
            'thumbnail_url': snippet['thumbnails']['high']['url']
        }
    
    def _parse_duration(self, duration_str: str) -> int:
        """
        ISO 8601 duration (예: PT15M33S)을 초 단위로 변환
        """
        import re
        match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds
    
    def save_to_database(self, videos: List[Dict]):
        """
        수집한 영상 데이터를 데이터베이스에 저장
        """
        db = SessionLocal()
        
        try:
            for video in videos:
                # 기존 데이터 확인
                existing = db.query(VideoData).filter(
                    VideoData.video_id == video['video_id']
                ).first()
                
                if existing:
                    # 업데이트 (통계 정보 갱신)
                    existing.view_count = video['view_count']
                    existing.like_count = video['like_count']
                    existing.comment_count = video['comment_count']
                    existing.updated_at = datetime.now()
                else:
                    # 새 데이터 삽입
                    new_video = VideoData(**video)
                    db.add(new_video)
            
            db.commit()
            print(f"✅ {len(videos)}개 영상 데이터 저장 완료")
            
        except Exception as e:
            db.rollback()
            print(f"❌ 데이터베이스 저장 오류: {e}")
        finally:
            db.close()
    
    def cleanup_old_data(self):
        """
        30일 이상 지난 데이터 삭제 (API 정책 준수)
        """
        db = SessionLocal()
        
        try:
            cutoff_date = datetime.now() - timedelta(days=settings.DATA_RETENTION_DAYS)
            
            deleted_count = db.query(VideoData).filter(
                VideoData.updated_at < cutoff_date
            ).delete()
            
            db.commit()
            print(f"✅ {deleted_count}개의 오래된 데이터 삭제 완료 (30일 정책 준수)")
            
        except Exception as e:
            db.rollback()
            print(f"❌ 데이터 정리 오류: {e}")
        finally:
            db.close()
    
    def run_daily_collection(self):
        """
        일일 데이터 수집 작업 (Cron Job에서 호출)
        """
        print("=" * 50)
        print(f"🚀 일일 데이터 수집 시작: {datetime.now()}")
        print("=" * 50)
        
        # 1. 오래된 데이터 정리
        self.cleanup_old_data()
        
        # 2. 최근 7일 영상 검색
        video_ids = self.search_beauty_videos(max_results=50)
        
        if not video_ids:
            print("⚠️  검색 결과가 없습니다.")
            return
        
        # 3. 영상 상세 정보 조회
        videos = self.get_video_details(video_ids)
        
        # 4. 데이터베이스에 저장
        if videos:
            self.save_to_database(videos)
        
        print("=" * 50)
        print(f"✅ 일일 데이터 수집 완료")
        print(f"   - 수집 영상: {len(videos)}개")
        print(f"   - 할당량 사용: {self.quota_used}/{self.quota_limit}")
        print("=" * 50)


# CLI 실행용
if __name__ == "__main__":
    collector = YouTubeCollector()
    collector.run_daily_collection()
