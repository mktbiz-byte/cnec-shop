"""
AI 예측 서비스
실제 머신러닝 모델을 로드하고 예측을 수행하는 서비스
"""
from typing import Dict, List, Optional
import re

class PredictorService:
    """
    떡상 예측 서비스
    
    현재는 규칙 기반 더미 로직이며, 
    실제로는 학습된 XGBoost/LightGBM 모델을 로드하여 사용
    """
    
    def __init__(self):
        # 실제로는 여기서 모델 파일(.pkl)을 로드
        # self.model = joblib.load('path/to/model.pkl')
        self.beauty_keywords = {
            '올리브영': 0.35,
            '신상': 0.28,
            '내돈내산': 0.23,
            'GRWM': 0.20,
            '리뷰': 0.18,
            '추천템': 0.22,
            '퍼스널컬러': 0.19,
            '쿨톤': 0.15,
            '웜톤': 0.15,
            '틴트': 0.12,
            '립스틱': 0.12,
            '파운데이션': 0.14,
            '세일': 0.25,
            '할인': 0.20
        }
    
    def extract_features(self, title: str, description: Optional[str], tags: Optional[List[str]]) -> Dict:
        """
        텍스트에서 피처 추출
        """
        features = {}
        
        # 제목 길이
        features['title_length'] = len(title)
        
        # 키워드 매칭
        text = title.lower()
        if description:
            text += " " + description.lower()
        
        for keyword, weight in self.beauty_keywords.items():
            if keyword.lower() in text:
                features[f'keyword_{keyword}'] = weight
        
        # 특수문자/이모지 사용 여부
        features['has_emoji'] = 1 if re.search(r'[^\w\s,.]', title) else 0
        
        # 숫자 포함 여부 (예: "10가지", "3분")
        features['has_number'] = 1 if re.search(r'\d+', title) else 0
        
        return features
    
    def predict(self, title: str, description: Optional[str] = None, tags: Optional[List[str]] = None) -> Dict:
        """
        떡상 확률 예측
        """
        # 피처 추출
        features = self.extract_features(title, description, tags)
        
        # 규칙 기반 점수 계산 (실제로는 모델.predict()를 사용)
        base_score = 40.0  # 기본 점수
        
        # 키워드 가중치 합산
        keyword_boost = sum([v for k, v in features.items() if k.startswith('keyword_')]) * 100
        
        # 기타 피처 보너스
        if features.get('has_number'):
            keyword_boost += 5
        if features.get('has_emoji'):
            keyword_boost += 3
        
        # 최종 확률 계산
        probability = min(base_score + keyword_boost, 95.0)  # 최대 95%
        
        # 떡상 여부 판정 (70% 이상)
        is_viral = probability >= 70.0
        
        # 가이드라인 생성
        guideline = self._generate_guideline(features, probability)
        
        # 주요 영향 요인
        top_features = [
            {"feature": k, "impact": v}
            for k, v in features.items()
            if k.startswith('keyword_')
        ]
        top_features = sorted(top_features, key=lambda x: x['impact'], reverse=True)[:3]
        
        return {
            "probability": round(probability, 1),
            "is_viral": is_viral,
            "guideline": guideline,
            "top_features": top_features,
            "features": features
        }
    
    def _generate_guideline(self, features: Dict, probability: float) -> str:
        """
        개인화된 가이드라인 생성
        """
        guidelines = []
        
        # 확률에 따른 기본 메시지
        if probability >= 80:
            guidelines.append("🎉 매우 높은 성공 확률입니다!")
        elif probability >= 70:
            guidelines.append("✨ 좋은 성공 가능성을 보이고 있습니다.")
        elif probability >= 50:
            guidelines.append("💡 몇 가지만 개선하면 성공 확률을 높일 수 있습니다.")
        else:
            guidelines.append("📝 제목과 내용을 다음과 같이 개선해보세요.")
        
        # 키워드 기반 조언
        has_keywords = [k.replace('keyword_', '') for k in features.keys() if k.startswith('keyword_')]
        
        if has_keywords:
            guidelines.append(f"\n✅ 좋은 키워드: {', '.join(has_keywords[:3])}")
        
        # 개선 제안
        missing_keywords = []
        if 'keyword_올리브영' not in features and 'keyword_세일' not in features:
            missing_keywords.append("'올리브영' 또는 '세일'")
        if 'keyword_내돈내산' not in features:
            missing_keywords.append("'내돈내산'")
        
        if missing_keywords:
            guidelines.append(f"\n💡 추가하면 좋은 키워드: {', '.join(missing_keywords)}")
        
        # 썸네일 조언
        guidelines.append("\n📸 썸네일 팁: 얼굴 클로즈업 + 제품 이미지 조합이 클릭률이 가장 높습니다.")
        
        # 업로드 시간 조언
        guidelines.append("\n⏰ 최적 업로드 시간: 금요일 오후 7-9시")
        
        return "\n".join(guidelines)
