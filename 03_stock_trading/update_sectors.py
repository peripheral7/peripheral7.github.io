import requests
import re
import json
import time

def update_sectors(filepath="sectors.json"):
    print("네이버 금융에서 정확한 [업종/섹터] 정보를 수집합니다. 잠시만 기다려주세요...\n")
    
    url = "https://finance.naver.com/sise/sise_group.naver?type=upjong"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    
    try:
        res = requests.get(url, headers=headers)
        res.encoding = 'euc-kr'
        
        # 네이버 금융 메인에서 79개 업종(섹터) 링크와 이름 추출
        sectors_list = re.findall(r'<a href="(/sise/sise_group_detail\.naver\?type=upjong&no=\d+)">(.*?)</a>', res.text)
        
        sectors_dict = {}
        total = len(sectors_list)
        
        for idx, (link, sector_name) in enumerate(sectors_list, 1):
            detail_url = "https://finance.naver.com" + link
            detail_res = requests.get(detail_url, headers=headers)
            detail_res.encoding = 'euc-kr'
            
            # 해당 업종에 속한 종목 코드 추출
            codes = re.findall(r'/item/main\.naver\?code=(\d{6})', detail_res.text)
            codes = list(set(codes)) # 중복 코드 제거
            
            for code in codes:
                sectors_dict[code] = sector_name.strip()
                
            print(f"[{idx:02d}/{total}] {sector_name} ({len(codes)}개 종목 매칭)")
            time.sleep(0.1) # 네이버 서버 차단 방지용 미세 대기
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(sectors_dict, f, ensure_ascii=False, indent=4)
            
        print(f"\n✅ 완료: 총 {len(sectors_dict)}개 종목의 네이버 실전 업종 정보가 '{filepath}'에 저장되었습니다.")
        
    except Exception as e:
        print(f"실패: 섹터 정보를 가져오지 못했습니다. 오류: {e}")

if __name__ == "__main__":
    update_sectors()