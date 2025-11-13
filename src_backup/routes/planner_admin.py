"""
기획안 생성기 계정 관리 API (관리자 전용)
"""

from flask import Blueprint, request, jsonify, session
from src.models.user import db
from src.models.special_user import SpecialUser
from werkzeug.security import generate_password_hash

planner_admin_bp = Blueprint('planner_admin', __name__)


def check_admin_auth():
    """관리자 권한 확인"""
    return 'admin_id' in session


@planner_admin_bp.route('/planner-users', methods=['GET'])
def get_planner_users():
    """기획안 생성기 계정 목록 조회"""
    if not check_admin_auth():
        return jsonify({'error': '관리자 권한이 필요합니다'}), 401
    
    try:
        users = SpecialUser.query.all()
        return jsonify({
            'users': [
                {
                    'id': user.id,
                    'username': user.username,
                    'created_at': user.created_at.isoformat() if user.created_at else None
                }
                for user in users
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@planner_admin_bp.route('/planner-users', methods=['POST'])
def create_planner_user():
    """기획안 생성기 계정 생성"""
    if not check_admin_auth():
        return jsonify({'error': '관리자 권한이 필요합니다'}), 401
    
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': '아이디와 비밀번호를 입력하세요'}), 400
        
        # 중복 확인
        existing_user = SpecialUser.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({'error': '이미 존재하는 아이디입니다'}), 400
        
        # 새 사용자 생성
        new_user = SpecialUser(
            username=username,
            password_hash=generate_password_hash(password)
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': '계정이 생성되었습니다',
            'user': {
                'id': new_user.id,
                'username': new_user.username
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@planner_admin_bp.route('/planner-users/<int:user_id>', methods=['DELETE'])
def delete_planner_user(user_id):
    """기획안 생성기 계정 삭제"""
    if not check_admin_auth():
        return jsonify({'error': '관리자 권한이 필요합니다'}), 401
    
    try:
        user = SpecialUser.query.get(user_id)
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': '계정이 삭제되었습니다'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@planner_admin_bp.route('/planner-users/<int:user_id>/password', methods=['PUT'])
def update_planner_password(user_id):
    """기획안 생성기 계정 비밀번호 변경"""
    if not check_admin_auth():
        return jsonify({'error': '관리자 권한이 필요합니다'}), 401
    
    try:
        data = request.json
        new_password = data.get('password')
        
        if not new_password:
            return jsonify({'error': '새 비밀번호를 입력하세요'}), 400
        
        user = SpecialUser.query.get(user_id)
        if not user:
            return jsonify({'error': '사용자를 찾을 수 없습니다'}), 404
        
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'message': '비밀번호가 변경되었습니다'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

