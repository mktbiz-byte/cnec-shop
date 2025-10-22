#!/usr/bin/env python3
"""
YouTube API ToS 준수 검증 스크립트
배포 후 모든 수정사항이 올바르게 작동하는지 확인
"""

import requests
import json
import time
from datetime import datetime

class ComplianceVerifier:
    def __init__(self, base_url="https://cnecplus.onrender.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = []
    
    def log_result(self, test_name, status, message, details=None):
        """테스트 결과 로깅"""
        result = {
            'test': test_name,
            'status': status,  # 'PASS', 'FAIL', 'WARNING'
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_icon} {test_name}: {message}")
        
        if details:
            print(f"   세부사항: {details}")
    
    def test_consent_system(self):
        """사용자 동의 시스템 테스트"""
        print("\n🔒 사용자 동의 시스템 테스트...")
        
        try:
            # 1. 동의 없이 API 호출 (403 에러 예상)
            response = self.session.get(f"{self.base_url}/api/youtube/channel/UCxxxxxx")
            
            if response.status_code == 403:
                data = response.json()
                if data.get('consent_required'):
                    self.log_result(
                        "동의 시스템 - 접근 제어", 
                        "PASS", 
                        "동의 없는 API 호출이 올바르게 차단됨"
                    )
                else:
                    self.log_result(
                        "동의 시스템 - 접근 제어", 
                        "FAIL", 
                        "403 응답이지만 consent_required 플래그가 없음"
                    )
            else:
                self.log_result(
                    "동의 시스템 - 접근 제어", 
                    "FAIL", 
                    f"동의 없는 API 호출이 차단되지 않음 (상태코드: {response.status_code})"
                )
            
            # 2. 동의 정보 조회
            response = self.session.get(f"{self.base_url}/api/youtube/consent/info")
            
            if response.status_code == 200:
                data = response.json()
                if 'consent_types' in data and 'korean_terms' in data['consent_types']['youtube_data']:
                    korean_terms = data['consent_types']['youtube_data']['korean_terms']
                    expected_terms = {'views': '조회수', 'subscribers': '구독자', 'videos': '동영상'}
                    
                    if all(korean_terms.get(k) == v for k, v in expected_terms.items()):
                        self.log_result(
                            "동의 시스템 - 한국어 용어", 
                            "PASS", 
                            "한국어 용어가 올바르게 설정됨"
                        )
                    else:
                        self.log_result(
                            "동의 시스템 - 한국어 용어", 
                            "FAIL", 
                            "한국어 용어가 올바르지 않음",
                            korean_terms
                        )
                else:
                    self.log_result(
                        "동의 시스템 - 한국어 용어", 
                        "FAIL", 
                        "동의 정보에 한국어 용어가 없음"
                    )
            else:
                self.log_result(
                    "동의 시스템 - 정보 조회", 
                    "FAIL", 
                    f"동의 정보 조회 실패 (상태코드: {response.status_code})"
                )
            
            # 3. 동의 부여 테스트
            consent_data = {
                'consent_types': ['youtube_data', 'channel_storage'],
                'duration_hours': 1
            }
            
            response = self.session.post(
                f"{self.base_url}/api/youtube/consent",
                json=consent_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_result(
                        "동의 시스템 - 동의 부여", 
                        "PASS", 
                        "동의 부여가 성공적으로 처리됨"
                    )
                    
                    # 동의 후 API 호출 테스트
                    time.sleep(1)  # 세션 동기화 대기
                    
                    response = self.session.get(f"{self.base_url}/api/youtube/channel/UCxxxxxx")
                    if response.status_code != 403:
                        self.log_result(
                            "동의 시스템 - 동의 후 접근", 
                            "PASS", 
                            "동의 후 API 접근이 허용됨"
                        )
                    else:
                        self.log_result(
                            "동의 시스템 - 동의 후 접근", 
                            "WARNING", 
                            "동의 후에도 API 접근이 차단됨 (세션 문제 가능성)"
                        )
                else:
                    self.log_result(
                        "동의 시스템 - 동의 부여", 
                        "FAIL", 
                        "동의 부여 응답에 success=false"
                    )
            else:
                self.log_result(
                    "동의 시스템 - 동의 부여", 
                    "FAIL", 
                    f"동의 부여 실패 (상태코드: {response.status_code})"
                )
                
        except Exception as e:
            self.log_result(
                "동의 시스템 - 전체", 
                "FAIL", 
                f"테스트 중 예외 발생: {str(e)}"
            )
    
    def test_compliance_status(self):
        """준수 상태 확인 테스트"""
        print("\n📊 준수 상태 확인 테스트...")
        
        try:
            response = self.session.get(f"{self.base_url}/api/data/compliance/status")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    compliance = data.get('compliance', {})
                    overall_compliant = data.get('overall_compliant', False)
                    
                    if overall_compliant:
                        self.log_result(
                            "준수 상태 - 전체", 
                            "PASS", 
                            "전체 준수 상태가 양호함"
                        )
                    else:
                        failed_items = [k for k, v in compliance.items() if not v and k != 'last_check']
                        self.log_result(
                            "준수 상태 - 전체", 
                            "FAIL", 
                            "일부 준수 항목이 실패함",
                            failed_items
                        )
                    
                    # 개별 준수 항목 확인
                    required_items = ['single_project', 'user_consent', 'korean_terminology', 'no_independent_metrics']
                    for item in required_items:
                        if compliance.get(item):
                            self.log_result(
                                f"준수 상태 - {item}", 
                                "PASS", 
                                f"{item} 준수 확인"
                            )
                        else:
                            self.log_result(
                                f"준수 상태 - {item}", 
                                "FAIL", 
                                f"{item} 준수 실패"
                            )
                else:
                    self.log_result(
                        "준수 상태 - 응답", 
                        "FAIL", 
                        "준수 상태 응답에 success=false"
                    )
            else:
                self.log_result(
                    "준수 상태 - 접근", 
                    "FAIL", 
                    f"준수 상태 API 접근 실패 (상태코드: {response.status_code})"
                )
                
        except Exception as e:
            self.log_result(
                "준수 상태 - 전체", 
                "FAIL", 
                f"테스트 중 예외 발생: {str(e)}"
            )
    
    def test_korean_terminology(self):
        """한국어 용어 표시 테스트"""
        print("\n🇰🇷 한국어 용어 표시 테스트...")
        
        # 실제 채널 ID로 테스트 (동의가 있다고 가정)
        test_channels = [
            "UCxxxxxx",  # 테스트용 더미 ID
        ]
        
        for channel_id in test_channels:
            try:
                response = self.session.get(f"{self.base_url}/api/youtube/channel/{channel_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # 한국어 라벨 확인
                    if 'korean_labels' in data:
                        korean_labels = data['korean_labels']
                        expected_labels = {
                            'subscribers': '구독자',
                            'views': '조회수',
                            'videos': '동영상'
                        }
                        
                        if all(korean_labels.get(k) == v for k, v in expected_labels.items()):
                            self.log_result(
                                "한국어 용어 - 라벨", 
                                "PASS", 
                                "한국어 라벨이 올바르게 설정됨"
                            )
                        else:
                            self.log_result(
                                "한국어 용어 - 라벨", 
                                "FAIL", 
                                "한국어 라벨이 올바르지 않음",
                                korean_labels
                            )
                    
                    # 통계 데이터의 한국어 필드 확인
                    if 'stats' in data:
                        stats = data['stats']
                        korean_fields = ['subscribersKorean', 'viewsKorean', 'videosKorean']
                        
                        missing_fields = [field for field in korean_fields if field not in stats]
                        
                        if not missing_fields:
                            self.log_result(
                                "한국어 용어 - 통계", 
                                "PASS", 
                                "통계 데이터에 한국어 필드가 모두 포함됨"
                            )
                        else:
                            self.log_result(
                                "한국어 용어 - 통계", 
                                "FAIL", 
                                "통계 데이터에 한국어 필드가 누락됨",
                                missing_fields
                            )
                
                elif response.status_code == 403:
                    self.log_result(
                        "한국어 용어 - 테스트", 
                        "WARNING", 
                        "동의 부족으로 한국어 용어 테스트 불가"
                    )
                    break
                    
            except Exception as e:
                self.log_result(
                    "한국어 용어 - 테스트", 
                    "FAIL", 
                    f"테스트 중 예외 발생: {str(e)}"
                )
    
    def test_data_retention(self):
        """데이터 보존 정책 테스트"""
        print("\n🗂️ 데이터 보존 정책 테스트...")
        
        try:
            # 인증 헤더 (실제 환경에서는 적절한 토큰 사용)
            headers = {'Authorization': 'Bearer admin_stats_token'}
            
            response = self.session.get(
                f"{self.base_url}/api/data/retention/stats",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    retention_stats = data.get('retention_stats', {})
                    retention_policies = retention_stats.get('retention_policies', {})
                    
                    # 보존 정책 확인
                    expected_policies = {
                        'youtube_data': 24,
                        'channel_storage': 24,
                        'analytics': 168
                    }
                    
                    policy_correct = all(
                        retention_policies.get(k) == v 
                        for k, v in expected_policies.items()
                    )
                    
                    if policy_correct:
                        self.log_result(
                            "데이터 보존 - 정책", 
                            "PASS", 
                            "데이터 보존 정책이 올바르게 설정됨"
                        )
                    else:
                        self.log_result(
                            "데이터 보존 - 정책", 
                            "FAIL", 
                            "데이터 보존 정책이 올바르지 않음",
                            retention_policies
                        )
                else:
                    self.log_result(
                        "데이터 보존 - 응답", 
                        "FAIL", 
                        "데이터 보존 통계 응답에 success=false"
                    )
            elif response.status_code == 401:
                self.log_result(
                    "데이터 보존 - 접근", 
                    "PASS", 
                    "데이터 보존 API가 올바르게 인증을 요구함"
                )
            else:
                self.log_result(
                    "데이터 보존 - 접근", 
                    "FAIL", 
                    f"데이터 보존 API 접근 실패 (상태코드: {response.status_code})"
                )
                
        except Exception as e:
            self.log_result(
                "데이터 보존 - 전체", 
                "FAIL", 
                f"테스트 중 예외 발생: {str(e)}"
            )
    
    def generate_report(self):
        """검증 보고서 생성"""
        print("\n" + "="*50)
        print("📋 YouTube API ToS 준수 검증 보고서")
        print("="*50)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.results if r['status'] == 'FAIL'])
        warning_tests = len([r for r in self.results if r['status'] == 'WARNING'])
        
        print(f"총 테스트: {total_tests}")
        print(f"✅ 통과: {passed_tests}")
        print(f"❌ 실패: {failed_tests}")
        print(f"⚠️ 경고: {warning_tests}")
        print(f"성공률: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests == 0:
            print("\n🎉 모든 핵심 테스트가 통과했습니다!")
            print("YouTube API ToS 준수가 성공적으로 구현되었습니다.")
        else:
            print("\n⚠️ 일부 테스트가 실패했습니다.")
            print("실패한 테스트들을 검토하고 수정이 필요합니다.")
        
        # 상세 결과 저장
        report_data = {
            'verification_time': datetime.now().isoformat(),
            'base_url': self.base_url,
            'summary': {
                'total_tests': total_tests,
                'passed': passed_tests,
                'failed': failed_tests,
                'warnings': warning_tests,
                'success_rate': (passed_tests/total_tests)*100
            },
            'results': self.results
        }
        
        with open('compliance_verification_report.json', 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 상세 보고서가 'compliance_verification_report.json'에 저장되었습니다.")
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("🚀 YouTube API ToS 준수 검증 시작...")
        print(f"대상 URL: {self.base_url}")
        print(f"검증 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 각 테스트 실행
        self.test_consent_system()
        self.test_compliance_status()
        self.test_korean_terminology()
        self.test_data_retention()
        
        # 보고서 생성
        self.generate_report()

if __name__ == "__main__":
    import sys
    
    # 커맨드라인 인자로 URL 지정 가능
    base_url = sys.argv[1] if len(sys.argv) > 1 else "https://cnecplus.onrender.com"
    
    verifier = ComplianceVerifier(base_url)
    verifier.run_all_tests()
