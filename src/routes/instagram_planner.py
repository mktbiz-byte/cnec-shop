"""
인스타그램 릴스 기획안 생성 API
Instagram Reels 전용
"""

from flask import Blueprint, request, jsonify, session
import os
import sys
from src.utils.api_key_manager import get_gemini_api_key, make_youtube_api_request
from src.models.user import db
from src.models.shorts_plan import ShortsPlan
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

instagram_planner_bp = Blueprint('instagram_planner', __name__, url_prefix='/api/instagram-planner')


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
            print(f"[INSTAGRAM_PLANNER] No Gemini API key available")
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
                "temperature": 0.9,
                "maxOutputTokens": 4096,
            }
        }
        
        try:
            print(f"[INSTAGRAM_PLANNER] Calling Gemini API (attempt {attempt+1}/{max_retries})...")
            response = requests.post(url, headers=headers, json=data, timeout=60)
            print(f"[INSTAGRAM_PLANNER] Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        parts = candidate['content']['parts']
                        if len(parts) > 0 and 'text' in parts[0]:
                            print(f"[INSTAGRAM_PLANNER] Successfully generated plan")
                            return parts[0]['text']
                
                print(f"[INSTAGRAM_PLANNER] No valid response from Gemini")
                continue
            elif response.status_code == 429:
                print(f"[INSTAGRAM_PLANNER] Quota exceeded, trying next key...")
                continue
            else:
                print(f"[INSTAGRAM_PLANNER] API error: {response.text}")
                continue
            
        except Exception as e:
            print(f"[INSTAGRAM_PLANNER] Gemini API error: {e}")
            import traceback
            traceback.print_exc()
            if attempt < max_retries - 1:
                continue
    
    print(f"[INSTAGRAM_PLANNER] All {max_retries} attempts failed")
    return None


# ============================================================
# 인스타그램 릴스 기획안 생성 API
# ============================================================

@instagram_planner_bp.route('/generate', methods=['POST'])
def generate_instagram_plan():
    """인스타그램 릴스 기획안 생성"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        data = request.json
        account_name = data.get('account_name', '')  # 인스타그램 계정명
        topic = data.get('topic')
        keywords = data.get('keywords', '')
        length = data.get('length', '30초')  # 기본 30초
        brand_name = data.get('brand_name', '')  # 브랜드/상품명
        product_features = data.get('product_features', '')  # 상품 특징
        main_content = data.get('main_content', '')  # 영상 주요내용
        required_content = data.get('required_content', '')  # 크리에이터가 꼭 넣어야 할 내용
        
        if not topic:
            return jsonify({'error': '주제를 입력해주세요'}), 400
        
        # API 키 로드
        gemini_key = get_gemini_api_key()
        if not gemini_key:
            return jsonify({'error': 'Gemini API 키가 설정되지 않았습니다'}), 503
        
        # 프롬프트 생성
        account_info = f"- 계정명: {account_name}\n" if account_name else ""
        
        prompt = f"""
당신은 Instagram Reels 전문 기획자입니다. 다음 정보를 바탕으로 인스타그램 릴스 기획안을 작성해주세요.

**계정 정보:**
{account_info}

**기획 요청:**
- 주제: {topic}
- 키워드: {keywords}
- 목표 길이: {length}
- 브랜드/상품명: {brand_name}
- 상품 특징: {product_features}
- 영상 주요내용: {main_content}
- 크리에이터가 꼭 넣어야 할 내용: {required_content}

**인스타그램 릴스 기획안 작성 가이드:**
1. **후킹 (0-3초)**: 스크롤을 멈추게 할 강렬한 오프닝
2. **전개 (3-45초)**: 빠른 템포로 핵심 내용 전달, 인스타그램 특성에 맞는 비주얼 중심
3. **마무리 (45-60초)**: CTA(Call To Action) - 팔로우, 저장, 공유 유도

다음 형식으로 작성해주세요:

## 인스타그램 릴스 기획안: {topic}

### 1. 릴스 제목 (3개 제안)
- **제목 1:** (강렬하고 짧은 제목)
- **제목 2:** (호기심 유발 제목)
- **제목 3:** (트렌드 반영 제목)

### 2. 커버 이미지 아이디어
- **메인 비주얼:** (첫 프레임이 커버가 되므로 강렬한 이미지)
- **텍스트:** (큰 글씨, 강조 문구)
- **색상/스타일:** (인스타그램 감성에 맞는 색상, 대비)

### 3. 초별 구성 (테이블 형식)

| 순서 | 시간 | 촬영 장면 | 대사/자막 | 효과음/음악 | 편집 팁 |
|:---:|:---:|:---|:---|:---|:---|
| 1 | 0-3초 | (첫 화면 구성, 강렬한 비주얼) | (강렬한 한 문장, 큰 자막) | (트렌드 음악 시작) | 빠른 컷, 줌인 효과 |
| 2 | 3-10초 | (문제 상황 제시) | (공감 유발 멘트) | (배경음악 지속) | 화면 전환, 자막 강조 |
| 3 | 10-20초 | (첫 번째 핵심 내용) | (핵심 포인트 1) | (효과음 추가) | 클로즈업, 하이라이트 |
| 4 | 20-30초 | (두 번째 핵심 내용) | (핵심 포인트 2) | (효과음 추가) | 화면 분할, 비교 |
| 5 | 30-40초 | (세 번째 핵심 내용) | (핵심 포인트 3) | (효과음 추가) | 빠른 몽타주 |
| 6 | 40-50초 | (결과/정리) | (요약 멘트) | (음악 크레센도) | 슬로우 모션, 강조 |
| 7 | 50-60초 | (CTA) | (팔로우/저장 유도) | (음악 마무리) | 엔딩 자막, 로고 | 

### 4. 자막 스타일
- **폰트:** (인스타그램 감성에 맞는 폰트)
- **색상:** (배경과 대비되는 색상)
- **위치:** (화면 중앙 또는 하단)
- **효과:** (등장 애니메이션)

### 5. 음악/효과음 추천
- **배경음악:** (인스타그램 트렌드 음악 또는 분위기에 맞는 음악)
- **효과음:** (강조할 부분의 효과음)

### 6. 해시태그 (10개)
#Reels #인스타그램 #... (관련 해시태그)

### 7. 캡션 작성
(릴스와 함께 올릴 캡션 작성 - 이모지 포함, 해시태그 포함)

### 8. 예상 성과
- **타겟 시청자:** 
- **예상 도달:** 
- **성공 포인트:** 
  - 포인트 1
  - 포인트 2
  - 포인트 3

**추가 제안:**
- 시리즈화 아이디어
- 챌린지/트렌드 활용 방안
- 스토리 연계 방안

**인스타그램 특화 팁:**
- 세로 비율 (9:16) 최적화
- 첫 3초 내 브랜드/상품 노출
- 자막 필수 (소리 없이 봐도 이해 가능)
- 저장하고 싶은 정보성 콘텐츠
"""
        
        # AI 기획안 생성
        plan = call_gemini(prompt)
        
        if not plan:
            return jsonify({'error': 'AI 기획안 생성에 실패했습니다'}), 500
        
        # 난수 URL 생성
        import secrets
        import string
        
        def generate_unique_url():
            """
8자리 난수 URL 생성"""
            chars = string.ascii_lowercase + string.digits
            while True:
                url = ''.join(secrets.choice(chars) for _ in range(8))
                # 중복 확인
                existing = ShortsPlan.query.filter_by(unique_url=url).first()
                if not existing:
                    return url
        
        unique_url = generate_unique_url()
        
        # 데이터베이스에 저장 (미발행 상태)
        instagram_plan = ShortsPlan(
            user_id=session.get('special_user_id'),
            plan_type='instagram',
            account_name=account_name,
            topic=topic,
            keywords=keywords,
            length=length,
            brand_name=brand_name,
            product_features=product_features,
            main_content=main_content,
            required_content=required_content,
            plan_content=plan,
            unique_url=unique_url,
            is_published=False
        )
        db.session.add(instagram_plan)
        db.session.commit()
        
        # 응답
        return jsonify({
            'plan_id': instagram_plan.id,
            'unique_url': unique_url,
            'is_published': False,
            'account_name': account_name,
            'plan': plan
        }), 200
        
    except Exception as e:
        print(f"Instagram plan generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500




# ============================================================
# 기획안 조회 API
# ============================================================

@instagram_planner_bp.route('/plans', methods=['GET'])
def get_plans():
    """사용자의 모든 인스타그램 기획안 조회"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plans = ShortsPlan.query.filter_by(user_id=user_id, plan_type='instagram').order_by(ShortsPlan.created_at.desc()).all()
        
        return jsonify({
            'plans': [plan.to_dict() for plan in plans]
        }), 200
        
    except Exception as e:
        print(f"Plans retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@instagram_planner_bp.route('/plans/<int:plan_id>', methods=['GET'])
def get_plan(plan_id):
    """특정 인스타그램 기획안 조회"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id, plan_type='instagram').first()
        
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

@instagram_planner_bp.route('/plans/<int:plan_id>', methods=['PUT'])
def update_plan(plan_id):
    """인스타그램 기획안 수정"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id, plan_type='instagram').first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없습니다'}), 404
        
        data = request.json
        
        # 수정 가능한 필드 업데이트
        if 'account_name' in data:
            plan.account_name = data['account_name']
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

@instagram_planner_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
def delete_plan(plan_id):
    """인스타그램 기획안 삭제"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id, plan_type='instagram').first()
        
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

@instagram_planner_bp.route('/plans/<int:plan_id>/publish', methods=['POST'])
def publish_plan(plan_id):
    """기획안 발행 (공개 URL 활성화)"""
    
    # 로그인 확인
    if 'special_user_id' not in session:
        return jsonify({'error': '로그인이 필요합니다'}), 401
    
    try:
        user_id = session.get('special_user_id')
        plan = ShortsPlan.query.filter_by(id=plan_id, user_id=user_id, plan_type='instagram').first()
        
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

@instagram_planner_bp.route('/public/<unique_url>', methods=['GET'])
def get_public_plan(unique_url):
    """공개된 기획안 조회 (난수 URL로 접근, 로그인 불필요)"""
    
    try:
        plan = ShortsPlan.query.filter_by(unique_url=unique_url, is_published=True, plan_type='instagram').first()
        
        if not plan:
            return jsonify({'error': '기획안을 찾을 수 없거나 아직 발행되지 않았습니다'}), 404
        
        return jsonify(plan.to_dict()), 200
        
    except Exception as e:
        print(f"Public plan retrieval error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

