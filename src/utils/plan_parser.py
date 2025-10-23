"""
기획안 내용을 구조화된 데이터로 파싱하는 유틸리티
"""

import re
import json


def parse_plan_content(plan_content):
    """
    AI가 생성한 기획안 텍스트를 구조화된 데이터로 파싱
    
    Returns:
        dict: {
            'channel_analysis': str,
            'title_options': [str, str, str],
            'thumbnail_idea': str,
            'scenes': [
                {
                    'scene_number': int,
                    'time': str,
                    'scene_description': str,
                    'dialogue': str,
                    'sound_effects': str,
                    'editing_tips': str
                },
                ...
            ],
            'subtitle_style': str,
            'music_effects': str,
            'hashtags': str,
            'expected_results': str
        }
    """
    
    result = {
        'channel_analysis': '',
        'title_options': [],
        'thumbnail_idea': '',
        'scenes': [],
        'subtitle_style': '',
        'music_effects': '',
        'hashtags': '',
        'expected_results': ''
    }
    
    lines = plan_content.split('\n')
    current_section = None
    current_content = []
    
    for line in lines:
        line = line.strip()
        
        # 섹션 감지
        if '채널 분석' in line or '*채널 분석' in line:
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'channel_analysis'
            current_content = []
        elif '영상 제목' in line and '제안' in line:
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'title_options'
            current_content = []
        elif '썸네일' in line:
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'thumbnail_idea'
            current_content = []
        elif '초별 구성' in line or '씬 구성' in line:
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'scenes'
            current_content = []
        elif '자막 스타일' in line:
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'subtitle_style'
            current_content = []
        elif '음악' in line and ('효과음' in line or '배경음악' in line):
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'music_effects'
            current_content = []
        elif '해시태그' in line:
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'hashtags'
            current_content = []
        elif '예상' in line and ('성과' in line or '효과' in line):
            if current_section:
                _save_section(result, current_section, current_content)
            current_section = 'expected_results'
            current_content = []
        else:
            if current_section and line:
                current_content.append(line)
    
    # 마지막 섹션 저장
    if current_section:
        _save_section(result, current_section, current_content)
    
    return result


def _save_section(result, section, content):
    """섹션 내용 저장"""
    if section == 'channel_analysis':
        result['channel_analysis'] = '\n'.join(content)
    
    elif section == 'title_options':
        # 제목 3개 추출
        titles = []
        for line in content:
            if '제목' in line and ':' in line:
                title = line.split(':', 1)[1].strip()
                # 이모티콘 제거
                title = re.sub(r'[^\w\s가-힣!?.,]', '', title)
                titles.append(title)
        result['title_options'] = titles[:3]
    
    elif section == 'thumbnail_idea':
        result['thumbnail_idea'] = '\n'.join(content)
    
    elif section == 'scenes':
        # 테이블에서 씬 추출
        scenes = []
        for line in content:
            if line.startswith('|') and not line.startswith('|:'):
                parts = [p.strip() for p in line.split('|')[1:-1]]
                if len(parts) >= 5 and parts[0].isdigit():
                    scene = {
                        'scene_number': int(parts[0]),
                        'time': parts[1] if len(parts) > 1 else '',
                        'scene_description': _remove_emoji(parts[2]) if len(parts) > 2 else '',
                        'dialogue': _remove_emoji(parts[3]) if len(parts) > 3 else '',
                        'sound_effects': parts[4] if len(parts) > 4 else '',
                        'editing_tips': parts[5] if len(parts) > 5 else ''
                    }
                    scenes.append(scene)
        result['scenes'] = scenes
    
    elif section == 'subtitle_style':
        result['subtitle_style'] = '\n'.join(content)
    
    elif section == 'music_effects':
        result['music_effects'] = '\n'.join(content)
    
    elif section == 'hashtags':
        result['hashtags'] = '\n'.join(content)
    
    elif section == 'expected_results':
        result['expected_results'] = '\n'.join(content)


def _remove_emoji(text):
    """이모티콘 제거"""
    # 이모티콘 패턴 제거
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # 이모티콘
        u"\U0001F300-\U0001F5FF"  # 기호 & 픽토그램
        u"\U0001F680-\U0001F6FF"  # 교통 & 지도
        u"\U0001F1E0-\U0001F1FF"  # 국기
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub(r'', text).strip()

