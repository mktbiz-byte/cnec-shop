"""
숏폼 기획안 데이터 모델
"""

from src.models.user import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
import uuid


class ShortsPlan(db.Model):
    """숏폼 기획안 저장 테이블"""
    __tablename__ = 'shorts_plans'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), nullable=True)  # 생성한 사용자 ID (auth.users 참조)
    plan_type = db.Column(db.String(50), nullable=False)  # 'youtube' 또는 'instagram'
    
    # 입력 정보
    channel_url = db.Column(db.Text)
    account_name = db.Column(db.String(200))
    topic = db.Column(db.Text, nullable=False)
    keywords = db.Column(db.Text)
    length = db.Column(db.String(20))
    brand_name = db.Column(db.Text)
    product_features = db.Column(db.Text)
    main_content = db.Column(db.Text)
    required_content = db.Column(db.Text)
    
    # 생성된 기획안
    plan_content = db.Column(db.Text, nullable=False)
    
    # 구조화된 기획안 데이터 (JSON)
    reference_urls = db.Column(db.Text)  # JSON 배열
    channel_analysis = db.Column(db.Text)
    title_options = db.Column(db.Text)  # JSON 배열 (3개)
    selected_title_index = db.Column(db.Integer, default=0)
    thumbnail_idea = db.Column(db.Text)
    scenes = db.Column(db.Text)  # JSON 배열 (1~10번 씬)
    subtitle_style = db.Column(db.Text)
    music_effects = db.Column(db.Text)
    hashtags = db.Column(db.Text)
    expected_results = db.Column(db.Text)
    
    # URL 및 발행 상태
    unique_url = db.Column(db.String(20), unique=True, nullable=False)  # 난수 URL
    is_published = db.Column(db.Boolean, default=False)  # 발행 여부
    published_at = db.Column(db.DateTime)  # 발행 시간
    
    # 메타 정보
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """딕셔너리로 변환"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_type': self.plan_type,
            'channel_url': self.channel_url,
            'account_name': self.account_name,
            'topic': self.topic,
            'keywords': self.keywords,
            'length': self.length,
            'brand_name': self.brand_name,
            'product_features': self.product_features,
            'main_content': self.main_content,
            'required_content': self.required_content,
            'plan_content': self.plan_content,
            'reference_urls': self.reference_urls,
            'channel_analysis': self.channel_analysis,
            'title_options': self.title_options,
            'selected_title_index': self.selected_title_index,
            'thumbnail_idea': self.thumbnail_idea,
            'scenes': self.scenes,
            'subtitle_style': self.subtitle_style,
            'music_effects': self.music_effects,
            'hashtags': self.hashtags,
            'expected_results': self.expected_results,
            'unique_url': self.unique_url,
            'is_published': self.is_published,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

