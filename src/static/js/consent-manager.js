/**
 * YouTube API ToS 준수를 위한 사용자 동의 관리 시스템
 */

class ConsentManager {
    constructor() {
        this.baseUrl = '/api/youtube';
        this.consentTypes = {
            'youtube_data': 'YouTube 데이터 조회',
            'channel_storage': '채널 정보 저장', 
            'analytics': '분석 및 통계'
        };
        this.init();
    }

    async init() {
        // 페이지 로드시 동의 상태 확인
        await this.checkConsentStatus();
        this.setupEventListeners();
        this.createConsentModal();
    }

    async checkConsentStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/consent/status`);
            const data = await response.json();
            
            this.currentConsents = data.consents || {};
            this.sessionExists = data.session_exists || false;
            
            return this.currentConsents;
        } catch (error) {
            console.error('동의 상태 확인 실패:', error);
            return {};
        }
    }

    async requestConsent(requiredTypes = ['youtube_data']) {
        const missingConsents = requiredTypes.filter(type => !this.currentConsents[type]);
        
        if (missingConsents.length === 0) {
            return true; // 이미 모든 동의가 있음
        }

        return new Promise((resolve) => {
            this.showConsentModal(missingConsents, resolve);
        });
    }

    async grantConsent(consentTypes, durationHours = 24) {
        try {
            const response = await fetch(`${this.baseUrl}/consent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    consent_types: consentTypes,
                    duration_hours: durationHours
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // 동의 상태 업데이트
                consentTypes.forEach(type => {
                    this.currentConsents[type] = true;
                });
                return true;
            } else {
                throw new Error(data.error || '동의 처리 실패');
            }
        } catch (error) {
            console.error('동의 부여 실패:', error);
            return false;
        }
    }

    async revokeConsent(consentType = null) {
        try {
            const response = await fetch(`${this.baseUrl}/consent/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    consent_type: consentType
                })
            });

            const data = await response.json();
            
            if (data.success) {
                if (consentType) {
                    this.currentConsents[consentType] = false;
                } else {
                    // 모든 동의 철회
                    Object.keys(this.currentConsents).forEach(type => {
                        this.currentConsents[type] = false;
                    });
                }
                return true;
            } else {
                throw new Error(data.error || '동의 철회 실패');
            }
        } catch (error) {
            console.error('동의 철회 실패:', error);
            return false;
        }
    }

    createConsentModal() {
        // 동의 모달 HTML 생성
        const modalHtml = `
            <div id="consent-modal" class="consent-modal" style="display: none;">
                <div class="consent-modal-content">
                    <div class="consent-header">
                        <h2>🔒 개인정보 보호 및 이용 동의</h2>
                        <p>YouTube API 서비스 약관 준수를 위해 사용자 동의가 필요합니다.</p>
                    </div>
                    
                    <div class="consent-body">
                        <div class="consent-info">
                            <h3>📋 수집하는 정보</h3>
                            <ul>
                                <li><strong>조회수</strong> - YouTube 동영상 및 채널의 조회수 정보</li>
                                <li><strong>구독자</strong> - YouTube 채널의 구독자 수 정보</li>
                                <li><strong>동영상</strong> - YouTube 채널의 동영상 목록 및 메타데이터</li>
                            </ul>
                        </div>

                        <div class="consent-purpose">
                            <h3>🎯 이용 목적</h3>
                            <ul>
                                <li>사용자 요청에 따른 YouTube 채널 정보 제공</li>
                                <li>동영상 통계 및 트렌드 분석 서비스</li>
                                <li>개인화된 추천 및 검색 기능</li>
                            </ul>
                        </div>

                        <div class="consent-retention">
                            <h3>⏰ 보관 기간</h3>
                            <p>수집된 데이터는 <strong>24시간 후 자동 삭제</strong>되며, 언제든지 동의를 철회할 수 있습니다.</p>
                        </div>

                        <div class="consent-compliance">
                            <h3>✅ YouTube API 정책 준수</h3>
                            <ul>
                                <li>단일 Google Cloud 프로젝트 사용</li>
                                <li>한국어 메트릭 용어 표시 ("조회수", "구독자", "동영상")</li>
                                <li>사용자 동의 없는 데이터 저장 금지</li>
                                <li>독립 메트릭 제공 금지</li>
                            </ul>
                        </div>

                        <div class="consent-options">
                            <div class="consent-checkboxes" id="consent-checkboxes">
                                <!-- 동적으로 생성됨 -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="consent-footer">
                        <button id="consent-accept" class="btn btn-primary">동의하고 계속</button>
                        <button id="consent-decline" class="btn btn-secondary">거부</button>
                        <button id="consent-info-btn" class="btn btn-info">자세히 보기</button>
                    </div>
                </div>
            </div>
        `;

        // 스타일 추가
        const styleHtml = `
            <style>
                .consent-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .consent-modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    padding: 24px;
                    margin: 20px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .consent-header h2 {
                    margin: 0 0 12px 0;
                    color: #333;
                    font-size: 24px;
                }
                
                .consent-header p {
                    margin: 0 0 20px 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .consent-body h3 {
                    margin: 20px 0 10px 0;
                    color: #444;
                    font-size: 16px;
                }
                
                .consent-body ul {
                    margin: 0 0 15px 0;
                    padding-left: 20px;
                }
                
                .consent-body li {
                    margin: 5px 0;
                    color: #555;
                    font-size: 14px;
                }
                
                .consent-checkboxes {
                    margin: 20px 0;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }
                
                .consent-checkbox {
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                }
                
                .consent-checkbox input {
                    margin-right: 10px;
                }
                
                .consent-footer {
                    margin-top: 24px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .btn-primary {
                    background: #007bff;
                    color: white;
                }
                
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-info {
                    background: #17a2b8;
                    color: white;
                }
                
                .btn:hover {
                    opacity: 0.9;
                }
            </style>
        `;

        // DOM에 추가
        document.head.insertAdjacentHTML('beforeend', styleHtml);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    showConsentModal(requiredTypes, callback) {
        const modal = document.getElementById('consent-modal');
        const checkboxContainer = document.getElementById('consent-checkboxes');
        
        // 체크박스 생성
        checkboxContainer.innerHTML = requiredTypes.map(type => `
            <div class="consent-checkbox">
                <input type="checkbox" id="consent-${type}" value="${type}" checked>
                <label for="consent-${type}">
                    <strong>${this.consentTypes[type]}</strong> 동의
                </label>
            </div>
        `).join('');

        // 이벤트 리스너 설정
        document.getElementById('consent-accept').onclick = async () => {
            const checkedTypes = requiredTypes.filter(type => 
                document.getElementById(`consent-${type}`).checked
            );
            
            if (checkedTypes.length === 0) {
                alert('최소 하나의 항목에 동의해야 서비스를 이용할 수 있습니다.');
                return;
            }

            const success = await this.grantConsent(checkedTypes);
            modal.style.display = 'none';
            callback(success);
        };

        document.getElementById('consent-decline').onclick = () => {
            modal.style.display = 'none';
            callback(false);
        };

        document.getElementById('consent-info-btn').onclick = async () => {
            try {
                const response = await fetch(`${this.baseUrl}/consent/info`);
                const info = await response.json();
                
                // 새 창에서 상세 정보 표시
                const infoWindow = window.open('', '_blank', 'width=800,height=600');
                infoWindow.document.write(`
                    <html>
                        <head><title>개인정보 처리방침</title></head>
                        <body style="font-family: Arial, sans-serif; padding: 20px;">
                            <h1>개인정보 처리방침</h1>
                            <pre>${JSON.stringify(info, null, 2)}</pre>
                        </body>
                    </html>
                `);
            } catch (error) {
                console.error('정보 로드 실패:', error);
            }
        };

        modal.style.display = 'flex';
    }

    setupEventListeners() {
        // YouTube API 호출 전에 동의 확인하는 래퍼 함수들
        this.wrapYouTubeApiCalls();
    }

    wrapYouTubeApiCalls() {
        // 기존 fetch를 래핑하여 YouTube API 호출시 자동으로 동의 확인
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options) => {
            // YouTube API 호출인지 확인
            if (typeof url === 'string' && url.includes('/api/youtube/channel')) {
                const hasConsent = await this.requestConsent(['youtube_data']);
                if (!hasConsent) {
                    throw new Error('사용자 동의가 필요합니다.');
                }
            }
            
            return originalFetch(url, options);
        };
    }

    // 동의 상태 표시 위젯 생성
    createConsentWidget() {
        const widgetHtml = `
            <div id="consent-widget" class="consent-widget">
                <div class="consent-widget-header">
                    <span>🔒 개인정보 설정</span>
                    <button id="consent-widget-toggle">⚙️</button>
                </div>
                <div id="consent-widget-body" class="consent-widget-body" style="display: none;">
                    <div class="consent-status">
                        <h4>현재 동의 상태</h4>
                        <div id="consent-status-list"></div>
                    </div>
                    <div class="consent-actions">
                        <button id="revoke-all-consent" class="btn btn-secondary btn-sm">
                            모든 동의 철회
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHtml);
        
        // 위젯 이벤트 리스너
        document.getElementById('consent-widget-toggle').onclick = () => {
            const body = document.getElementById('consent-widget-body');
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
            this.updateConsentStatus();
        };

        document.getElementById('revoke-all-consent').onclick = async () => {
            if (confirm('모든 동의를 철회하시겠습니까? 서비스 이용이 제한될 수 있습니다.')) {
                await this.revokeConsent();
                this.updateConsentStatus();
            }
        };
    }

    updateConsentStatus() {
        const statusList = document.getElementById('consent-status-list');
        if (!statusList) return;

        statusList.innerHTML = Object.entries(this.consentTypes).map(([type, name]) => `
            <div class="consent-status-item">
                <span class="consent-status-indicator ${this.currentConsents[type] ? 'active' : 'inactive'}">
                    ${this.currentConsents[type] ? '✅' : '❌'}
                </span>
                <span>${name}</span>
                ${this.currentConsents[type] ? 
                    `<button onclick="consentManager.revokeConsent('${type}')" class="btn-revoke">철회</button>` : 
                    ''
                }
            </div>
        `).join('');
    }
}

// 전역 인스턴스 생성
window.consentManager = new ConsentManager();

// DOM 로드 완료시 위젯 생성
document.addEventListener('DOMContentLoaded', () => {
    window.consentManager.createConsentWidget();
});
