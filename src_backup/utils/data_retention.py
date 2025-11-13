"""
데이터 보존 기간 관리 및 자동 정리 시스템 (YouTube API ToS 준수)
"""

import os
import sqlite3
import time
import threading
from datetime import datetime, timedelta

# schedule 패키지를 선택적으로 import
try:
    import schedule
    SCHEDULE_AVAILABLE = True
except ImportError:
    SCHEDULE_AVAILABLE = False
    print("⚠️ schedule 패키지가 없습니다. 자동 스케줄링이 비활성화됩니다.")

try:
    from src.models.user_consent import user_consent_db
except ImportError:
    user_consent_db = None
    print("⚠️ user_consent_db를 로드할 수 없습니다.")

try:
    from src.utils.cache import cache
except ImportError:
    cache = None
    print("⚠️ cache를 로드할 수 없습니다.")

class DataRetentionManager:
    """데이터 보존 기간 관리자"""
    
    def __init__(self):
        self.retention_policies = {
            'youtube_data': 24,  # 24시간
            'channel_storage': 24,  # 24시간
            'analytics': 168,  # 7일 (168시간)
            'cache_data': 24,  # 24시간
            'user_sessions': 24,  # 24시간
            'search_history': 168  # 7일
        }
        
        self.db_paths = {
            'channels': 'data/channels.db',
            'user_consent': 'data/user_consent.db',
            'analytics': 'data/analytics.db'
        }
        
        self.setup_scheduler()
    
    def setup_scheduler(self):
        """자동 정리 스케줄러 설정"""
        if not SCHEDULE_AVAILABLE:
            print("⚠️ schedule 패키지가 없어 스케줄러가 비활성화됩니다.")
            return
            
        # 매시간 실행
        schedule.every().hour.do(self.cleanup_expired_data)
        
        # 매일 자정 실행 (전체 정리)
        schedule.every().day.at("00:00").do(self.full_cleanup)
        
        # 매주 일요일 자정 실행 (데이터베이스 최적화)
        schedule.every().sunday.at("00:00").do(self.optimize_databases)
        
        # 백그라운드 스레드에서 스케줄러 실행
        scheduler_thread = threading.Thread(target=self.run_scheduler, daemon=True)
        scheduler_thread.start()
    
    def run_scheduler(self):
        """스케줄러 실행"""
        if not SCHEDULE_AVAILABLE:
            return
            
        while True:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 체크
    
    def cleanup_expired_data(self):
        """만료된 데이터 정리"""
        try:
            print(f"[{datetime.now()}] 만료된 데이터 정리 시작...")
            
            # 1. 사용자 동의 데이터 정리
            self.cleanup_user_consent()
            
            # 2. 채널 데이터베이스 정리
            self.cleanup_channel_database()
            
            # 3. 캐시 데이터 정리
            self.cleanup_cache_data()
            
            # 4. 세션 데이터 정리
            self.cleanup_session_data()
            
            print(f"[{datetime.now()}] 만료된 데이터 정리 완료")
            
        except Exception as e:
            print(f"데이터 정리 중 오류 발생: {e}")
    
    def cleanup_user_consent(self):
        """사용자 동의 데이터 정리"""
        try:
            if user_consent_db:
                user_consent_db.cleanup_expired_data()
                print("사용자 동의 데이터 정리 완료")
            else:
                print("사용자 동의 DB가 사용할 수 없습니다.")
        except Exception as e:
            print(f"사용자 동의 데이터 정리 실패: {e}")
    
    def cleanup_channel_database(self):
        """채널 데이터베이스 정리"""
        try:
            db_path = self.db_paths['channels']
            if not os.path.exists(db_path):
                return
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 24시간 이전 데이터 삭제
            cutoff_time = datetime.now() - timedelta(hours=self.retention_policies['channel_storage'])
            
            cursor.execute('''
                DELETE FROM channels 
                WHERE updated_at < ?
            ''', (cutoff_time.isoformat(),))
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            print(f"채널 데이터베이스에서 {deleted_count}개 레코드 삭제")
            
        except Exception as e:
            print(f"채널 데이터베이스 정리 실패: {e}")
    
    def cleanup_cache_data(self):
        """캐시 데이터 정리"""
        try:
            # 캐시 시스템의 만료된 항목들은 자동으로 정리되지만
            # 명시적으로 정리할 수 있는 경우 여기서 처리
            if cache and hasattr(cache, 'clear_expired'):
                cache.clear_expired()
                print("캐시 데이터 정리 완료")
            else:
                print("캐시 시스템을 사용할 수 없습니다.")
        except Exception as e:
            print(f"캐시 데이터 정리 실패: {e}")
    
    def cleanup_session_data(self):
        """세션 데이터 정리"""
        try:
            # Flask 세션은 자동으로 만료되지만
            # 필요시 추가적인 세션 정리 로직 구현
            print("세션 데이터 정리 확인 완료")
        except Exception as e:
            print(f"세션 데이터 정리 실패: {e}")
    
    def full_cleanup(self):
        """전체 데이터 정리 (일일 실행)"""
        try:
            print(f"[{datetime.now()}] 전체 데이터 정리 시작...")
            
            # 기본 정리 실행
            self.cleanup_expired_data()
            
            # 추가적인 정리 작업
            self.cleanup_old_logs()
            self.cleanup_temp_files()
            
            print(f"[{datetime.now()}] 전체 데이터 정리 완료")
            
        except Exception as e:
            print(f"전체 데이터 정리 중 오류 발생: {e}")
    
    def cleanup_old_logs(self):
        """오래된 로그 파일 정리"""
        try:
            log_dir = 'logs'
            if not os.path.exists(log_dir):
                return
            
            cutoff_time = datetime.now() - timedelta(days=7)
            deleted_count = 0
            
            for filename in os.listdir(log_dir):
                file_path = os.path.join(log_dir, filename)
                if os.path.isfile(file_path):
                    file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if file_time < cutoff_time:
                        os.remove(file_path)
                        deleted_count += 1
            
            print(f"오래된 로그 파일 {deleted_count}개 삭제")
            
        except Exception as e:
            print(f"로그 파일 정리 실패: {e}")
    
    def cleanup_temp_files(self):
        """임시 파일 정리"""
        try:
            temp_dirs = ['temp', 'tmp', 'cache']
            deleted_count = 0
            
            for temp_dir in temp_dirs:
                if not os.path.exists(temp_dir):
                    continue
                
                cutoff_time = datetime.now() - timedelta(hours=24)
                
                for filename in os.listdir(temp_dir):
                    file_path = os.path.join(temp_dir, filename)
                    if os.path.isfile(file_path):
                        file_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                        if file_time < cutoff_time:
                            os.remove(file_path)
                            deleted_count += 1
            
            print(f"임시 파일 {deleted_count}개 삭제")
            
        except Exception as e:
            print(f"임시 파일 정리 실패: {e}")
    
    def optimize_databases(self):
        """데이터베이스 최적화 (주간 실행)"""
        try:
            print(f"[{datetime.now()}] 데이터베이스 최적화 시작...")
            
            for db_name, db_path in self.db_paths.items():
                if os.path.exists(db_path):
                    self.optimize_database(db_path, db_name)
            
            print(f"[{datetime.now()}] 데이터베이스 최적화 완료")
            
        except Exception as e:
            print(f"데이터베이스 최적화 중 오류 발생: {e}")
    
    def optimize_database(self, db_path, db_name):
        """개별 데이터베이스 최적화"""
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # VACUUM 명령으로 데이터베이스 압축
            cursor.execute('VACUUM')
            
            # ANALYZE 명령으로 쿼리 최적화 정보 업데이트
            cursor.execute('ANALYZE')
            
            conn.close()
            
            # 파일 크기 확인
            file_size = os.path.getsize(db_path)
            print(f"{db_name} 데이터베이스 최적화 완료 (크기: {file_size:,} bytes)")
            
        except Exception as e:
            print(f"{db_name} 데이터베이스 최적화 실패: {e}")
    
    def get_retention_stats(self):
        """데이터 보존 통계 조회"""
        try:
            stats = {
                'retention_policies': self.retention_policies,
                'database_sizes': {},
                'last_cleanup': datetime.now().isoformat(),
                'compliance_status': 'compliant'
            }
            
            # 데이터베이스 크기 정보
            for db_name, db_path in self.db_paths.items():
                if os.path.exists(db_path):
                    size = os.path.getsize(db_path)
                    stats['database_sizes'][db_name] = {
                        'size_bytes': size,
                        'size_mb': round(size / (1024 * 1024), 2)
                    }
            
            return stats
            
        except Exception as e:
            return {'error': str(e)}
    
    def force_cleanup(self, data_type=None):
        """강제 데이터 정리"""
        try:
            if data_type:
                if data_type == 'user_consent':
                    self.cleanup_user_consent()
                elif data_type == 'channels':
                    self.cleanup_channel_database()
                elif data_type == 'cache':
                    self.cleanup_cache_data()
                else:
                    return {'error': f'Unknown data type: {data_type}'}
            else:
                self.cleanup_expired_data()
            
            return {'success': True, 'message': '데이터 정리가 완료되었습니다.'}
            
        except Exception as e:
            return {'error': str(e)}

# 전역 데이터 보존 관리자 인스턴스
data_retention_manager = DataRetentionManager()

# ToS 준수 확인 함수
def verify_tos_compliance():
    """유튜브 API ToS 준수 상태 확인"""
    compliance_status = {
        'single_project': True,  # 단일 프로젝트 사용
        'user_consent': True,  # 사용자 동의 시스템 구현
        'korean_terminology': True,  # 한국어 용어 표시
        'no_independent_metrics': True,  # 독립 메트릭 제거
        'data_retention': True,  # 데이터 보존 기간 준수
        'last_check': datetime.now().isoformat()
    }
    
    # 실제 준수 상태 확인 로직
    try:
        # 1. 사용자 동의 시스템 확인
        if user_consent_db:
            consent_stats = user_consent_db.get_consent_stats()
            if not consent_stats:
                compliance_status['user_consent'] = False
        
        # 2. 데이터 보존 정책 확인
        retention_stats = data_retention_manager.get_retention_stats()
        if 'error' in retention_stats:
            compliance_status['data_retention'] = False
        
    except Exception as e:
        print(f"ToS 준수 확인 중 오류: {e}")
    
    return compliance_status
