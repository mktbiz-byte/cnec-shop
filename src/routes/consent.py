"""
사용자 동의 관리 라우트 (YouTube API ToS 준수)
"""

from flask import Blueprint, jsonify, session, request
from src.models.user_consent import user_consent_db
import uuid

consent_bp = Blueprint('consent', __name__)

@consent_bp.route('/consent', methods=['POST'])
def grant_consent():
    """사용자 동의 부여"""
    try:
        # 세션 ID 생성 또는 가져오기
        if 'session_id' not in session:
            session['session_id'] = str(uuid.uuid4())
        
        session_id = session['session_id']
        
        # 요청 데이터 파싱
        data = request.get_json()
        consent_types = data.get('consent_types', [])
        duration_hours = data.get('duration_hours', 24)  # 기본 24시간
        
        # IP 주소와 User-Agent 수집
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.headers.get('User-Agent')
        
        # 각 동의 유형별로 기록
        for consent_type in consent_types:
            consent_text = get_consent_text(consent_type)
            
            user_consent_db.record_consent(
                session_id=session_id,
                consent_type=consent_type,
                consent_granted=True,
                ip_address=ip_address,
                user_agent=user_agent,
                consent_text=consent_text,
                duration_hours=duration_hours
            )
        
        return jsonify({
            'success': True,
            'message': '동의가 성공적으로 기록되었습니다.',
            'session_id': session_id,
            'consents': consent_types,
            'expires_hours': duration_hours
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consent_bp.route('/consent/status', methods=['GET'])
def get_consent_status():
    """현재 동의 상태 조회"""
    try:
        if 'session_id' not in session:
            return jsonify({
                'consents': {},
                'session_exists': False
            })
        
        session_id = session['session_id']
        
        # 각 동의 유형별 상태 확인
        consent_types = ['youtube_data', 'channel_storage', 'analytics']
        consents = {}
        
        for consent_type in consent_types:
            consents[consent_type] = user_consent_db.check_consent(session_id, consent_type)
        
        return jsonify({
            'consents': consents,
            'session_id': session_id,
            'session_exists': True
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consent_bp.route('/consent/revoke', methods=['POST'])
def revoke_consent():
    """사용자 동의 철회"""
    try:
        if 'session_id' not in session:
            return jsonify({'error': 'No active session'}), 400
        
        session_id = session['session_id']
        
        # 요청 데이터 파싱
        data = request.get_json()
        consent_type = data.get('consent_type')  # None이면 모든 동의 철회
        
        user_consent_db.revoke_consent(session_id, consent_type)
        
        return jsonify({
            'success': True,
            'message': '동의가 성공적으로 철회되었습니다.',
            'revoked_type': consent_type or 'all'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consent_bp.route('/consent/info', methods=['GET'])
def get_consent_info():
    """동의 관련 정보 제공"""
    return jsonify({
        'consent_types': {
            'youtube_data': {
                'name': 'YouTube 데이터 조회',
                'description': 'YouTube 채널 정보 및 동영상 데이터 조회를 위한 동의',
                'required_for': ['채널 정보 조회', '동영상 목록 조회', '통계 조회'],
                'data_retention': '24시간',
                'korean_terms': {
                    'views': '조회수',
                    'subscribers': '구독자',
                    'videos': '동영상'
                }
            },
            'channel_storage': {
                'name': '채널 정보 저장',
                'description': '조회한 채널 정보를 임시 저장하여 빠른 재조회를 위한 동의',
                'required_for': ['채널 정보 캐싱', '검색 기록', '추천 기능'],
                'data_retention': '24시간'
            },
            'analytics': {
                'name': '분석 및 통계',
                'description': '서비스 개선을 위한 사용 패턴 분석 동의',
                'required_for': ['서비스 개선', '사용 통계', '트렌드 분석'],
                'data_retention': '7일'
            }
        },
        'privacy_policy': {
            'data_minimization': '필요한 최소한의 데이터만 수집합니다.',
            'purpose_limitation': '명시된 목적으로만 데이터를 사용합니다.',
            'retention_limit': '동의한 기간 이후 자동으로 데이터를 삭제합니다.',
            'user_control': '언제든지 동의를 철회할 수 있습니다.'
        },
        'youtube_api_compliance': {
            'single_project': '하나의 Google Cloud 프로젝트만 사용합니다.',
            'user_consent': '사용자 동의 없이는 데이터를 저장하지 않습니다.',
            'korean_terminology': 'YouTube 메트릭에 한국어 용어를 표시합니다.',
            'no_independent_metrics': 'YouTube API 외부의 독립 메트릭을 제공하지 않습니다.'
        }
    })

def get_consent_text(consent_type):
    """동의 유형별 동의 문구 반환"""
    consent_texts = {
        'youtube_data': '''
YouTube 데이터 조회 동의

본 서비스는 YouTube Data API v3를 사용하여 다음 정보를 조회합니다:
- 채널 정보 (이름, 설명, 구독자 수, 동영상 수, 조회수)
- 동영상 목록 및 통계
- 공개 프로필 정보

수집된 데이터는:
- 사용자 요청에 따른 정보 제공 목적으로만 사용됩니다
- 24시간 후 자동으로 삭제됩니다
- 제3자와 공유되지 않습니다

언제든지 동의를 철회할 수 있습니다.
        ''',
        'channel_storage': '''
채널 정보 저장 동의

조회한 채널 정보를 임시 저장하여:
- 빠른 재조회 서비스 제공
- 검색 기록 관리
- 개인화된 추천 기능 제공

저장된 데이터는:
- 24시간 후 자동으로 삭제됩니다
- 암호화되어 안전하게 보관됩니다
- 서비스 개선 목적으로만 사용됩니다
        ''',
        'analytics': '''
분석 및 통계 동의

서비스 개선을 위해 다음 정보를 수집합니다:
- 사용 패턴 및 선호도
- 검색 키워드 및 빈도
- 서비스 이용 시간 및 기능 사용률

수집된 분석 데이터는:
- 개인을 식별할 수 없는 형태로 처리됩니다
- 7일 후 자동으로 삭제됩니다
- 서비스 품질 향상 목적으로만 사용됩니다
        '''
    }
    
    return consent_texts.get(consent_type, '')

@consent_bp.route('/consent/cleanup', methods=['POST'])
def cleanup_expired_data():
    """만료된 데이터 정리 (관리자 전용)"""
    try:
        # 간단한 인증 (실제 환경에서는 더 강력한 인증 필요)
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != 'Bearer admin_cleanup_token':
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_consent_db.cleanup_expired_data()
        
        return jsonify({
            'success': True,
            'message': '만료된 데이터가 정리되었습니다.'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consent_bp.route('/consent/stats', methods=['GET'])
def get_consent_stats():
    """동의 통계 조회 (관리자 전용)"""
    try:
        # 간단한 인증 (실제 환경에서는 더 강력한 인증 필요)
        auth_header = request.headers.get('Authorization')
        if not auth_header or auth_header != 'Bearer admin_stats_token':
            return jsonify({'error': 'Unauthorized'}), 401
        
        stats = user_consent_db.get_consent_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
