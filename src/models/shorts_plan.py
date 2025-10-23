"""
숏폼 기획안 데이터 모델
"""

from src.models.user import db
from datetime import datetime


class ShortsPlan(db.Model):
    """숏폼 기획안 저장 테이블"""
    __tablename__ = 'shorts_plans'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)  # 생성한 사용자 ID
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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

