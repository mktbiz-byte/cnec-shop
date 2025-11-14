#!/usr/bin/env python3
"""
백엔드 Supabase 클라이언트를 사용하여 10개 숏폼 데이터 삽입
"""
import sys
import os
sys.path.insert(0, '/home/ubuntu/cnecplus/backend')

from app.db.supabase_client import supabase
import json

# 분석 결과 로드
with open('/tmp/10_beauty_shorts_analysis.json', 'r', encoding='utf-8') as f:
    shorts = json.load(f)

print("=" * 80)
print(f"백엔드 Supabase 클라이언트로 {len(shorts)}개 숏폼 데이터 삽입")
print("=" * 80)
print()

for i, short in enumerate(shorts, 1):
    print(f"[{i}/{len(shorts)}] 삽입 중: {short['title'][:60]}...")
    
    # video_id 추출
    video_id = short['video_url'].split('/')[-1]
    
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
        "published_at": short['published_at'],
        "transcript": short.get('transcript', ''),
        "transcript_analysis": short.get('transcript_analysis', ''),
        "shorts_features": short.get('shorts_features', ''),
        "creator_tips": short.get('creator_tips', [])
    }
    
    try:
        result = supabase.table('video_reports').insert(data).execute()
        if result.data:
            print(f"   ✅ 삽입 완료 (ID: {result.data[0].get('id', 'unknown')})")
        else:
            print(f"   ❌ 삽입 실패: 데이터 없음")
    except Exception as e:
        print(f"   ❌ 오류: {str(e)[:150]}")

print()
print("=" * 80)
print("✅ 완료!")
print("=" * 80)
