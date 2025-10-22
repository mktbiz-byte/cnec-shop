#!/bin/bash

# 🎤 발표 완료 후 YouTube API ToS 준수 모드 복원 스크립트

echo "🔄 YouTube API ToS 준수 모드 복원 시작..."
echo "⚠️  발표용 임시 설정을 제거하고 정식 준수 설정으로 복원합니다."

# 현재 브랜치 확인
echo "📍 현재 브랜치: $(git branch --show-current)"

# 발표용 임시 커밋 되돌리기
echo "🔙 발표용 임시 설정 되돌리기..."

# youtube.py를 ToS 준수 버전으로 복원
cat > src/routes/youtube.py << 'EOF'
"""
YouTube API 관련 라우트 (ToS 준수 버전)
"""

from flask import Blueprint, jsonify, request, session
import requests
import json
import os
import uuid
from datetime import datetime, timedelta
from src.models.user_consent import user_consent_db

youtube_bp = Blueprint('youtube', __name__)

# API 키 캐시
_api_keys_cache = None

def get_youtube_api_key():
    """
    YouTube API 키 가져오기 (단일 키 - ToS 준수)
    
    Returns:
        str: API 키
    """
    global _api_keys_cache
    
    if _api_keys_cache is not None:
        return _api_keys_cache
    
    # 단일 키만 사용 (ToS 준수)
    api_key = os.getenv('YOUTUBE_API_KEY')
    
    if api_key:
        _api_keys_cache = api_key
        print(f"✅ YouTube API 키 로드 완료 (ToS 준수 - 단일 키): ...{api_key[-8:]}")
    else:
        print("❌ YouTube API 키가 설정되지 않았습니다")
        
    return _api_keys_cache

def resolve_channel_id(input_str, api_key):
    """핸들(@) 또는 채널명을 채널 ID로 변환"""
    # 이미 채널 ID 형식이면 그대로 반환
    if input_str.startswith('UC') and len(input_str) == 24:
        return input_str
    
    # @ 제거
    if input_str.startswith('@'):
        input_str = input_str[1:]
    
    # YouTube Data API v3의 search 엔드포인트 사용
    url = 'https://www.googleapis.com/youtube/v3/search'
    params = {
        'part': 'snippet',
        'q': input_str,
        'type': 'channel',
        'maxResults': 1,
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            return data['items'][0]['snippet']['channelId']
    except Exception as e:
        print(f"채널 ID 해결 중 오류: {e}")
    
    return None

@youtube_bp.route('/channel/<channel_input>', methods=['GET'])
def get_channel_info(channel_input):
    """채널 정보 조회 (ToS 준수)"""
    # 세션 ID 생성 또는 가져오기
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    session_id = session['session_id']
    
    # 사용자 동의 확인
    if not user_consent_db.check_consent(session_id, 'youtube_data'):
        return jsonify({
            'error': 'User consent required',
            'message': 'YouTube 데이터 조회를 위해서는 사용자 동의가 필요합니다.',
            'consent_required': True,
            'consent_url': '/api/youtube/consent'
        }), 403
    
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    # 채널 ID 해결
    channel_id = resolve_channel_id(channel_input, api_key)
    
    if not channel_id:
        return jsonify({'error': 'Channel not found'}), 404
    
    # 채널 정보 조회
    url = 'https://www.googleapis.com/youtube/v3/channels'
    params = {
        'part': 'snippet,statistics,brandingSettings',
        'id': channel_id,
        'key': api_key
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if 'items' in data and len(data['items']) > 0:
            channel = data['items'][0]
            channel_stats = channel.get('statistics', {})
            
            # ToS 준수: 한국어 용어 추가
            result = {
                'id': channel['id'],
                'title': channel['snippet']['title'],
                'description': channel['snippet']['description'],
                'thumbnail': channel['snippet']['thumbnails'].get('high', {}).get('url', ''),
                'stats': {
                    'subscribers': channel_stats.get('subscriberCount', '0'),
                    'subscribersKorean': '구독자',
                    'views': channel_stats.get('viewCount', '0'),
                    'viewsKorean': '조회수',
                    'videos': channel_stats.get('videoCount', '0'),
                    'videosKorean': '동영상'
                },
                'korean_labels': {
                    'subscribers': '구독자',
                    'views': '조회수',
                    'videos': '동영상'
                },
                'data_source': 'YouTube Data API v3',
                'compliance_note': 'ToS 준수 - 직접 API 데이터만 제공'
            }
            
            return jsonify(result)
        else:
            return jsonify({'error': 'Channel not found'}), 404
            
    except Exception as e:
        return jsonify({'error': f'API request failed: {str(e)}'}), 500

@youtube_bp.route('/channel/<channel_id>/videos', methods=['GET'])
def get_channel_videos(channel_id):
    """채널의 최신 동영상 조회 (ToS 준수)"""
    # 세션 ID 생성 또는 가져오기
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    session_id = session['session_id']
    
    # 사용자 동의 확인
    if not user_consent_db.check_consent(session_id, 'youtube_data'):
        return jsonify({
            'error': 'User consent required',
            'message': 'YouTube 데이터 조회를 위해서는 사용자 동의가 필요합니다.',
            'consent_required': True,
            'consent_url': '/api/youtube/consent'
        }), 403
    
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    max_results = min(int(request.args.get('maxResults', 10)), 50)
    
    # 채널의 업로드 플레이리스트 ID 가져오기
    channel_url = 'https://www.googleapis.com/youtube/v3/channels'
    channel_params = {
        'part': 'contentDetails',
        'id': channel_id,
        'key': api_key
    }
    
    try:
        channel_response = requests.get(channel_url, params=channel_params, timeout=10)
        channel_data = channel_response.json()
        
        if 'items' not in channel_data or len(channel_data['items']) == 0:
            return jsonify({'error': 'Channel not found'}), 404
        
        uploads_playlist_id = channel_data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        
        # 플레이리스트에서 동영상 목록 가져오기
        playlist_url = 'https://www.googleapis.com/youtube/v3/playlistItems'
        playlist_params = {
            'part': 'snippet',
            'playlistId': uploads_playlist_id,
            'maxResults': max_results,
            'key': api_key
        }
        
        playlist_response = requests.get(playlist_url, params=playlist_params, timeout=10)
        playlist_data = playlist_response.json()
        
        videos = []
        if 'items' in playlist_data:
            for item in playlist_data['items']:
                video = {
                    'id': item['snippet']['resourceId']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'][:200] + '...' if len(item['snippet']['description']) > 200 else item['snippet']['description'],
                    'thumbnail': item['snippet']['thumbnails'].get('high', {}).get('url', ''),
                    'publishedAt': item['snippet']['publishedAt'],
                    'korean_labels': {
                        'title': '제목',
                        'published': '게시일',
                        'description': '설명'
                    }
                }
                videos.append(video)
        
        return jsonify({
            'videos': videos,
            'total': len(videos),
            'data_source': 'YouTube Data API v3',
            'compliance_note': 'ToS 준수 - 직접 API 데이터만 제공'
        })
        
    except Exception as e:
        return jsonify({'error': f'API request failed: {str(e)}'}), 500
EOF

echo "✅ youtube.py ToS 준수 버전으로 복원 완료"

# 발표용 임시 파일들 제거
echo "🗑️  발표용 임시 파일들 제거..."
rm -f PRESENTATION_MODE_NOTICE.md

# 변경사항 커밋
echo "💾 ToS 준수 복원 커밋..."
git add .
git commit -m "🔄 RESTORE: YouTube API ToS Compliance Mode

✅ Reverted presentation mode changes
✅ Restored single API key usage (ToS compliant)
✅ Removed temporary multi-key load balancing
✅ Cleaned up presentation-specific files

Ready for Google submission:
- Single project usage (Policy III.D.1c)
- User consent system (Policy III.E.4a-g)
- Korean terminology (Policy III.E.4h)
- No independent metrics (Policy III.E.4h)

Next steps:
1. Submit compliance report to Google
2. Request quota increase to 50,000/day
3. Monitor compliance status"

# GitHub에 푸시
echo "🚀 GitHub에 ToS 준수 버전 푸시..."
git push origin main

echo ""
echo "🎉 YouTube API ToS 준수 모드 복원 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Google Cloud Support 케이스 생성"
echo "2. YouTube API 팀에 준수 보고서 제출"
echo "3. 할당량 증가 요청 (50,000/day)"
echo "4. 승인 대기 및 서비스 정상화"
echo ""
echo "📄 제출 문서:"
echo "- OFFICIAL_YOUTUBE_API_COMPLIANCE_SUBMISSION.md"
echo "- YOUTUBE_SUBMISSION_GUIDE.md"
echo ""
echo "🔗 검증 링크:"
echo "- https://cnecplus.onrender.com/api/data/compliance/status"
echo "- https://github.com/mktbiz-byte/cnecplus"
EOF
