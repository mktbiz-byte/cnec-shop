import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, request
from flask_cors import CORS
from dotenv import load_dotenv
from src.models.user import db

# .env 파일 로드
load_dotenv()
from src.routes.user import user_bp
from src.routes.youtube import youtube_bp
from src.routes.ai_consultant import ai_bp
from src.routes.admin import admin_bp, init_api_keys
from src.routes.analytics import analytics_bp
from src.routes.trends import trends_bp
from src.routes.beauty import beauty_bp
from src.routes.admin_auth import admin_auth_bp, init_admin_user
from src.routes.special_user_auth import special_user_bp, init_special_users
from src.routes.database import database_bp
from src.routes.video_planner import video_planner_bp
from src.routes.video_planner_v2 import video_planner_v2_bp
from src.routes.special_auth import special_auth_bp
from src.routes.creator_contact import creator_contact_bp
from src.routes.search_history_routes import search_history_bp
from src.routes.shorts_planner import shorts_planner_bp
from src.routes.instagram_planner import instagram_planner_bp
from src.routes.planner_pages import planner_pages_bp
from src.routes.planner_admin import planner_admin_bp
from src.routes.consent import consent_bp
from src.routes.data_management import data_management_bp
from src.routes.debug_keys import debug_keys_bp
from src.utils.data_retention import data_retention_manager
from src.middleware.visitor_tracker import track_visitor

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'asdf#FGSgvasgf$5$WGT')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
CORS(app, supports_credentials=True)

# API 블루프린트 등록
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(youtube_bp, url_prefix='/api/youtube')
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(trends_bp, url_prefix='/api/trends')
app.register_blueprint(beauty_bp, url_prefix='/api/beauty')
app.register_blueprint(admin_auth_bp, url_prefix='/api/admin-auth')
app.register_blueprint(database_bp, url_prefix='/api/database')
app.register_blueprint(video_planner_bp, url_prefix='/api/video-planner-old')
app.register_blueprint(video_planner_v2_bp)  # /api/video-planner
app.register_blueprint(special_user_bp)  # /api/special-user
app.register_blueprint(special_auth_bp, url_prefix='/api/special-auth')
app.register_blueprint(creator_contact_bp, url_prefix='/api/creator-contact')
app.register_blueprint(search_history_bp)  # /api/search-history
app.register_blueprint(shorts_planner_bp)  # /api/shorts-planner
app.register_blueprint(instagram_planner_bp)  # /api/instagram-planner
app.register_blueprint(planner_pages_bp)  # /video-planner, /instagram-planner pages
app.register_blueprint(planner_admin_bp, url_prefix='/api/admin')  # /api/admin/planner-users
app.register_blueprint(consent_bp, url_prefix='/api/youtube')  # /api/youtube/consent
app.register_blueprint(data_management_bp, url_prefix='/api/data')  # /api/data
app.register_blueprint(debug_keys_bp, url_prefix='/api/debug')  # /api/debug (발표용 임시)

# 저장된 API 키 로드
init_api_keys()

# 데이터 보존 관리자 초기화 (ToS 준수)
print("✅ 데이터 보존 관리자 초기화 완료 - YouTube API ToS 준수")

# 방문자 추적 미들웨어
@app.before_request
def before_request():
    track_visitor()

# 데이터베이스 설정 (Supabase PostgreSQL 또는 로컬 SQLite)
supabase_db_url = os.getenv('DATABASE_URL')
if supabase_db_url:
    # Supabase PostgreSQL 사용 (프로덕션)
    # Render.com에서 제공하는 DATABASE_URL이 postgres://로 시작하면 postgresql://로 변경
    if supabase_db_url.startswith('postgres://'):
        supabase_db_url = supabase_db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = supabase_db_url
    print(f"✅ Using Supabase PostgreSQL database")
else:
    # 로컬 개발 환경 - SQLite 사용
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    print(f"ℹ️ Using local SQLite database at {db_path}")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# PostgreSQL 연결 풀 설정 (Supabase Transaction pooler 지원)
if supabase_db_url:
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,  # 연결 상태 확인
        'pool_recycle': 300,  # 5분마다 연결 재생성
        'pool_size': 5,  # 연결 풀 크기 (Transaction pooler는 작게 유지)
        'max_overflow': 10,  # 최대 추가 연결
        'pool_timeout': 30,  # 연결 대기 시간
    }

db.init_app(app)
with app.app_context():
    db.create_all()
    # 관리자 계정 초기화
    init_admin_user()
    # 특별 사용자 초기화
    init_special_users()

# 크리에이터 분석기 정적 파일 제공
@app.route('/creator/<path:path>')
def serve_creator(path):
    """크리에이터 분석기 정적 파일 제공"""
    creator_folder = os.path.join(app.static_folder, 'creator')
    return send_from_directory(creator_folder, path)

# 메인 페이지 (크리에이터 분석기)
@app.route('/')
@app.route('/admin')
def serve_creator_hub():
    """크리에이터 분석기 메인 페이지"""
    creator_folder = os.path.join(app.static_folder, 'creator')
    return send_from_directory(creator_folder, 'index.html')

# SPA를 위한 catch-all 라우트 (숏폼 기획안 생성기)
# 중요: 이 라우트는 블루프린트가 매칭되지 않은 경로만 처리합니다
@app.route('/<path:path>')
def serve(path):
    """
    정적 파일 또는 index.html 제공 (숏폼 기획안 생성기)
    블루프린트가 먼저 매칭되므로 API 경로는 여기 도달하지 않음
    """
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    # 정적 파일이 실제로 존재하면 제공
    if path != "":
        file_path = os.path.join(static_folder_path, path)
        if os.path.isfile(file_path):
            return send_from_directory(static_folder_path, path)
    
    # 그 외 모든 경로는 index.html 제공 (React Router가 처리)
    index_path = os.path.join(static_folder_path, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder_path, 'index.html')
    else:
        return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)


