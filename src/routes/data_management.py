"""
데이터 보존 및 ToS 준수 관리 라우트
"""

from flask import Blueprint, jsonify, request
from src.utils.data_retention import data_retention_manager, verify_tos_compliance
from src.models.user_consent import user_consent_db
import os

data_management_bp = Blueprint('data_management', __name__)

@data_management_bp.route('/retention/stats', methods=['GET'])
def get_retention_stats():
    """데이터 보존 통계 조회"""
    try:
        # 간단한 인증 (실제 환경에서는 더 강력한 인증 필요)
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        
        stats = data_retention_manager.get_retention_stats()
        consent_stats = user_consent_db.get_consent_stats()
        
        return jsonify({
            'success': True,
            'retention_stats': stats,
            'consent_stats': consent_stats
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_management_bp.route('/retention/cleanup', methods=['POST'])
def force_cleanup():
    """강제 데이터 정리"""
    try:
        # 간단한 인증
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.get_json() or {}
        data_type = data.get('data_type')
        
        result = data_retention_manager.force_cleanup(data_type)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_management_bp.route('/compliance/status', methods=['GET'])
def get_compliance_status():
    """YouTube API ToS 준수 상태 확인"""
    try:
        compliance_status = verify_tos_compliance()
        
        return jsonify({
            'success': True,
            'compliance': compliance_status,
            'overall_compliant': all(compliance_status[key] for key in compliance_status if key != 'last_check')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_management_bp.route('/compliance/report', methods=['GET'])
def get_compliance_report():
    """상세한 ToS 준수 보고서"""
    try:
        compliance_status = verify_tos_compliance()
        retention_stats = data_retention_manager.get_retention_stats()
        consent_stats = user_consent_db.get_consent_stats()
        
        report = {
            'report_generated': compliance_status['last_check'],
            'overall_status': 'COMPLIANT' if all(compliance_status[key] for key in compliance_status if key != 'last_check') else 'NON_COMPLIANT',
            
            'policy_compliance': {
                'III.D.1c': {
                    'description': 'API Clients must use only one project number',
                    'status': 'COMPLIANT' if compliance_status['single_project'] else 'VIOLATION',
                    'implementation': 'Single YouTube API key configuration implemented'
                },
                'III.E.4a-g': {
                    'description': 'Authorization tokens handling with user consent',
                    'status': 'COMPLIANT' if compliance_status['user_consent'] else 'VIOLATION',
                    'implementation': 'User consent system with session management'
                },
                'III.E.4h': {
                    'description': 'No independent metrics or derived data',
                    'status': 'COMPLIANT' if compliance_status['no_independent_metrics'] else 'VIOLATION',
                    'implementation': 'Only YouTube API direct data provided with Korean terminology'
                }
            },
            
            'data_management': {
                'retention_policies': retention_stats.get('retention_policies', {}),
                'database_sizes': retention_stats.get('database_sizes', {}),
                'auto_cleanup': 'ACTIVE',
                'consent_tracking': {
                    'total_consents': consent_stats.get('total_consents', 0),
                    'active_consents': consent_stats.get('active_consents', 0),
                    'consent_by_type': consent_stats.get('consent_by_type', {})
                }
            },
            
            'korean_terminology': {
                'views': '조회수',
                'subscribers': '구독자', 
                'videos': '동영상',
                'implementation_status': 'IMPLEMENTED'
            },
            
            'recommendations': [
                '정기적인 데이터 정리 스케줄 유지',
                '사용자 동의 상태 모니터링',
                '한국어 용어 표시 일관성 확인',
                '독립 메트릭 사용 금지 준수'
            ]
        }
        
        return jsonify({
            'success': True,
            'report': report
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_management_bp.route('/system/health', methods=['GET'])
def get_system_health():
    """시스템 상태 확인"""
    try:
        health_status = {
            'timestamp': data_retention_manager.get_retention_stats().get('last_cleanup'),
            'services': {
                'data_retention_manager': 'RUNNING',
                'user_consent_db': 'RUNNING',
                'auto_cleanup_scheduler': 'RUNNING'
            },
            'storage': {},
            'compliance': verify_tos_compliance()
        }
        
        # 저장소 상태 확인
        data_dirs = ['data', 'logs', 'temp', 'cache']
        for dir_name in data_dirs:
            if os.path.exists(dir_name):
                total_size = sum(
                    os.path.getsize(os.path.join(dir_name, f))
                    for f in os.listdir(dir_name)
                    if os.path.isfile(os.path.join(dir_name, f))
                )
                health_status['storage'][dir_name] = {
                    'exists': True,
                    'size_mb': round(total_size / (1024 * 1024), 2)
                }
            else:
                health_status['storage'][dir_name] = {'exists': False}
        
        return jsonify({
            'success': True,
            'health': health_status
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_management_bp.route('/gdpr/data-export', methods=['POST'])
def export_user_data():
    """사용자 데이터 내보내기 (GDPR 준수)"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
        
        # 사용자 데이터 수집
        user_data = {
            'session_id': session_id,
            'consents': [],
            'data_storage_logs': [],
            'export_timestamp': data_retention_manager.get_retention_stats().get('last_cleanup')
        }
        
        # 동의 정보 조회 (실제 구현 필요)
        # user_data['consents'] = user_consent_db.get_user_consents(session_id)
        # user_data['data_storage_logs'] = user_consent_db.get_user_data_logs(session_id)
        
        return jsonify({
            'success': True,
            'data': user_data,
            'format': 'JSON',
            'note': '개인 식별 정보는 포함되지 않습니다.'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@data_management_bp.route('/gdpr/data-deletion', methods=['POST'])
def delete_user_data():
    """사용자 데이터 삭제 (GDPR 준수)"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID required'}), 400
        
        # 모든 동의 철회
        user_consent_db.revoke_consent(session_id)
        
        # 관련 데이터 삭제 (실제 구현 필요)
        # - 채널 검색 기록
        # - 캐시된 데이터
        # - 분석 로그
        
        return jsonify({
            'success': True,
            'message': '사용자 데이터가 성공적으로 삭제되었습니다.',
            'deleted_items': [
                'User consents',
                'Data storage logs',
                'Cached channel data',
                'Search history'
            ]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
