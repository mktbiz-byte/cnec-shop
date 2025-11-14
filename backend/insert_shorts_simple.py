#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/cnecplus/backend')

from app.db.supabase_client import supabase
import json

# 분석 결과 로드
with open('/tmp/10_beauty_shorts_analysis.json', 'r', encoding='utf-8') as f:
    shorts = json.load(f)

print("=" * 80)
print(f"기존 컬럼만 사용하여 {len(shorts)}개 숏폼 데이터 삽입")
print("=" * 80)
print()

for i, short in enumerate(shorts, 1):
    print(f"[{i}/{len(shorts)}] 삽입 중: {short['title'][:60]}...")
    
    video_id = short['video_url'].split('/')[-1]
    
    # 기존 컬럼만 사용
    data = {
        "video_id": video_id,
        "video_url": short['video_url'],
        "title": short['title'],
        "channel_name": short['channel_name'],
        "thumbnail_url": short['thumbnail_url'],
        "view_count": short['view_count'],
        "like_count": short['like_count'],
        "comment_count": short['comment_count'],
        "success_score": short['success_score'],
        "trending_keywords": short['trending_keywords'],
        "analysis_report": short['analysis_report'],
        "published_at": short['published_at']
    }
    
    try:
        result = supabase.table('video_reports').insert(data).execute()
        if result.data:
            print(f"   ✅ 삽입 완료")
        else:
            print(f"   ❌ 삽입 실패")
    except Exception as e:
        print(f"   ❌ 오류: {str(e)[:100]}")

print()
print("=" * 80)
print("✅ 완료!")
print("=" * 80)
