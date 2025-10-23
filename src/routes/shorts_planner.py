"""
숏폼 영상 기획안 생성 API
YouTube Shorts, Instagram Reels, TikTok 등 숏폼 콘텐츠 전용
"""

from flask import Blueprint, request, jsonify, session
import os
import sys
from src.utils.api_key_manager import get_gemini_api_key, make_youtube_api_request
from src.models.user import db
from src.models.shorts_plan import ShortsPlan
from src.utils.plan_parser import parse_plan_content
from datetime import datetime
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

shorts_planner_bp = Blueprint('shorts_planner', __name__, url_prefix='/api/shorts-planner')


# ============================================================
# Gemini API 호출
# ============================================================

def call_gemini(prompt, max_retries=3):
    """
    Gemini API 호출 (로테이션 적용)
    
    Args:
        prompt: 프롬프트
        max_retries: 최대 재시도 횟수
    
    Returns:
        생성된 텍스트 또는 None
    """
    import requests
    
    for attempt in range(max_retries):
        # API 키 가져오기 (로테이션 적용)
        api_key = get_gemini_api_key()
        if not api_key:
            print(f"[SHORTS_PLANNER] No Gemini API key available")
            return None
        
        url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}'
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        data = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.9,  # 쇼폼은 창의성이 더 중요
                "maxOutputTokens": 4096,
            }
        }
        
        try:
            print(f"[SHORTS_PLANNER] Calling Gemini API (attempt {attempt+1}/{max_retries})...")
            response = requests.post(url, headers=headers, json=data, timeout=60)
            print(f"[SHORTS_PLANNER] Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        parts = candidate['content']['parts']
                        if len(parts) > 0 and 'text' in parts[0]:
                            print(f"[SHORTS_PLANNER] Successfully generated plan")
                            return parts[0]['text']
                
                print(f"[SHORTS_PLANNER] No valid response from Gemini")
                continue
            elif response.status_code == 429:
                print(f"[SHORTS_PLANNER] Quota exceeded, trying next key...")
                continue
            else:
                print(f"[SHORTS_PLANNER] API error: {response.text}")
                continue
            
        except Exception as e:
            print(f"[SHORTS_PLANNER] Gemini API error: {e}")
            import traceback
            traceback.print_exc()
            if attempt < max_retries - 1:
                continue
    
    print(f"[SHORTS_PLANNER] All {max_retries} attempts failed")
    return None


# ============================================================
# 채널 분석
# ============================================================

def analyze_channel_for_shorts(channel_id):
    """숏폼에 적합한 채널 분석"""
    try:
        # 채널 정보
        channel_url = 'https://www.googleapis.com/youtube/v3/channels'
        channel_params = {
            'part': 'snippet,statistics,contentDetails',
            'id': channel_id
        }
        channel_data, error = make_youtube_api_request(channel_url, channel_params)
        if error or not channel_data or 'items' not in channel_data or len(channel_data['items']) == 0:
            return None, error
        
        channel_info = channel_data['items'][0]
        
        # 최근 Shorts 영상 가져오기 (60초 이하)
        uploads_playlist_id = channel_info['contentDetails']['relatedPlaylists']['uploads']
        
        videos_url = 'https://www.googleapis.com/youtube/v3/playlistItems'
        videos_params = {
            'part': 'snippet',
            'playlistId': uploads_playlist_id,
            'maxResults': 50  # 더 많이 가져와서 Shorts 필터링
        }
        videos_data, error = make_youtube_api_request(videos_url, videos_params)
        if error:
            print(f"Playlist items error: {error}")
            # 채널 정보만이라도 반환
            return {
                'channel_name': channel_info['snippet']['title'],
                'description': channel_info['snippet']['description'],
                'subscriber_count': int(channel_info['statistics'].get('subscriberCount', 0)),
                'video_count': int(channel_info['statistics'].get('videoCount', 0)),
                'shorts': []
            }, None

        video_ids = [item['snippet']['resourceId']['videoId'] for item in videos_data.get('items', [])]
        
        # 영상 상세 정보
        shorts = []
        if video_ids:
            details_url = 'https://www.googleapis.com/youtube/v3/videos'
            details_params = {
                'part': 'statistics,snippet,contentDetails',
                'id': ','.join(video_ids)
            }
            details_data, error = make_youtube_api_request(details_url, details_params)
            if error:
                print(f"Video details error: {error}")
            else:
                for item in details_data.get('items', []):
                    # 60초 이하인 영상만 (Shorts)
                    duration = item['contentDetails']['duration']
                    # PT1M = 1분, PT30S = 30초
                    import re
                    match = re.match(r'PT(?:(\d+)M)?(?:(\d+)S)?', duration)
                    if match:
                        minutes = int(match.group(1) or 0)
                        seconds = int(match.group(2) or 0)
                        total_seconds = minutes * 60 + seconds
                        
                        if total_seconds <= 60:  # 60초 이하만
                            shorts.append({
                                'title': item['snippet']['title'],
                                'views': int(item['statistics'].get('viewCount', 0)),
                                'likes': int(item['statistics'].get('likeCount', 0)),
                                'comments': int(item['statistics'].get('commentCount', 0)),
                                'duration': total_seconds
                            })
        
        return {
            'channel_name': channel_info['snippet']['title'],
            'description': channel_info['snippet']['description'],
            'subscriber_count': int(channel_info['statistics'].get('subscriberCount', 0)),
            'video_count': int(channel_info['statistics'].get('videoCount', 0)),
            'shorts': shorts[:10]  # 최근 10개 Shorts만
        }, None
        
    except Exception as e:
        print(f"Channel analysis error: {e}")
        import traceback
        traceback.print_exc()
        return None, str(e)


def get_trending_shorts():
    """현재 트렌딩 Shorts 분석"""
    try:
        url = 'https://www.googleapis.com/youtube/v3/videos'
        params = {
            'part': 'snippet',
            'chart': 'mostPopular',
            'regionCode': 'KR',
            'videoCategoryId': '0',  # All categories
            'maxResults': 50
        }
        data, error = make_youtube_api_request(url, params)
        if error:
            print(f"Trending topics error: {error}")
            return []
        
        topics = []
        for item in data.get('items', [])[:20]:  # 상위 20개만
            topics.append(item['snippet']['title'])
        
        return topics
    except Exception as e:
        print(f"Trending error: {e}")
        return []


# ============================================================
# 채널 ID 추출
# ============================================================

def convert_handle_to_channel_id(handle):
    """핸들명(@username)을 채널 ID로 변환 (API 키 로테이션 적용)"""
    try:
        handle = handle.lstrip('@')
        
        url = 'https://www.googleapis.com/youtube/v3/search'
        params = {
            'part': 'snippet',
            'q': handle,
            'type': 'channel',
            'maxResults': 5
        }
        
        data, error = make_youtube_api_request(url, params)
        if error:
            return None, error

        if data and 'items' in data and len(data['items']) > 0:
            for item in data['items']:
                channel_title = item['snippet']['title'].lower()
                if handle.lower() in channel_title or channel_title in handle.lower():
                    return item['snippet']['channelId'], None
            return data['items'][0]['snippet']['channelId'], None
        
        return None, "Channel not found by handle."
    except Exception as e:
        return None, str(e)


def extract_channel_id(url):
    """URL에서 채널 ID 추출 (API 키 로테이션 적용)"""
    import re
    
    # @핸들 URL 형식
    handle_match = re.search(r'youtube\.com/@([^/\?]+)', url)
    if handle_match:
        handle = handle_match.group(1)
        return convert_handle_to_channel_id(handle)
    
    # 채널 ID URL 형식
    id_match = re.search(r'youtube\.com/channel/([^/\?]+)', url)
    if id_match:
        return id_match.group(1), None
    
    # URL이 아닌 직접 입력 형식
    if url.startswith('UC') and len(url) == 24:
        return url, None
    elif url.startswith('@'):
        return convert_handle_to_channel_id(url)
    
    return None, "Invalid channel URL or handle format."


# ============================================================
# 숏폼 기획안 생성 API
# ============================================================

@shorts_planner_bp.route('/generate', methods=['POST'])
def generate_shorts_plan():
    """숏폼 영상 기획안 생성"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        data = request.json
        channel_url = data.get('channel_url')
        topic = data.get('topic')
        keywords = data.get('keywords', '')
        length = data.get('length', '30초')  # 기본 30초
        brand_name = data.get('brand_name', '')  # 브랜드/상품명
        product_features = data.get('product_features', '')  # 상품 특징
        main_content = data.get('main_content', '')  # 영상 주요내용
        required_content = data.get('required_content', '')  # 크리에이터가 꼭 넣어야 할 내용
        
        if not channel_url or not topic:
            return jsonify({'error': '채널 URL과 주제를 입력해주세요'}), 400
        
        # API 키 로드
        gemini_key = get_gemini_api_key()
        if not gemini_key:
            return jsonify({'error': 'Gemini API 키가 설정되지 않았습니다'}), 503
        
        # 채널 ID 추출
        channel_id, error = extract_channel_id(channel_url)
        if error:
            return jsonify({'error': '채널 ID를 확인하는 중 오류가 발생했습니다.', 'details': error}), 500
        if not channel_id:
            return jsonify({'error': '유효하지 않은 채널 URL입니다'}), 400
        
        # 1. 채널 분석
        channel_analysis, error = analyze_channel_for_shorts(channel_id)
        if error:
            return jsonify({'error': '채널 분석 중 오류가 발생했습니다.', 'details': error}), 500
        if not channel_analysis:
            return jsonify({'error': '채널 정보를 가져올 수 없습니다'}), 500
        
        # 2. 트렌드 분석
        trending = get_trending_shorts()
        
        # 3. 프롬프트 생성
        shorts_info = ""
        if channel_analysis['shorts']:
            avg_views = sum(s['views'] for s in channel_analysis['shorts']) / len(channel_analysis['shorts'])
            popular_shorts = sorted(channel_analysis['shorts'], key=lambda x: x['views'], reverse=True)[:3]
            
            shorts_info = f"""
**채널의 기존 Shorts 분석:**
- 평균 조회수: {avg_views:,.0f}회
- 인기 Shorts:
"""
            for i, short in enumerate(popular_shorts, 1):
                shorts_info += f"  {i}. {short['title']} ({short['views']:,}회, {short['duration']}초)\n"
        
        trending_info = ""
        if trending:
            trending_info = f"\n**현재 트렌드:**\n" + "\n".join(f"- {t}" for t in trending[:5])
        
        prompt = f"""
당신은 YouTube Shorts 전문 기획자입니다. 다음 채널을 위한 숏폼 영상 기획안을 작성해주세요.

**채널 정보:**
- 채널명: {channel_analysis['channel_name']}
- 구독자: {channel_analysis['subscriber_count']:,}명
- 채널 설명: {channel_analysis['description'][:200]}
{shorts_info}
{trending_info}

**기획 요청:**
- 주제: {topic}
- 키워드: {keywords}
- 목표 길이: {length}
- 브랜드/상품명: {brand_name}
- 상품 특징: {product_features}
- 영상 주요내용: {main_content}
- 크리에이터가 꼭 넣어야 할 내용: {required_content}

**숏폼 기획안 작성 가이드:**
1. **후킹 (0-3초)**: 시청자를 즉시 사로잡을 강력한 오프닝
2. **전개 (3-45초)**: 빠른 템포로 핵심 내용 전달
3. **마무리 (45-60초)**: CTA(Call To Action) 또는 반전

다음 형식으로 작성해주세요:

## {channel_analysis['channel_name']} 맞춤형 Shorts 기획안: {topic}

**채널 분석:** (채널 특성과 Shorts 스타일 분석)

### 1. 영상 제목 (3개 제안)
- **제목 1:** (강렬하고 짧은 제목)
- **제목 2:** (호기심 유발 제목)
- **제목 3:** (트렌드 반영 제목)

### 2. 썸네일 아이디어
- **메인 비주얼:** (첫 프레임이 썸네일이 되므로 강렬한 이미지)
- **텍스트:** (큰 글씨, 강조 문구)
- **색상/스타일:** (눈에 띄는 색상, 대비)

### 3. 씬별 구성 (1~10번)

**중요: 촬영 장면과 대사/자막에는 이모티콘을 절대 사용하지 마세요. 텍스트만 작성하세요.**

**씬 1 (0-3초)**
- 시간: 0-3초
- 촬영 장면: (첫 화면 구성, 강렬한 비주얼)
- 대사/자막: (강렬한 한 문장, 큰 자막)
- 효과음/음악: (트렌드 음악 시작)
- 편집 팁: 빠른 컷, 줌인 효과

**씬 2 (3-10초)**
- 시간: 3-10초
- 촬영 장면: (문제 상황 제시)
- 대사/자막: (공감 유발 멘트)
- 효과음/음악: (배경음악 지속)
- 편집 팁: 화면 전환, 자막 강조

**씬 3 (10-20초)**
- 시간: 10-20초
- 촬영 장면: (첫 번째 핵심 내용)
- 대사/자막: (핵심 포인트 1)
- 효과음/음악: (효과음 추가)
- 편집 팁: 클로즈업, 하이라이트

**씬 4 (20-30초)**
- 시간: 20-30초
- 촬영 장면: (두 번째 핵심 내용)
- 대사/자막: (핵심 포인트 2)
- 효과음/음악: (효과음 추가)
- 편집 팁: 화면 분할, 비교

**씬 5 (30-40초)**
- 시간: 30-40초
- 촬영 장면: (세 번째 핵심 내용)
- 대사/자막: (핵심 포인트 3)
- 효과음/음악: (효과음 추가)
- 편집 팁: 빠른 몽타주

**씬 6 (40-50초)**
- 시간: 40-50초
- 촬영 장면: (결과/정리)
- 대사/자막: (요약 멘트)
- 효과음/음악: (음악 크레센도)
- 편집 팁: 슬로우 모션, 강조

**씬 7 (50-60초)**
- 시간: 50-60초
- 촬영 장면: (CTA 또는 반전)
- 대사/자막: (구독/좋아요 유도)
- 효과음/음악: (음악 마무리)
- 편집 팁: 엔딩 자막, 로고

(영상 길이에 따라 씬 8, 9, 10도 동일한 형식으로 작성) 

### 4. 자막 스타일
- **폰트:** (추천 폰트)
- **색상:** (배경과 대비되는 색상)
- **위치:** (화면 중앙 또는 하단)
- **효과:** (등장 애니메이션)

### 5. 음악/효과음 추천
- **배경음악:** (트렌드 음악 또는 분위기에 맞는 음악)
- **효과음:** (강조할 부분의 효과음)

### 6. 해시태그 (10개)
#Shorts #숏폼 #... (관련 해시태그)

### 7. 예상 성과
- **타겟 시청자:** 
- **예상 조회수:** 
- **성공 포인트:** 
  - 포인트 1
  - 포인트 2
  - 포인트 3

**추가 제안:**
- 시리즈화 아이디어
- 챌린지/트렌드 활용 방안
"""
        
        # 4. AI 기획안 생성
        plan = call_gemini(prompt)
        
        if not plan:
            return jsonify({'error': 'AI 기획안 생성에 실패했습니다'}), 500
        
        # 5. 난수 URL 생성
        import secrets
        import string
        
        def generate_unique_url():
            """8자리 난수 URL 생성"""
            chars = string.ascii_lowercase + string.digits
            while True:
                url = ''.join(secrets.choice(chars) for _ in range(8))
                # 중복 확인
                existing = ShortsPlan.query.filter_by(unique_url=url).first()
                if not existing:
                    return url
        
        unique_url = generate_unique_url()
        
        # 6. 기획안 파싱 (구조화)
        parsed_data = parse_plan_content(plan)
        
        # 7. 데이터베이스에 저장 (미발행 상태)
        shorts_plan = ShortsPlan(
            user_id=None,  # UUID 타입이므로 None으로 설정
            plan_type='youtube',
            channel_url=channel_url,
            topic=topic,
            keywords=keywords,
            length=length,
            brand_name=brand_name,
            product_features=product_features,
            main_content=main_content,
            required_content=required_content,
            plan_content=plan,
            unique_url=unique_url,
            is_published=False,
            # 구조화된 데이터
            channel_analysis=parsed_data.get('channel_analysis', ''),
            title_options=json.dumps(parsed_data.get('title_options', []), ensure_ascii=False),
            thumbnail_idea=parsed_data.get('thumbnail_idea', ''),
            scenes=json.dumps(parsed_data.get('scenes', []), ensure_ascii=False),
            subtitle_style=parsed_data.get('subtitle_style', ''),
            music_effects=parsed_data.get('music_effects', ''),
            hashtags=parsed_data.get('hashtags', ''),
            expected_results=parsed_data.get('expected_results', '')
        )
        db.session.add(shorts_plan)
        db.session.commit()
        
        # 7. 응답
        return jsonify({
            'plan_id': shorts_plan.id,
            'unique_url': unique_url,
            'is_published': False,
            'channel_info': {
                'name': channel_analysis['channel_name'],
                'subscribers': channel_analysis['subscriber_count'],
                'shorts_count': len(channel_analysis['shorts'])
            },
            'plan': plan
        }), 200
        
    except Exception as e:
        print(f"Shorts plan generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500




# ============================================================
# 기획안 조회 API
# ============================================================

@shorts_planner_bp.route('/plans', methods=['GET'])
def get_plans():
    """사용자의 모든 기획안 조회"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plans = ShortsPlan.query.filter_by(user_id=user_id).order_by(ShortsPlan.created_at.desc()).all()
        
        return jsonify({
            'plans': [plan.to_dict() for plan in plans]
        }), 200
        
    except Exception as e:
        print(f"Plans retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@shorts_planner_bp.route('/plans/<int:plan_id>', methods=['GET'])
def get_plan(plan_id):
    """특정 기획안 조회"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id).first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없습니다'}), 404
        
        return jsonify(plan.to_dict()), 200
        
    except Exception as e:
        print(f"Plan retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# 기획안 수정 API
# ============================================================

@shorts_planner_bp.route('/plans/<int:plan_id>', methods=['PUT'])
def update_plan(plan_id):
    """기획안 수정"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id).first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없습니다'}), 404
        
        data = request.json
        
        # 수정 가능한 필드 업데이트
        if 'topic' in data:
            plan.topic = data['topic']
        if 'keywords' in data:
            plan.keywords = data['keywords']
        if 'length' in data:
            plan.length = data['length']
        if 'brand_name' in data:
            plan.brand_name = data['brand_name']
        if 'product_features' in data:
            plan.product_features = data['product_features']
        if 'main_content' in data:
            plan.main_content = data['main_content']
        if 'required_content' in data:
            plan.required_content = data['required_content']
        if 'plan_content' in data:
            plan.plan_content = data['plan_content']
        
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': '기획안이 수정되었습니다',
            'plan': plan.to_dict()
        }), 200
        
    except Exception as e:
        print(f"Plan update error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# 기획안 삭제 API
# ============================================================

@shorts_planner_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    """기획안 삭제"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id).first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없습니다'}), 404
        
        db.session.delete(plan)
        db.session.commit()
        
        return jsonify({
            'message': '기획안이 삭제되었습니다'
        }), 200
        
    except Exception as e:
        print(f"Plan deletion error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500




# ============================================================
# 기획안 발행 API
# ============================================================

@shorts_planner_bp.route('/plans/<int:plan_id>/publish', methods=['POST'])
def publish_plan(plan_id):
    """기획안 발행 (공개 URL 활성화)"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id).first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없습니다'}), 404
        
        # 발행 상태 업데이트
        plan.is_published = True
        plan.published_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': '기획안이 발행되었습니다',
            'unique_url': plan.unique_url,
            'public_url': f'/guide/{plan.unique_url}'
        }), 200
        
    except Exception as e:
        print(f"Plan publish error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# 공개 기획안 조회 API (로그인 불필요)
# ============================================================

@shorts_planner_bp.route('/public/<unique_url>', methods=['GET'])
def get_public_plan(unique_url):
    """공개된 기획안 조회 (난수 URL로 접근, 로그인 불필요)"""
    
    try:
        plan = ShortsPlan.query.filter_by(unique_url=unique_url, is_published=True).first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없거나 아직 발행되지 않았습니다'}), 404
        
        return jsonify(plan.to_dict()), 200
        
    except Exception as e:
        print(f"Public plan retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

