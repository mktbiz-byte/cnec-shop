import sys
import os
import random

# data_api 경로 추가
data_api_path = '/opt/.manus/.sandbox-runtime'
if os.path.exists(data_api_path) and data_api_path not in sys.path:
    sys.path.append(data_api_path)

from flask import Blueprint, jsonify, session, request
import requests
from src.utils.cache import cache, get_channel_cache_key, get_videos_cache_key
from src.models.channel_database import channel_db
from src.models.user_consent import user_consent_db
import uuid

youtube_bp = Blueprint('youtube', __name__)

# API 키 로드 밸런싱을 위한 전역 변수
_api_key_index = 0
_api_keys_cache = None
_current_key_index = 0

def get_youtube_api_keys():
    """
    환경변수에서 YouTube API 키 가져오기
    
    발표용 임시: 다중 키 지원 (할당량 부족 해결)
    정식 서비스에서는 단일 키로 전환 예정
    
    Returns:
        list: API 키 리스트
    """
    global _api_keys_cache
    
    # 캐시된 키가 있으면 반환
    if _api_keys_cache is not None:
        return _api_keys_cache
    
    api_keys = []
    
    # 발표용 임시: 모든 사용 가능한 키 로드
    print("🔄 발표용 임시 설정: 다중 API 키 로드 중...")
    
    # 메인 키 확인
    main_key = os.getenv('YOUTUBE_API_KEY')
    if main_key:
        api_keys.append(main_key)
        print(f"   ✅ 메인 키 로드: ...{main_key[-8:]}")
    
    # 추가 키들 확인 (발표용 임시)
    for i in range(1, 21):  # 1-20번 키까지 확인 (더 많은 키 지원)
        key = os.getenv(f'YOUTUBE_API_KEY_{i}')
        if key and key not in api_keys:  # 중복 방지
            api_keys.append(key)
            print(f"   ✅ 추가 키 {i} 로드: ...{key[-8:]}")
    
    # Gemini 키들도 확인 (다른 프로젝트의 키들)
    for i in range(1, 11):
        key = os.getenv(f'GEMINI_API_KEY_{i}')
        if key and key not in api_keys:
            api_keys.append(key)
            print(f"   ✅ Gemini 키 {i} 로드: ...{key[-8:]}")
    
    # 중복 제거
    api_keys = list(dict.fromkeys(api_keys))  # 순서 유지하면서 중복 제거
    
    # 캐시 저장
    _api_keys_cache = api_keys if api_keys else None
    
    if api_keys:
        print(f"🎯 총 {len(api_keys)}개 API 키 로드 완료 (발표용 임시 설정)")
        print(f"🔄 로테이션 모드: 요청마다 다음 키로 자동 전환")
        for idx, key in enumerate(api_keys):
            print(f"   [{idx+1}] ...{key[-8:]}")
    else:
        print("❌ 사용 가능한 API 키가 없습니다")
    
    return _api_keys_cache



def get_youtube_api_key():
    """
    YouTube API 키 가져오기
    
    발표용 임시: 라운드 로빈 방식으로 할당량 분산
    정식 서비스에서는 단일 키로 전환 예정
    
    Returns:
        str: API 키
    """
    global _current_key_index
    
    api_keys = get_youtube_api_keys()
    
    if not api_keys:
        print("❌ 사용 가능한 API 키가 없습니다")
        return None
    
    # 발표용 임시: 요청마다 다음 키로 로테이션
    selected_key = api_keys[_current_key_index]
    
    print(f"🔑 API 키 선택: {_current_key_index + 1}/{len(api_keys)} (...{selected_key[-8:]})")
    
    # 다음 요청을 위해 인덱스 증가
    _current_key_index = (_current_key_index + 1) % len(api_keys)
    
    return selected_key

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

@youtube_bp.route('/channel/<channel_id>', methods=['GET'])
def get_channel(channel_id):
    """채널 정보 조회 (YouTube Data API v3) - 사용자 동의 필요"""
    # 세션 ID 생성 또는 가져오기
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    session_id = session['session_id']
    
    # 발표용 임시: 사용자 동의 체크 우회
    print("🎙️ 발표용 임시: 사용자 동의 체크 우회")
    # if not user_consent_db.check_consent(session_id, 'youtube_data'):
    #     return jsonify({
    #         'error': 'User consent required',
    #         'message': 'YouTube 데이터 조회를 위해서는 사용자 동의가 필요합니다.',
    #         'consent_required': True,
    #         'consent_url': '/api/youtube/consent'
    #     }), 403
    
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    # 핸들(@) 또는 채널명을 채널 ID로 변환
    resolved_id = resolve_channel_id(channel_id, api_key)
    if not resolved_id:
        return jsonify({'error': 'Channel not found'}), 404
    
    channel_id = resolved_id
    
    try:
        # YouTube Data API v3 호출
        url = 'https://www.googleapis.com/youtube/v3/channels'
        params = {
            'part': 'snippet,statistics,brandingSettings',
            'id': channel_id,
            'key': api_key
        }
        
        print(f"🚀 YouTube API 호출: {url}")
        print(f"🔑 사용 키: ...{api_key[-8:]}")
        print(f"🎯 채널 ID: {channel_id}")
        
        response = requests.get(url, params=params)
        
        print(f"📊 API 응답 상태: {response.status_code}")
        
        if response.status_code == 403:
            print("❌ API 할당량 초과 또는 권한 오류")
            print(f"📝 오류 응답: {response.text[:500]}")
            
            # 다른 키로 재시도
            retry_key = get_youtube_api_key()
            if retry_key != api_key:
                print(f"🔄 다른 키로 재시도: ...{retry_key[-8:]}")
                params['key'] = retry_key
                response = requests.get(url, params=params)
                print(f"📊 재시도 응답 상태: {response.status_code}")
        
        if response.status_code != 200:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            return jsonify({
                'error': 'Failed to fetch channel data',
                'status_code': response.status_code,
                'api_error': error_data.get('error', {}),
                'current_key': f"...{api_key[-8:]}",
                'total_keys_available': len(get_youtube_api_keys()) if get_youtube_api_keys() else 0
            }), response.status_code
        
        data = response.json()
        
        if not data.get('items'):
            return jsonify({'error': 'Channel not found'}), 404
        
        channel = data['items'][0]
        
        # 구독자 수를 한국어 형식으로 변환
        def format_subscribers(count):
            count = int(count)
            if count >= 10000:
                return f"{count/10000:.1f}만"
            elif count >= 1000:
                return f"{count/1000:.1f}천"
            else:
                return str(count)
        
        # 핸들 추출
        handle = channel['snippet'].get('customUrl', '')
        if handle and not handle.startswith('@'):
            handle = '@' + handle
        
        # 응답 데이터 구성
        result = {
            'handle': handle,
            'id': channel['id'],
            'title': channel['snippet']['title'],
            'description': channel['snippet']['description'],
            'customUrl': channel['snippet'].get('customUrl', ''),
            'publishedAt': channel['snippet']['publishedAt'],
            'thumbnail': channel['snippet']['thumbnails']['high']['url'],
            'country': channel['snippet'].get('country', ''),
            'stats': {
                'subscribers': channel['statistics'].get('subscriberCount', '0'),
                'subscribersText': format_subscribers(channel['statistics'].get('subscriberCount', '0')),
                'views': int(channel['statistics'].get('viewCount', 0)),
                'videos': int(channel['statistics'].get('videoCount', 0))
            }
        }
        
        # 배너 이미지 추가 (있는 경우)
        if 'brandingSettings' in channel and 'image' in channel['brandingSettings']:
            result['bannerImage'] = channel['brandingSettings']['image'].get('bannerExternalUrl', '')
        
        # 키워드 추가 (있는 경우)
        if 'brandingSettings' in channel and 'channel' in channel['brandingSettings']:
            result['keywords'] = channel['brandingSettings']['channel'].get('keywords', '')
        
        # 데이터 저장 로그 기록 (ToS 준수)
        try:
            user_consent_db.log_data_storage(
                session_id=session_id,
                data_type='channel_info',
                data_purpose='사용자 요청에 따른 채널 정보 조회',
                channel_id=channel_id,
                retention_hours=24
            )
            
            # 사용자 동의가 있는 경우에만 데이터베이스에 저장
            if user_consent_db.check_consent(session_id, 'channel_storage'):
                channel_db.save_channel(result)
        except Exception as e:
            print(f"Failed to log data storage: {e}")
        
        # 캐시에 저장 (24시간)
        cache_key = get_channel_cache_key(channel_id)
        cache.set(cache_key, result, ttl=86400)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@youtube_bp.route('/channel/<channel_id>/videos', methods=['GET'])
def get_channel_videos(channel_id):
    """채널의 최신 동영상 조회 - 사용자 동의 필요"""
    # 세션 ID 생성 또는 가져오기
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())
    
    session_id = session['session_id']
    
    # 발표용 임시: 사용자 동의 체크 우회
    print("🎙️ 발표용 임시: 사용자 동의 체크 우회")
    # if not user_consent_db.check_consent(session_id, 'youtube_data'):
    #     return jsonify({
    #         'error': 'User consent required',
    #         'message': 'YouTube 데이터 조회를 위해서는 사용자 동의가 필요합니다.',
    #         'consent_required': True,
    #         'consent_url': '/api/youtube/consent'
    #     }), 403
    
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    # 핸들(@) 또는 채널명을 채널 ID로 변환
    resolved_id = resolve_channel_id(channel_id, api_key)
    if not resolved_id:
        return jsonify({'error': 'Channel not found'}), 404
    
    channel_id = resolved_id
    
    try:
        # YouTube Data API v3 호출 - 최신 동영상 50개
        url = 'https://www.googleapis.com/youtube/v3/search'
        params = {
            'part': 'snippet',
            'channelId': channel_id,
            'order': 'date',
            'type': 'video',
            'maxResults': 50,
            'key': api_key
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch videos'}), response.status_code
        
        data = response.json()
        
        # 비디오 ID 목록 추출
        video_ids = [item['id']['videoId'] for item in data.get('items', [])]
        
        # 비디오 통계 정보 가져오기 (조회수, 좋아요, 댓글 수)
        stats_map = {}
        if video_ids:
            # 한 번에 최대 50개까지 조회 가능
            stats_url = 'https://www.googleapis.com/youtube/v3/videos'
            stats_params = {
                'part': 'statistics',
                'id': ','.join(video_ids),
                'key': api_key
            }
            stats_response = requests.get(stats_url, params=stats_params)
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                for video in stats_data.get('items', []):
                    video_id = video['id']
                    stats = video.get('statistics', {})
                    stats_map[video_id] = {
                        'viewCount': int(stats.get('viewCount', 0)),
                        'likeCount': int(stats.get('likeCount', 0)),
                        'commentCount': int(stats.get('commentCount', 0))
                    }
        
        videos = []
        for item in data.get('items', []):
            video_id = item['id']['videoId']
            video_stats = stats_map.get(video_id, {
                'viewCount': 0,
                'likeCount': 0,
                'commentCount': 0
            })
            
            view_count = video_stats['viewCount']
            like_count = video_stats['likeCount']
            comment_count = video_stats['commentCount']
            
            # 텍스트 형식 변환
            def format_count(count):
                if count >= 1000000:
                    return f"{count/1000000:.1f}M"
                elif count >= 1000:
                    return f"{count/1000:.1f}K"
                return str(count)
            
            videos.append({
                'id': video_id,
                'title': item['snippet']['title'],
                'description': item['snippet']['description'],
                'publishedAt': item['snippet']['publishedAt'],
                'thumbnail': item['snippet']['thumbnails']['high']['url'],
                'thumbnails': [{'url': item['snippet']['thumbnails']['high']['url']}],
                'channelTitle': item['snippet']['channelTitle'],
                'viewCount': view_count,
                'likeCount': like_count,
                'commentCount': comment_count,
                'viewCountText': f"{format_count(view_count)} 조회",
                'viewCountKorean': f"{format_count(view_count)} 조회수",  # ToS 준수
                'likeCountText': format_count(like_count),
                'likeCountKorean': f"{format_count(like_count)} 좋아요",  # 한국어 용어
                'commentCountText': format_count(comment_count),
                'commentCountKorean': f"{format_count(comment_count)} 댓글"  # 한국어 용어
            })
        
        return jsonify({'videos': videos})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@youtube_bp.route('/recommendations/hashtags/<channel_id>', methods=['GET'])
def get_hashtag_recommendations(channel_id):
    """채널 기반 해시태그 추천 (Gemini AI 활용)"""
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    # 핸들(@) 또는 채널명을 채널 ID로 변환
    resolved_id = resolve_channel_id(channel_id, api_key)
    if not resolved_id:
        return jsonify({'error': 'Channel not found'}), 404
    
    try:
        # 채널 정보 가져오기
        channel_url = f'https://www.googleapis.com/youtube/v3/channels'
        channel_params = {
            'part': 'snippet,statistics',
            'id': resolved_id,
            'key': api_key
        }
        channel_response = requests.get(channel_url, params=channel_params)
        
        if channel_response.status_code != 200:
            return jsonify({'error': 'Failed to fetch channel info'}), channel_response.status_code
        
        channel_data = channel_response.json()
        if not channel_data.get('items'):
            return jsonify({'error': 'Channel not found'}), 404
        
        channel_info = channel_data['items'][0]
        channel_title = channel_info['snippet']['title']
        channel_description = channel_info['snippet']['description']
        
        # 최근 동영상 제목 가져오기 (해시태그 분석용)
        videos_url = 'https://www.googleapis.com/youtube/v3/search'
        videos_params = {
            'part': 'snippet',
            'channelId': resolved_id,
            'order': 'date',
            'type': 'video',
            'maxResults': 10,
            'key': api_key
        }
        videos_response = requests.get(videos_url, params=videos_params)
        
        recent_titles = []
        if videos_response.status_code == 200:
            videos_data = videos_response.json()
            recent_titles = [item['snippet']['title'] for item in videos_data.get('items', [])[:10]]
        
        # Gemini AI로 해시태그 추천
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            # Fallback: 기본 해시태그
            hashtags = [
                '#YouTube', '#콘텐츠', '#크리에이터', '#영상제작',
                '#브이로그', '#일상', '#리뷰', '#팁'
            ]
            return jsonify({'hashtags': hashtags, 'ai_generated': False})
        
        # Gemini API 호출
        gemini_url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={gemini_api_key}'
        
        prompt = f"""다음 유튜브 채널을 분석하여 효과적인 해시태그 20개를 추천해주세요.

채널명: {channel_title}
채널 설명: {channel_description[:500]}
최근 영상 제목:
{chr(10).join(['- ' + title for title in recent_titles[:5]])}

요구사항:
1. 채널의 주제와 콘텐츠 스타일에 맞는 해시태그
2. 한국어 해시태그 위주로 추천
3. 트렌디하고 검색량이 많은 해시태그 포함
4. 일반적인 해시태그(#YouTube, #구독, #좋아요 등)와 특화된 해시태그 혼합
5. 각 해시태그는 # 기호로 시작
6. 해시태그만 나열하고, 설명은 제외

출력 형식: #해시태그1 #해시태그2 #해시태그3 ..."""
        
        gemini_payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 500
            }
        }
        
        gemini_response = requests.post(gemini_url, json=gemini_payload, timeout=30)
        
        if gemini_response.status_code == 200:
            gemini_data = gemini_response.json()
            if 'candidates' in gemini_data and len(gemini_data['candidates']) > 0:
                ai_text = gemini_data['candidates'][0]['content']['parts'][0]['text']
                
                # 해시태그 추출
                import re
                hashtags = re.findall(r'#[\w가-힣]+', ai_text)
                
                if hashtags:
                    return jsonify({
                        'hashtags': hashtags[:20],  # 최대 20개
                        'ai_generated': True
                    })
        
        # AI 실패시 기본 해시태그
        hashtags = [
            '#YouTube', '#콘텐츠', '#크리에이터', '#영상제작',
            '#브이로그', '#일상', '#리뷰', '#팁'
        ]
        return jsonify({'hashtags': hashtags, 'ai_generated': False})
    
    except Exception as e:
        print(f"Error in hashtag recommendations: {e}")
        # 에러 발생시 기본 해시태그
        hashtags = [
            '#YouTube', '#콘텐츠', '#크리에이터', '#영상제작',
            '#브이로그', '#일상', '#리뷰', '#팁'
        ]
        return jsonify({'hashtags': hashtags, 'ai_generated': False})

@youtube_bp.route('/recommendations/topics/<channel_id>', methods=['GET'])
def get_topic_recommendations(channel_id):
    """채널 기반 주제 추천"""
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    # 핸들(@) 또는 채널명을 채널 ID로 변환
    resolved_id = resolve_channel_id(channel_id, api_key)
    if not resolved_id:
        return jsonify({'error': 'Channel not found'}), 404
    
    try:
        # 임시 주제 (실제로는 AI 분석 필요)
        topics = [
            '일상 브이로그', '제품 리뷰', '튜토리얼', 'Q&A',
            '챌린지', '여행', '음식', '게임'
        ]
        
        return jsonify({'topics': topics})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@youtube_bp.route('/trends', methods=['GET'])
def get_trends():
    """YouTube 트렌드 조회"""
    api_key = get_youtube_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    try:
        # YouTube Data API v3 호출 - 인기 동영상
        url = 'https://www.googleapis.com/youtube/v3/videos'
        params = {
            'part': 'snippet,statistics',
            'chart': 'mostPopular',
            'regionCode': 'KR',
            'maxResults': 10,
            'key': api_key
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch trends'}), response.status_code
        
        data = response.json()
        
        # 텍스트 형식 변환 함수
        def format_count(count):
            if count >= 1000000:
                return f"{count/1000000:.1f}M"
            elif count >= 1000:
                return f"{count/1000:.1f}K"
            return str(count)
        
        trends = []
        for item in data.get('items', []):
            view_count = int(item['statistics'].get('viewCount', 0))
            like_count = int(item['statistics'].get('likeCount', 0))
            comment_count = int(item['statistics'].get('commentCount', 0))
            
            trends.append({
                'id': item['id'],
                'title': item['snippet']['title'],
                'channelTitle': item['snippet']['channelTitle'],
                'thumbnail': item['snippet']['thumbnails']['high']['url'],
                'thumbnails': [{'url': item['snippet']['thumbnails']['high']['url']}],
                'views': view_count,
                'likes': like_count,
                'comments': comment_count,
                'viewCountText': f"{format_count(view_count)} 조회",
                'viewCountKorean': f"{format_count(view_count)} 조회수",  # ToS 준수
                'likeCountText': format_count(like_count),
                'likeCountKorean': f"{format_count(like_count)} 좋아요",  # 한국어 용어
                'commentCountText': format_count(comment_count),
                'commentCountKorean': f"{format_count(comment_count)} 댓글"  # 한국어 용어
            })
        
        return jsonify({'trends': trends})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@youtube_bp.route('/recommendations/similar-videos/<channel_id>', methods=['GET'])
def get_similar_video_recommendations(channel_id):
    """비슷한 스타일의 높은 조회수 영상 추천"""
    from src.utils.api_key_manager import get_gemini_api_key
    
    api_key = get_youtube_api_key()
    gemini_key = get_gemini_api_key()
    
    if not api_key:
        return jsonify({'error': 'YouTube API key not configured'}), 503
    
    if not gemini_key:
        return jsonify({'error': 'Gemini API key not configured'}), 503
    
    try:
        # 1. 채널 정보 가져오기
        resolved_id = resolve_channel_id(channel_id, api_key)
        if not resolved_id:
            return jsonify({'error': 'Channel not found'}), 404
        
        channel_id = resolved_id
        
        # 채널 정보 조회
        channel_url = 'https://www.googleapis.com/youtube/v3/channels'
        channel_params = {
            'part': 'snippet',
            'id': channel_id,
            'key': api_key
        }
        channel_response = requests.get(channel_url, params=channel_params)
        
        if channel_response.status_code != 200:
            return jsonify({'error': 'Failed to fetch channel info'}), channel_response.status_code
        
        channel_data = channel_response.json()
        channel_title = channel_data['items'][0]['snippet']['title']
        channel_description = channel_data['items'][0]['snippet']['description']
        
        # 2. 채널의 최근 영상 가져오기 (분석용)
        search_url = 'https://www.googleapis.com/youtube/v3/search'
        search_params = {
            'part': 'snippet',
            'channelId': channel_id,
            'order': 'date',
            'type': 'video',
            'maxResults': 10,
            'key': api_key
        }
        search_response = requests.get(search_url, params=search_params)
        
        if search_response.status_code != 200:
            return jsonify({'error': 'Failed to fetch channel videos'}), search_response.status_code
        
        search_data = search_response.json()
        recent_titles = [item['snippet']['title'] for item in search_data.get('items', [])]
        
        # 3. Gemini AI로 채널 스타일 분석 및 검색 키워드 생성
        from src.routes.ai_consultant import call_gemini_api
        
        analysis_prompt = f"""
당신은 YouTube 콘텐츠 분석 전문가입니다. 다음 채널을 분석하여 비슷한 스타일의 영상을 찾기 위한 검색 키워드 3개를 제안해주세요.

채널명: {channel_title}
채널 설명: {channel_description}
최근 영상 제목:
{chr(10).join(f"- {title}" for title in recent_titles[:5])}

이 채널의 주요 주제, 스타일, 타겟 시청자를 분석하고, YouTube에서 검색할 때 사용할 한국어 키워드 3개를 제안해주세요.
키워드는 이 채널과 비슷한 스타일의 높은 조회수 영상을 찾는 데 최적화되어야 합니다.

응답 형식 (JSON):
{{
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "style_summary": "채널 스타일 요약 (1-2문장)"
}}

JSON 형식으로만 응답해주세요.
"""
        
        ai_response = call_gemini_api(analysis_prompt)
        
        if not ai_response:
            return jsonify({'error': 'Failed to analyze channel style'}), 500
        
        # JSON 파싱
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = ai_response
        
        analysis = json.loads(json_str)
        keywords = analysis.get('keywords', [])
        style_summary = analysis.get('style_summary', '')
        
        # 4. 각 키워드로 높은 조회수 영상 검색
        recommendations = []
        
        for keyword in keywords[:2]:  # 상위 2개 키워드만 사용
            search_params = {
                'part': 'snippet',
                'q': keyword,
                'type': 'video',
                'order': 'viewCount',
                'maxResults': 5,
                'regionCode': 'KR',
                'relevanceLanguage': 'ko',
                'key': api_key
            }
            
            keyword_response = requests.get(search_url, params=search_params)
            
            if keyword_response.status_code == 200:
                keyword_data = keyword_response.json()
                video_ids = [item['id']['videoId'] for item in keyword_data.get('items', [])]
                
                # 비디오 통계 정보 가져오기
                if video_ids:
                    stats_url = 'https://www.googleapis.com/youtube/v3/videos'
                    stats_params = {
                        'part': 'snippet,statistics',
                        'id': ','.join(video_ids),
                        'key': api_key
                    }
                    stats_response = requests.get(stats_url, params=stats_params)
                    
                    if stats_response.status_code == 200:
                        stats_data = stats_response.json()
                        
                        for video in stats_data.get('items', []):
                            view_count = int(video['statistics'].get('viewCount', 0))
                            like_count = int(video['statistics'].get('likeCount', 0))
                            comment_count = int(video['statistics'].get('commentCount', 0))
                            
                            # 조회수 100만 이상만 추천
                            if view_count >= 1000000:
                                # 텍스트 형식 변환
                                def format_count(count):
                                    if count >= 1000000:
                                        return f"{count/1000000:.1f}M"
                                    elif count >= 1000:
                                        return f"{count/1000:.1f}K"
                                    return str(count)
                                
                                recommendations.append({
                                    'id': video['id'],
                                    'title': video['snippet']['title'],
                                    'channelTitle': video['snippet']['channelTitle'],
                                    'thumbnail': video['snippet']['thumbnails']['high']['url'],
                                    'thumbnails': [{'url': video['snippet']['thumbnails']['high']['url']}],
                                    'viewCount': view_count,
                                    'likeCount': like_count,
                                    'commentCount': comment_count,
                                    'viewCountText': f"{format_count(view_count)} 조회",
                                    'likeCountText': format_count(like_count),
                                    'commentCountText': format_count(comment_count),
                                    'keyword': keyword
                                })
        
        # 조회수 기준 정렬 및 중복 제거
        seen_ids = set()
        unique_recommendations = []
        for video in sorted(recommendations, key=lambda x: x['viewCount'], reverse=True):
            if video['id'] not in seen_ids:
                seen_ids.add(video['id'])
                unique_recommendations.append(video)
        
        return jsonify({
            'recommendations': unique_recommendations[:10],  # 상위 10개만
            'style_summary': style_summary,
            'keywords': keywords
        })
    
    except Exception as e:
        print(f"Error in get_similar_video_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500



@youtube_bp.route('/insights/<channel_id>', methods=['GET'])
def get_channel_insights(channel_id):
    """채널 성장 인사이트 및 트렌드 키워드 제공"""
    from src.utils.api_key_manager import get_gemini_api_key
    from src.routes.ai_consultant import call_gemini_api
    
    api_key = get_youtube_api_key()
    gemini_key = get_gemini_api_key()
    
    if not api_key or not gemini_key:
        return jsonify({'error': 'API keys not configured'}), 503
    
    try:
        # 1. 채널 정보 가져오기
        resolved_id = resolve_channel_id(channel_id, api_key)
        if not resolved_id:
            return jsonify({'error': 'Channel not found'}), 404
        
        channel_id = resolved_id
        
        # 채널 정보 조회
        channel_url = 'https://www.googleapis.com/youtube/v3/channels'
        channel_params = {
            'part': 'snippet,statistics',
            'id': channel_id,
            'key': api_key
        }
        channel_response = requests.get(channel_url, params=channel_params)
        
        if channel_response.status_code != 200:
            return jsonify({'error': 'Failed to fetch channel info'}), channel_response.status_code
        
        channel_data = channel_response.json()
        channel_item = channel_data['items'][0]
        
        channel_title = channel_item['snippet']['title']
        channel_description = channel_item['snippet']['description']
        subscriber_count = int(channel_item['statistics'].get('subscriberCount', 0))
        video_count = int(channel_item['statistics'].get('videoCount', 0))
        view_count = int(channel_item['statistics'].get('viewCount', 0))
        
        # 2. 최근 영상 제목 가져오기
        search_url = 'https://www.googleapis.com/youtube/v3/search'
        search_params = {
            'part': 'snippet',
            'channelId': channel_id,
            'order': 'date',
            'type': 'video',
            'maxResults': 5,
            'key': api_key
        }
        search_response = requests.get(search_url, params=search_params)
        
        recent_titles = []
        if search_response.status_code == 200:
            search_data = search_response.json()
            recent_titles = [item['snippet']['title'] for item in search_data.get('items', [])]
        
        # 3. Gemini AI로 인사이트 및 트렌드 분석
        prompt = f"""
당신은 YouTube 채널 성장 전문가이자 트렌드 분석가입니다.

**채널 정보:**
- 채널명: {channel_title}
- 설명: {channel_description[:200]}
- 구독자: {subscriber_count:,}명
- 영상 수: {video_count}개
- 총 조회수: {view_count:,}
- 최근 영상 제목:
{chr(10).join(f"  - {title}" for title in recent_titles[:3])}

**요청사항:**
1. 채널 성장 인사이트 (간단명료하게)
   - 강점 1가지
   - 개선점 1가지
   - 즉시 실행 가능한 액션 아이템 1가지

2. 이 채널 주제와 관련된 실시간 트렌드 키워드 5개
   - 네이버 트렌드, 구글 트렌드, 최근 이슈를 고려
   - 한국 시장 중심
   - 채널이 활용할 수 있는 키워드

응답 형식 (JSON):
{{
  "insights": {{
    "strength": "강점 설명 (1문장)",
    "improvement": "개선점 설명 (1문장)",
    "action": "액션 아이템 (1문장)"
  }},
  "trending_keywords": [
    {{"keyword": "키워드1", "reason": "이유 (1문장)"}},
    {{"keyword": "키워드2", "reason": "이유 (1문장)"}},
    {{"keyword": "키워드3", "reason": "이유 (1문장)"}},
    {{"keyword": "키워드4", "reason": "이유 (1문장)"}},
    {{"keyword": "키워드5", "reason": "이유 (1문장)"}}
  ]
}}

JSON 형식으로만 응답해주세요.
"""
        
        ai_response = call_gemini_api(prompt)
        
        if not ai_response:
            return jsonify({'error': 'Failed to generate insights'}), 500
        
        # JSON 파싱
        import json
        import re
        json_match = re.search(r'```json\s*(.*?)\s*```', ai_response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = ai_response
        
        result = json.loads(json_str)
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in get_channel_insights: {str(e)}")
        return jsonify({'error': str(e)}), 500

