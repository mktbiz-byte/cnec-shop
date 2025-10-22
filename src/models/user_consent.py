"""
사용자 동의 관리 모델 (YouTube API ToS 준수)
"""

import sqlite3
import os
from datetime import datetime, timedelta
from threading import Lock

class UserConsentDatabase:
    """사용자 동의 정보 데이터베이스"""
    
    def __init__(self, db_path='data/user_consent.db'):
        self.db_path = db_path
        self._lock = Lock()
        self._init_database()
    
    def _init_database(self):
        """데이터베이스 초기화"""
        # 데이터 디렉토리 생성
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 사용자 동의 테이블
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_consents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    consent_type TEXT NOT NULL,
                    consent_granted BOOLEAN NOT NULL,
                    consent_text TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    revoked_at TIMESTAMP NULL
                )
            ''')
            
            # 데이터 저장 로그 테이블
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS data_storage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    data_type TEXT NOT NULL,
                    data_purpose TEXT NOT NULL,
                    channel_id TEXT,
                    stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    deleted_at TIMESTAMP NULL
                )
            ''')
            
            # 인덱스 생성
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_session_id 
                ON user_consents(session_id)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_consent_type 
                ON user_consents(consent_type)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_data_session 
                ON data_storage_logs(session_id)
            ''')
            
            conn.commit()
            conn.close()
    
    def record_consent(self, session_id, consent_type, consent_granted, 
                      ip_address=None, user_agent=None, consent_text=None, 
                      duration_hours=24):
        """
        사용자 동의 기록
        
        Args:
            session_id: 세션 ID
            consent_type: 동의 유형 ('youtube_data', 'channel_storage', 'analytics')
            consent_granted: 동의 여부
            ip_address: IP 주소
            user_agent: 사용자 에이전트
            consent_text: 동의 문구
            duration_hours: 동의 유효 시간 (시간)
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            expires_at = datetime.now() + timedelta(hours=duration_hours)
            
            cursor.execute('''
                INSERT INTO user_consents (
                    session_id, ip_address, user_agent, consent_type,
                    consent_granted, consent_text, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id, ip_address, user_agent, consent_type,
                consent_granted, consent_text, expires_at
            ))
            
            conn.commit()
            conn.close()
    
    def check_consent(self, session_id, consent_type):
        """
        사용자 동의 확인
        
        Args:
            session_id: 세션 ID
            consent_type: 동의 유형
            
        Returns:
            bool: 동의 여부
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT consent_granted FROM user_consents
                WHERE session_id = ? AND consent_type = ?
                AND expires_at > CURRENT_TIMESTAMP
                AND revoked_at IS NULL
                ORDER BY created_at DESC
                LIMIT 1
            ''', (session_id, consent_type))
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] if result else False
    
    def revoke_consent(self, session_id, consent_type=None):
        """
        사용자 동의 철회
        
        Args:
            session_id: 세션 ID
            consent_type: 동의 유형 (None이면 모든 동의 철회)
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if consent_type:
                cursor.execute('''
                    UPDATE user_consents SET revoked_at = CURRENT_TIMESTAMP
                    WHERE session_id = ? AND consent_type = ? AND revoked_at IS NULL
                ''', (session_id, consent_type))
            else:
                cursor.execute('''
                    UPDATE user_consents SET revoked_at = CURRENT_TIMESTAMP
                    WHERE session_id = ? AND revoked_at IS NULL
                ''', (session_id,))
            
            conn.commit()
            conn.close()
    
    def log_data_storage(self, session_id, data_type, data_purpose, 
                        channel_id=None, retention_hours=24):
        """
        데이터 저장 로그 기록
        
        Args:
            session_id: 세션 ID
            data_type: 데이터 유형 ('channel_info', 'video_list', 'statistics')
            data_purpose: 저장 목적
            channel_id: 채널 ID
            retention_hours: 보존 시간 (시간)
        """
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            expires_at = datetime.now() + timedelta(hours=retention_hours)
            
            cursor.execute('''
                INSERT INTO data_storage_logs (
                    session_id, data_type, data_purpose, channel_id, expires_at
                ) VALUES (?, ?, ?, ?, ?)
            ''', (session_id, data_type, data_purpose, channel_id, expires_at))
            
            conn.commit()
            conn.close()
    
    def cleanup_expired_data(self):
        """만료된 데이터 정리"""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 만료된 동의 정보 삭제
            cursor.execute('''
                DELETE FROM user_consents 
                WHERE expires_at < CURRENT_TIMESTAMP
            ''')
            
            # 만료된 데이터 저장 로그 삭제
            cursor.execute('''
                DELETE FROM data_storage_logs 
                WHERE expires_at < CURRENT_TIMESTAMP
            ''')
            
            conn.commit()
            conn.close()
    
    def get_consent_stats(self):
        """동의 통계"""
        with self._lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 총 동의 수
            cursor.execute('SELECT COUNT(*) FROM user_consents')
            total_consents = cursor.fetchone()[0]
            
            # 활성 동의 수
            cursor.execute('''
                SELECT COUNT(*) FROM user_consents 
                WHERE expires_at > CURRENT_TIMESTAMP AND revoked_at IS NULL
            ''')
            active_consents = cursor.fetchone()[0]
            
            # 동의 유형별 통계
            cursor.execute('''
                SELECT consent_type, COUNT(*) FROM user_consents
                WHERE expires_at > CURRENT_TIMESTAMP AND revoked_at IS NULL
                GROUP BY consent_type
            ''')
            consent_by_type = dict(cursor.fetchall())
            
            conn.close()
            
            return {
                'total_consents': total_consents,
                'active_consents': active_consents,
                'consent_by_type': consent_by_type
            }

# 전역 데이터베이스 인스턴스
user_consent_db = UserConsentDatabase()
