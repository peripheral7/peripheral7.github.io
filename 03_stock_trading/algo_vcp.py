import pandas as pd
from scipy.signal import find_peaks

def calculate_jdl_pivot(df, lookback=150, exclude_recent=20):
    """
    수평 저항선 도출 (양봉 종가 기준 및 음봉 완벽 배제)
    """
    jdl_data = df.tail(lookback).reset_index(drop=True)
    if len(jdl_data) <= exclude_recent:
        return None, None
        
    past_period = jdl_data.iloc[:-exclude_recent].copy()
    
    # 💡 [핵심] 시가보다 종가가 높거나 같은 '양봉' 캔들만 추출하여 음봉의 모든 요소를 배제합니다.
    yang_candles = past_period[past_period['Close'] >= past_period['Open']]
    
    if not yang_candles.empty:
        # 양봉들 중에서 '최고 종가'를 기록한 캔들의 인덱스와 날짜, 가격을 추출합니다.
        pivot_idx = yang_candles['Close'].idxmax()
        pivot_high = yang_candles.loc[pivot_idx, 'Close']
        pivot_date = yang_candles.loc[pivot_idx, 'Date']
    else:
        # 기간 내 양봉이 아예 없다면 저항선을 긋지 않습니다.
        return None, None
        
    first_date = pd.to_datetime(str(pivot_date), format='%Y%m%d')
    last_date = pd.to_datetime(str(df['Date'].iloc[-1]), format='%Y%m%d')
    
    horizontal_trendline = {'x': [first_date, last_date], 'y': [pivot_high, pivot_high]}
    
    return pivot_high, horizontal_trendline

def detect_minervini_vcp(df):
    """마크 미너비니 VCP 및 JDL(수평 선 긋기) 탐지 알고리즘"""
    df['MA50'] = df['Close'].rolling(window=50).mean()
    df['MA150'] = df['Close'].rolling(window=150).mean()
    df['MA200'] = df['Close'].rolling(window=200).mean()
    df['Vol_MA50'] = df['Volume'].rolling(window=50).mean()
    
    df['MA200_20d_ago'] = df['MA200'].shift(20)
    df['52W_High'] = df['High'].rolling(window=250).max()
    df['52W_Low'] = df['Low'].rolling(window=250).min()
    
    latest = df.iloc[-1]
    if pd.isna(latest['MA200']) or pd.isna(latest['52W_High']):
        return "NONE", "데이터 부족", None

    pivot_high, horizontal_trendline = calculate_jdl_pivot(df, lookback=150, exclude_recent=20)
    
    final_status = "NONE"
    messages = []
    
    if pivot_high:
        cond_jdl_price = (latest['Close'] > latest['MA50']) and (latest['Close'] > latest['MA200'])
        cond_jdl_low = (latest['Close'] >= latest['52W_Low'] * 1.10) 
        
        if cond_jdl_price and cond_jdl_low:
            recent_3d_high = df['High'].tail(3).max()
            recent_3d_vol = df['Volume'].tail(3).max()

            is_jdl_price = (latest['Close'] >= pivot_high * 0.90) and (latest['Close'] <= pivot_high * 1.15)
            is_jdl_touch = (recent_3d_high >= pivot_high * 0.95)
            is_jdl_vol = (recent_3d_vol >= latest['Vol_MA50'] * 1.2)
            
            if is_jdl_price and is_jdl_touch and is_jdl_vol:
                final_status = "STRICT"
                messages.append(f"[JDL 돌파] 과거 저항선({pivot_high:,.0f}원) 돌파 | 거래량: {round((recent_3d_vol/latest['Vol_MA50'])*100)}%")

    cond_vcp_ma = (latest['Close'] > latest['MA50'] > latest['MA150'] > latest['MA200'])
    cond_vcp_trend = (latest['MA150'] > latest['MA200']) and (latest['MA200'] > latest['MA200_20d_ago'])
    cond_vcp_low = (latest['Close'] >= latest['52W_Low'] * 1.25)
    cond_vcp_high = (latest['Close'] >= latest['52W_High'] * 0.75)

    if cond_vcp_ma and cond_vcp_trend and cond_vcp_low and cond_vcp_high:
        vcp_data = df.tail(90).reset_index(drop=True)
        peaks, _ = find_peaks(vcp_data['High'], distance=5)
        troughs, _ = find_peaks(-vcp_data['Low'], distance=5)

        drawdowns = []
        if len(peaks) >= 2 and len(troughs) >= 2:
            for peak in peaks:
                subsequent_troughs = troughs[troughs > peak]
                if len(subsequent_troughs) > 0:
                    next_trough = subsequent_troughs[0]
                    drop_percent = ((vcp_data['High'].iloc[peak] - vcp_data['Low'].iloc[next_trough]) / vcp_data['High'].iloc[peak]) * 100
                    drawdowns.append(round(drop_percent, 2))

        recent_5d_vol = vcp_data['Volume'].tail(5).mean()
        vol_ratio = round((recent_5d_vol / latest['Vol_MA50']) * 100, 1)

        if len(drawdowns) >= 2:
            d1, d2 = drawdowns[-2], drawdowns[-1]
            if (d1 > d2) and (d2 < 25) and (recent_5d_vol < latest['Vol_MA50'] * 0.8):
                if (d2 < 15) and (recent_5d_vol < latest['Vol_MA50'] * 0.6):
                    if final_status != "STRICT": final_status = "STRICT"
                else:
                    if final_status == "NONE": final_status = "RELAXED"
                messages.append(f"[VCP 축소] 하락폭: {d1}% -> {d2}% | 거래량: {vol_ratio}%")

    if messages:
        return final_status, "<br>".join(messages), horizontal_trendline
    return "NONE", "조건 미달 (돌파 또는 축소 미형성)", horizontal_trendline