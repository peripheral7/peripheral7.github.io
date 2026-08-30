import pandas as pd

def detect_pullback_bounce(df):
    """20일선 / 50일선 눌림목 반등 (Pullback Bounce) 탐지 알고리즘"""
    df['MA20'] = df['Close'].rolling(window=20).mean()
    df['MA50'] = df['Close'].rolling(window=50).mean()
    df['MA150'] = df['Close'].rolling(window=150).mean()
    df['MA200'] = df['Close'].rolling(window=200).mean()
    df['Vol_MA50'] = df['Volume'].rolling(window=50).mean()

    latest = df.iloc[-1]
    if pd.isna(latest['MA200']):
        return "NONE", "데이터 부족", None

    # 1. 뼈대가 되는 상승 추세 (Stage 2) 유지 여부
    is_uptrend = (latest['MA50'] > latest['MA150'] > latest['MA200']) and (latest['Close'] > latest['MA200'])
    if not is_uptrend:
        return "NONE", "상승 추세(Stage 2) 이탈", None

    # 2. 이평선 이격도 (현재가가 20일선 또는 50일선에 ±2.5% 이내로 근접했는지)
    dist_ma20 = abs(latest['Close'] - latest['MA20']) / latest['MA20'] * 100
    dist_ma50 = abs(latest['Close'] - latest['MA50']) / latest['MA50'] * 100

    is_near_ma20 = dist_ma20 <= 2.5
    is_near_ma50 = dist_ma50 <= 2.5

    if not (is_near_ma20 or is_near_ma50):
        return "NONE", f"이평선 괴리 (20일: {dist_ma20:.1f}%, 50일: {dist_ma50:.1f}%)", None

    # 3. 단기 거래량 고갈 (최근 3일 거래량 평균이 50일 평균 대비 말라있는가)
    recent_3d_vol = df['Volume'].tail(3).mean()
    current_vol_ma50 = latest['Vol_MA50']
    vol_ratio = (recent_3d_vol / current_vol_ma50) * 100

    target_ma = "20일선" if is_near_ma20 else "50일선"
    dist = dist_ma20 if is_near_ma20 else dist_ma50

    report = f"[눌림목] {target_ma} 이격 {dist:.1f}% | 거래량: {vol_ratio:.1f}%"
    
    # 돌파 추세선 대신, 지지선 역할을 하는 수평선(이평선 가격) 반환 설정 가능 (여기서는 깔끔하게 None 처리)
    report = f"[눌림목] {target_ma} 이격 {dist:.1f}% | 거래량: {vol_ratio:.1f}%"
    
    # 지지선(Trendline): 반등이 기대되는 해당 이평선의 가격을 수평선으로 길게 그려줌
    trendline = None
    if is_near_ma20 or is_near_ma50:
        ma_val = (latest['MA20'] if is_near_ma20 else latest['MA50']) / 1000.0
        
        # 차트 가독성을 위해 최근 20일 전부터 미래 15일까지 수평선 긋기
        recent_data = df.tail(20).reset_index(drop=True)
        if not recent_data.empty:
            x_start = pd.to_datetime(recent_data['Date'].iloc[0], format='%Y%m%d')
            x_end = pd.to_datetime(latest['Date'] if isinstance(latest['Date'], str) else str(int(latest['Date'])), format='%Y%m%d') + pd.Timedelta(days=15)
            trendline = {'x': [x_start, x_end], 'y': [ma_val, ma_val]}

    # 거래량이 극단적으로 줄어들었을 때만 매수 타점 부여
    if vol_ratio < 50.0:
        return "STRICT", report, trendline
    elif vol_ratio < 80.0:
        return "RELAXED", report, trendline
    else:
        return "NONE", f"거래량 미고갈 ({vol_ratio:.1f}%)", None