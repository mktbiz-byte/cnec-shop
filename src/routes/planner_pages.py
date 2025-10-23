"""
숏폼 기획안 생성기 페이지 라우트
/video-planner, /instagram-planner 등 별도 HTML 제공
"""

from flask import Blueprint, send_from_directory, session, redirect
import os

# 템플릿 폴더 경로
PLANNER_TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates', 'planner')

# Blueprint에 static_folder 지정
planner_pages_bp = Blueprint(
    'planner_pages', 
    __name__,
    static_folder=PLANNER_TEMPLATE_DIR,
    static_url_path='/planner-static'
)


def check_planner_auth():
    """기획안 생성기 접근 권한 확인"""
    return 'special_user_id' in session


@planner_pages_bp.route('/video-planner')
def video_planner_page():
    """YouTube Shorts 기획안 생성기 페이지"""
    if not check_planner_auth():
        return redirect('/planner-login')
    
    return send_from_directory(PLANNER_TEMPLATE_DIR, 'index.html')


@planner_pages_bp.route('/instagram-planner')
def instagram_planner_page():
    """Instagram Reels 기획안 생성기 페이지"""
    if not check_planner_auth():
        return redirect('/planner-login')
    
    return send_from_directory(PLANNER_TEMPLATE_DIR, 'index.html')


@planner_pages_bp.route('/shorts-plan/<int:plan_id>')
def shorts_plan_view(plan_id):
    """YouTube Shorts 기획안 보기 페이지"""
    if not check_planner_auth():
        return redirect('/planner-login')
    
    return send_from_directory(PLANNER_TEMPLATE_DIR, 'index.html')


@planner_pages_bp.route('/instagram-plan/<int:plan_id>')
def instagram_plan_view(plan_id):
    """Instagram Reels 기획안 보기 페이지"""
    if not check_planner_auth():
        return redirect('/planner-login')
    
    return send_from_directory(PLANNER_TEMPLATE_DIR, 'index.html')


@planner_pages_bp.route('/planner-login')
def planner_login_page():
    """기획안 생성기 로그인 페이지"""
    return send_from_directory(PLANNER_TEMPLATE_DIR, 'index.html')


# Assets 파일 제공
@planner_pages_bp.route('/planner-assets/<path:filename>')
def serve_assets(filename):
    """React 빌드 assets 제공"""
    assets_dir = os.path.join(PLANNER_TEMPLATE_DIR, 'assets')
    return send_from_directory(assets_dir, filename)


# vite.svg 제공
@planner_pages_bp.route('/planner-vite.svg')
def serve_vite_svg():
    """vite.svg 제공"""
    return send_from_directory(PLANNER_TEMPLATE_DIR, 'vite.svg')

