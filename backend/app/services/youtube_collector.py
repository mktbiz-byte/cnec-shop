"""
YouTube 영상 수집 서비스
뷰티 관련 인기 영상을 수집합니다.
"""
import requests
from typing import List, Dict, Any
from app.utils.youtube_api import get_youtube_api_key


class YouTubeCollector:
    """YouTube 영상을 수집하는 클래스"""
    
    BASE_URL = "https://www.googleapis.com/youtube/v3"
    
    # 뷰티 관련 키워드
    BEAUTY_KEYWORDS = [
        "뷰티", "메이크업", "화장품", "스킨케어", "코스메틱",
        "beauty", "makeup", "cosmetics", "skincare",
        "올리브영", "득템", "리뷰", "추천"
    ]
    
    def __init__(self):
        """초기화"""
        self.api_key = get_youtube_api_key()
    
    def search_popular_videos(
        self, 
        min_views: int = 1000000,  # 100만 뷰 이상
        max_results: int = 10,
        region_code: str = "KR"
    ) -> List[Dict[str, Any]]:
        """
        인기 영상을 검색합니다.
        
        Args:
            min_views: 최소 조회수
            max_results: 최대 결과 개수
            region_code: 지역 코드
            
        Returns:
            영상 정보 리스트
        """
        videos = []
        
        # 1. 먼저 인기 영상 목록을 가져옵니다
        popular_videos = self._get_popular_videos(max_results=50, region_code=region_code)
        
        # 2. 뷰티 관련 영상만 필터링
        for video in popular_videos:
            if self._is_beauty_related(video):
                # 3. 조회수 확인
                view_count = int(video.get("statistics", {}).get("viewCount", 0))
                if view_count >= min_views:
                    videos.append(video)
                    if len(videos) >= max_results:
                        break
        
        return videos
    
    def _get_popular_videos(
        self, 
        max_results: int = 50,
        region_code: str = "KR"
    ) -> List[Dict[str, Any]]:
        """
        인기 영상 목록을 가져옵니다.
        
        Args:
            max_results: 최대 결과 개수
            region_code: 지역 코드
            
        Returns:
            영상 정보 리스트
        """
        url = f"{self.BASE_URL}/videos"
        params = {
            "part": "snippet,statistics,contentDetails",
            "chart": "mostPopular",
            "regionCode": region_code,
            "maxResults": max_results,
            "key": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return data.get("items", [])
        
        except Exception as e:
            print(f"인기 영상 조회 오류: {e}")
            return []
    
    def _is_beauty_related(self, video: Dict[str, Any]) -> bool:
        """
        영상이 뷰티 관련인지 확인합니다.
        
        Args:
            video: 영상 정보
            
        Returns:
            뷰티 관련 여부
        """
        snippet = video.get("snippet", {})
        title = snippet.get("title", "").lower()
        description = snippet.get("description", "").lower()
        tags = snippet.get("tags", [])
        
        # 제목, 설명, 태그에서 뷰티 키워드 검색
        text = f"{title} {description} {' '.join(tags)}".lower()
        
        for keyword in self.BEAUTY_KEYWORDS:
            if keyword.lower() in text:
                return True
        
        return False
    
    def get_video_details(self, video_id: str) -> Dict[str, Any]:
        """
        영상 상세 정보를 가져옵니다.
        
        Args:
            video_id: 영상 ID
            
        Returns:
            영상 정보
        """
        url = f"{self.BASE_URL}/videos"
        params = {
            "part": "snippet,statistics,contentDetails",
            "id": video_id,
            "key": self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            items = data.get("items", [])
            
            if items:
                return items[0]
            else:
                return {}
        
        except Exception as e:
            print(f"영상 상세 정보 조회 오류: {e}")
            return {}
