"""
YouTube API 키 로테이션 유틸리티
정상 작동하는 API 키를 순환하면서 사용합니다.
"""
import os
import random
from typing import Optional

class YouTubeAPIKeyManager:
    """YouTube API 키를 관리하고 로테이션합니다."""
    
    # 정상 작동하는 API 키 목록
    WORKING_KEYS = [
        "YOUTUBE_API_KEY",
        "YOUTUBE_API_KEY_2",
        "YOUTUBE_API_KEY_3",
        "YOUTUBE_API_KEY_4",
        "YOUTUBE_API_KEY_5",
        "YOUTUBE_API_KEY_6",
        "YOUTUBE_API_KEY_7",
        "YOUTUBE_API_KEY_8",
        "YOUTUBE_API_KEY_9",
    ]
    
    def __init__(self):
        """API 키 목록을 초기화합니다."""
        self.keys = []
        for key_name in self.WORKING_KEYS:
            key_value = os.getenv(key_name)
            if key_value:
                self.keys.append(key_value)
        
        if not self.keys:
            raise ValueError("사용 가능한 YouTube API 키가 없습니다.")
        
        # 랜덤하게 섞어서 부하 분산
        random.shuffle(self.keys)
        self.current_index = 0
    
    def get_key(self) -> str:
        """다음 API 키를 반환합니다."""
        if not self.keys:
            raise ValueError("사용 가능한 YouTube API 키가 없습니다.")
        
        key = self.keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.keys)
        return key
    
    def get_random_key(self) -> str:
        """랜덤한 API 키를 반환합니다."""
        if not self.keys:
            raise ValueError("사용 가능한 YouTube API 키가 없습니다.")
        
        return random.choice(self.keys)
    
    def get_all_keys(self) -> list[str]:
        """모든 API 키를 반환합니다."""
        return self.keys.copy()


# 전역 인스턴스
_api_key_manager: Optional[YouTubeAPIKeyManager] = None


def get_youtube_api_key() -> str:
    """
    YouTube API 키를 가져옵니다.
    로테이션을 통해 할당량을 효율적으로 사용합니다.
    """
    global _api_key_manager
    
    if _api_key_manager is None:
        _api_key_manager = YouTubeAPIKeyManager()
    
    return _api_key_manager.get_key()


def get_random_youtube_api_key() -> str:
    """
    랜덤한 YouTube API 키를 가져옵니다.
    병렬 처리 시 유용합니다.
    """
    global _api_key_manager
    
    if _api_key_manager is None:
        _api_key_manager = YouTubeAPIKeyManager()
    
    return _api_key_manager.get_random_key()
