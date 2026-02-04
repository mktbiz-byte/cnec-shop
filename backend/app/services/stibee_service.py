"""
스티비(Stibee) API 서비스
- 주소록 관리 (구독자 추가/삭제/조회)
- 이메일 발송 (자동 이메일 트리거)
"""
import httpx
from typing import Optional
from app.core.config import settings


class StibeeService:
    """스티비 API v2 클라이언트"""

    def __init__(self):
        self.base_url = settings.STIBEE_API_BASE_URL
        self.api_key = settings.STIBEE_API_KEY
        self.headers = {
            "Content-Type": "application/json",
            "AccessToken": self.api_key or "",
        }

    def _check_api_key(self):
        if not self.api_key or self.api_key == "your-stibee-api-key-here":
            raise ValueError("STIBEE_API_KEY가 설정되지 않았습니다. .env 파일에 API 키를 입력하세요.")

    # ============================================================
    # 주소록(Address Book) 관리
    # ============================================================

    async def get_address_books(self):
        """주소록 목록 조회"""
        self._check_api_key()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/lists",
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_address_book(self, list_id: int):
        """특정 주소록 조회"""
        self._check_api_key()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/lists/{list_id}",
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json()

    # ============================================================
    # 구독자(Subscriber) 관리
    # ============================================================

    async def add_subscribers(
        self,
        list_id: int,
        subscribers: list[dict],
        event_occurred_by: str = "MANUAL",
    ):
        """
        주소록에 구독자 일괄 추가

        Args:
            list_id: 스티비 주소록 ID
            subscribers: 구독자 목록 [{"email": "...", "name": "...", ...}]
            event_occurred_by: "MANUAL" (관리자 추가) 또는 "SUBSCRIBER" (본인 구독)
        """
        self._check_api_key()
        payload = {
            "eventOccuredBy": event_occurred_by,
            "confirmEmailYN": "N",
            "subscribers": subscribers,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.base_url}/lists/{list_id}/subscribers",
                headers=self.headers,
                json=payload,
                timeout=60,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_subscriber(self, list_id: int, email: str):
        """특정 구독자 조회"""
        self._check_api_key()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/lists/{list_id}/subscribers/{email}",
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json()

    async def delete_subscribers(self, list_id: int, emails: list[str]):
        """구독자 삭제"""
        self._check_api_key()
        async with httpx.AsyncClient() as client:
            resp = await client.delete(
                f"{self.base_url}/lists/{list_id}/subscribers",
                headers=self.headers,
                json=emails,
                timeout=60,
            )
            resp.raise_for_status()
            return resp.json()

    # ============================================================
    # 이메일 관리
    # ============================================================

    async def get_emails(self):
        """이메일 목록 조회"""
        self._check_api_key()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/emails",
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json()

    async def get_email(self, email_id: int):
        """특정 이메일 조회"""
        self._check_api_key()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/emails/{email_id}",
                headers=self.headers,
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json()

    async def create_email(self, list_id: int, subject: str, html_content: str):
        """이메일 생성"""
        self._check_api_key()
        payload = {
            "listId": list_id,
            "subject": subject,
        }
        async with httpx.AsyncClient() as client:
            # 1. 이메일 생성
            resp = await client.post(
                f"{self.base_url}/emails",
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            resp.raise_for_status()
            email_data = resp.json()
            email_id = email_data.get("data", {}).get("id") or email_data.get("id")

            # 2. 이메일 콘텐츠 설정
            if email_id and html_content:
                content_resp = await client.post(
                    f"{self.base_url}/emails/{email_id}/content",
                    headers=self.headers,
                    json={"html": html_content},
                    timeout=30,
                )
                content_resp.raise_for_status()

            return email_data

    # ============================================================
    # 자동 이메일 발송 (v1 API)
    # ============================================================

    async def send_auto_email(
        self,
        auto_email_url: str,
        subscriber_email: str,
        custom_fields: Optional[dict] = None,
    ):
        """
        자동 이메일 발송 (트리거 기반)

        Args:
            auto_email_url: 스티비 자동 이메일 트리거 URL
                예: https://stibee.com/api/v1.0/auto/{autoEmailId}
            subscriber_email: 수신자 이메일
            custom_fields: 커스텀 필드 (템플릿 치환용)
                예: {"name": "홍길동", "product": "립스틱"}
        """
        self._check_api_key()
        payload = {"subscriber": subscriber_email}
        if custom_fields:
            payload.update(custom_fields)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                auto_email_url,
                headers=self.headers,
                json=payload,
                timeout=30,
            )
            resp.raise_for_status()
            return {"success": True, "email": subscriber_email}


# 싱글톤 인스턴스
stibee_service = StibeeService()
