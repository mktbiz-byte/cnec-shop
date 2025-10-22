from flask import Blueprint, jsonify, request, session
import requests
import json
import os
from datetime import datetime
from src.models.user_consent import user_consent_db
import uuid

analytics_bp = Blueprint('analytics', __name__)

def get_youtube_api_key():
    """YouTube API 키 가져오기"""
    api_key = None
    
    # 파일에서 로드
    config_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'api_keys.json')
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                keys = json.load(f)
                api_key = keys.get('youtube_api_key')
        except:
            pass
    
    # 환경변수에서 로드
    if not api_key:
        api_key = os.getenv('YOUTUBE_API_KEY')
    
    return api_key

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
    
    response = requests.get(url, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('items'):
            return data['items'][0]['snippet']['channelId']
    
    return None

@analytics_bp.route('/channel/<channel_id>/performance', methods=['GET'])
def analyze_channel_performance(channel_id):
    """채널 성과 분석 - YouTube API 데이터만 사용 (ToS 준수)"""
    # 세션 ID 생성 또는 가져오기
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    session_id = session['session_id']
    
    # 사용자 동의 확인
    if not user_consent_db.check_consent(session_id, 'youtube_data'):
        return jsonify({
            'error': 'User consent required',
            'message': 'YouTube 데이터 분석을 위해서는 사용자 동의가 필요합니다.',
            'consent_required': True,
            'consent_url': '/api/youtube/consent'
        }), 403
    
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    # 핸들(@) 또는 채널명을 채널 ID로 변환
    resolved_id = resolve_channel_id(channel_id, api_key)
    if not resolved_id:
        return jsonify({'error': 'Channel not found'}), 404
    
    channel_id = resolved_id
    
    try:
        # 1. 채널 정보 가져오기
        channel_url = 'https://www.googleapis.com/youtube/v3/channels'
        channel_params = {
            'part': 'snippet,statistics,contentDetails',
            'id': channel_id,
            'key': api_key
        }
        
        channel_response = requests.get(channel_url, params=channel_params, timeout=10)
        channel_data = channel_response.json()
        
        if 'items' not in channel_data or len(channel_data['items']) == 0:
            return jsonify({'error': 'Channel not found'}), 404
        
        channel = channel_data['items'][0]
        uploads_playlist_id = channel['contentDetails']['relatedPlaylists']['uploads']
        
        # 2. 최신 동영상 50개 가져오기
        videos_url = 'https://www.googleapis.com/youtube/v3/playlistItems'
        videos_params = {
            'part': 'snippet',
            'playlistId': uploads_playlist_id,
            'maxResults': 50,
            'key': api_key
        }
        
        videos_response = requests.get(videos_url, params=videos_params, timeout=10)
        videos_data = videos_response.json()
        
        # 3. 동영상 ID 수집
        video_ids = []
        for item in videos_data.get('items', []):
            video_ids.append(item['snippet']['resourceId']['videoId'])
        
        # 4. 동영상 상세 정보 가져오기
        videos = []
        if video_ids:
            details_url = 'https://www.googleapis.com/youtube/v3/videos'
            details_params = {
                'part': 'statistics,snippet,contentDetails',
                'id': ','.join(video_ids),
                'key': api_key
            }
            
            details_response = requests.get(details_url, params=details_params, timeout=10)
            details_data = details_response.json()
            
            for video in details_data.get('items', []):
                views = int(video['statistics'].get('viewCount', '0'))
                likes = int(video['statistics'].get('likeCount', '0'))
                comments = int(video['statistics'].get('commentCount', '0'))
                
                videos.append({
                    'id': video['id'],
                    'title': video['snippet']['title'],
                    'publishedAt': video['snippet']['publishedAt'],
                    'views': views,
                    'likes': likes,
                    'comments': comments
                })
        
        # 5. YouTube API 데이터 직접 제공 (ToS 준수 - 독립 메트릭 제거)
        if not videos:
            return jsonify({'error': 'No videos found'}), 404
        
        # YouTube API에서 직접 제공되는 데이터만 사용
        # 독립적인 계산이나 도출 메트릭 제거
        
        # 인기 영상 Top 5 (조회수 기준)
        top_videos = sorted(videos, key=lambda x: x['views'], reverse=True)[:5]
        
        # 최신 영상 5개
        recent_videos = videos[:5]
        
        # 채널 기본 정보 (YouTube API 직접 데이터)
        subscribers = int(channel['statistics'].get('subscriberCount', '0'))
        total_channel_views = int(channel['statistics'].get('viewCount', '0'))
        total_channel_videos = int(channel['statistics'].get('videoCount', '0'))
        
        # ToS 준수: YouTube API 데이터만 제공, 독립 메트릭 제거
        result = {
            'channel_info': {
                'title': channel['snippet']['title'],
                'description': channel['snippet']['description'],
                'subscribers': subscribers,
                'subscribersKorean': f"{subscribers:,} 구독자",  # ToS 준수
                'total_views': total_channel_views,
                'viewsKorean': f"{total_channel_views:,} 조회수",  # ToS 준수
                'total_videos': total_channel_videos,
                'videosKorean': f"{total_channel_videos:,} 동영상"  # ToS 준수
            },
            'top_videos': [
                {
                    'title': v['title'],
                    'views': v['views'],
                    'viewsKorean': f"{v['views']:,} 조회수",  # ToS 준수
                    'likes': v['likes'],
                    'likesKorean': f"{v['likes']:,} 좋아요",  # 한국어 용어
                    'comments': v['comments'],
                    'commentsKorean': f"{v['comments']:,} 댓글",  # 한국어 용어
                    'publishedAt': v['publishedAt']
                } for v in top_videos
            ],
            'recent_videos': [
                {
                    'title': v['title'],
                    'views': v['views'],
                    'viewsKorean': f"{v['views']:,} 조회수",  # ToS 준수
                    'likes': v['likes'],
                    'likesKorean': f"{v['likes']:,} 좋아요",  # 한국어 용어
                    'comments': v['comments'],
                    'commentsKorean': f"{v['comments']:,} 댓글",  # 한국어 용어
                    'publishedAt': v['publishedAt']
                } for v in recent_videos
            ],
            'data_source': 'YouTube Data API v3',  # 데이터 출처 명시
            'compliance_note': '모든 데이터는 YouTube API에서 직접 제공되며, 독립적인 계산 메트릭은 포함되지 않습니다.'  # ToS 준수 명시
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

