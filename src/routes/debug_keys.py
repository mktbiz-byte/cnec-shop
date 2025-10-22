"""
발표용 임시: API 키 상태 확인 디버그 엔드포인트
"""

from flask import Blueprint, jsonify
import os
from src.routes.youtube import get_youtube_api_keys, get_youtube_api_key

debug_keys_bp = Blueprint('debug_keys', __name__)

@debug_keys_bp.route('/api-keys/status', methods=['GET'])
def get_api_keys_status():
    """API 키 로드 상태 확인 (발표용 디버그)"""
    
    # 환경변수에서 직접 확인
    env_keys = {}
    
    # 메인 키
    main_key = os.getenv('YOUTUBE_API_KEY')
    if main_key:
        env_keys['YOUTUBE_API_KEY'] = f"...{main_key[-8:]}"
    
    # 추가 키들
    for i in range(1, 21):
        key = os.getenv(f'YOUTUBE_API_KEY_{i}')
        if key:
            env_keys[f'YOUTUBE_API_KEY_{i}'] = f"...{key[-8:]}"
    
    # Gemini 키들
    for i in range(1, 11):
        key = os.getenv(f'GEMINI_API_KEY_{i}')
        if key:
            env_keys[f'GEMINI_API_KEY_{i}'] = f"...{key[-8:]}"
    
    # 로드된 키들 확인
    loaded_keys = get_youtube_api_keys()
    loaded_keys_info = []
    
    if loaded_keys:
        for idx, key in enumerate(loaded_keys):
            loaded_keys_info.append({
                'index': idx + 1,
                'key_suffix': f"...{key[-8:]}",
                'length': len(key)
            })
    
    # 현재 선택될 키 확인
    current_key = get_youtube_api_key()
    current_key_info = f"...{current_key[-8:]}" if current_key else None
    
    return jsonify({
        'presentation_mode': True,
        'environment_keys': env_keys,
        'loaded_keys': loaded_keys_info,
        'total_loaded': len(loaded_keys) if loaded_keys else 0,
        'current_selected_key': current_key_info,
        'rotation_active': len(loaded_keys) > 1 if loaded_keys else False,
        'message': '발표용 임시 설정 - 다중 API 키 로테이션 활성화'
    })

@debug_keys_bp.route('/test-rotation', methods=['GET'])
def test_key_rotation():
    """키 로테이션 테스트 (발표용)"""
    
    results = []
    
    # 5번 연속으로 키 선택해서 로테이션 확인
    for i in range(5):
        key = get_youtube_api_key()
        results.append({
            'request': i + 1,
            'selected_key': f"...{key[-8:]}" if key else None
        })
    
    return jsonify({
        'test_results': results,
        'message': '키 로테이션 테스트 완료'
    })
