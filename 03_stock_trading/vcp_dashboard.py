import os
import requests
import json
import pandas as pd
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from scipy.signal import find_peaks
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots
import shutil


# 1. 환경 변수 로드
load_dotenv()
APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")
URL_BASE = os.getenv("URL_BASE")

# 출력 경로 설정 — 스크립트 파일 위치 기준 상대경로 (03_stock_trading 폴더 이동에도 안전)
# (참고: 이 파일은 main.py로 대체된 구버전으로 보이며 자동화 대상은 아님)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLOG_ROOT = os.path.dirname(SCRIPT_DIR)
HTML_OUTPUT_PATH = os.path.join(SCRIPT_DIR, "vcp_dashboard.html")
BLOG_HTML_PATH = os.path.join(BLOG_ROOT, "public", "reports", "vcp_dashboard.html")
JSON_OUTPUT_PATH = os.path.join(BLOG_ROOT, "public", "reports", "data.json")

def get_access_token():
    url = f"{URL_BASE}/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    body = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }
    response = requests.post(url, headers=headers, data=json.dumps(body))
    response.raise_for_status()
    return response.json().get("access_token")


def get_historical_prices(token, stock_code, start_date, end_date):
    url = f"{URL_BASE}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
    headers = {
        "content-type": "application/json; charset=utf-8",
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST03010100",
        "custtype": "P"
    }

    all_data = []
    current_end_date = end_date

    while len(all_data) < 300:
        time.sleep(0.5)

        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": stock_code,
            "FID_INPUT_DATE_1": start_date,
            "FID_INPUT_DATE_2": current_end_date,
            "FID_PERIOD_DIV_CODE": "D",
            "FID_ORG_ADJ_PRC": "1"
        }

        max_retries = 3
        success = False

        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=headers, params=params)
                response.raise_for_status()
                success = True
                break

            except requests.exceptions.HTTPError:
                print(f"    [서버 지연] (시도 {attempt+1}/{max_retries}). 3초 대기 후 재요청합니다...")
                time.sleep(3)

        if not success:
            print(f"    [재시도 실패] 해당 구간 데이터를 건너뜁니다.")
            break

        result = response.json()

        if result.get("rt_cd") != "0":
            break

        daily_data = result.get("output2", [])
        valid_data = [item for item in daily_data if item and item.get("stck_bsop_date")]

        if not valid_data:
            break

        all_data.extend(valid_data)

        oldest_date_str = valid_data[-1].get("stck_bsop_date")
        oldest_date = datetime.strptime(oldest_date_str, "%Y%m%d")
        new_end_date = (oldest_date - timedelta(days=1)).strftime("%Y%m%d")

        if new_end_date < start_date:
            break

        current_end_date = new_end_date

    return all_data


def detect_minervini_vcp(df):
    df['MA50'] = df['Close'].rolling(window=50).mean()
    df['MA150'] = df['Close'].rolling(window=150).mean()
    df['MA200'] = df['Close'].rolling(window=200).mean()
    df['Vol_MA50'] = df['Volume'].rolling(window=50).mean()

    df['52W_High'] = df['High'].rolling(window=250).max()
    df['52W_Low'] = df['Low'].rolling(window=250).min()
    df['MA200_20d_ago'] = df['MA200'].shift(20)

    latest = df.iloc[-1]
    if pd.isna(latest['MA200']) or pd.isna(latest['52W_High']):
        return "NONE", "데이터 부족 (250일 이상 필요)", None

    cond_ma = (latest['Close'] > latest['MA50'] > latest['MA150'] > latest['MA200'])
    cond_ma_trend = (latest['MA150'] > latest['MA200']) and (latest['MA200'] > latest['MA200_20d_ago'])
    cond_low = (latest['Close'] >= latest['52W_Low'] * 1.30)
    cond_high = (latest['Close'] >= latest['52W_High'] * 0.75)

    if not (cond_ma and cond_ma_trend and cond_low and cond_high):
        return "NONE", "Stage 2 추세 조건 미달", None

    recent_data = df.tail(60).reset_index(drop=True)
    peaks, _ = find_peaks(recent_data['High'], distance=5)
    troughs, _ = find_peaks(-recent_data['Low'], distance=5)

    if len(peaks) < 2 or len(troughs) < 2:
        return "NONE", "파동(수축) 횟수 부족", None

    drawdowns = []
    for peak in peaks:
        subsequent_troughs = troughs[troughs > peak]
        if len(subsequent_troughs) > 0:
            next_trough = subsequent_troughs[0]
            peak_price = recent_data['High'].iloc[peak]
            trough_price = recent_data['Low'].iloc[next_trough]
            drop_percent = ((peak_price - trough_price) / peak_price) * 100
            drawdowns.append(round(drop_percent, 2))

    if len(drawdowns) < 2:
        return "NONE", "비교 가능한 수축 데이터 부족", None

    d1 = drawdowns[-2]
    d2 = drawdowns[-1]
    recent_5d_vol = recent_data['Volume'].tail(5).mean()
    current_vol_ma50 = latest['Vol_MA50']
    vol_ratio = round((recent_5d_vol / current_vol_ma50) * 100, 1)

    trendline = None
    if len(peaks) >= 2:
        p1_idx = peaks[-2]
        p2_idx = peaks[-1]
        x1 = pd.to_datetime(recent_data['Date'].iloc[p1_idx], format='%Y%m%d')
        x2 = pd.to_datetime(recent_data['Date'].iloc[p2_idx], format='%Y%m%d')
        y1 = recent_data['High'].iloc[p1_idx] / 1000.0
        y2 = recent_data['High'].iloc[p2_idx] / 1000.0

        last_date = pd.to_datetime(recent_data['Date'].iloc[-1], format='%Y%m%d')
        dx = (x2 - x1).days
        if dx > 0:
            slope = (y2 - y1) / dx
            dx_last = (last_date - x2).days
            y_last = y2 + slope * dx_last
            trendline = {'x': [x1, x2, last_date], 'y': [y1, y2, y_last]}

    report = f"하락폭: {d1}% -> {d2}% | 거래량: 50일 평균의 {vol_ratio}%"

    is_strict_vol = (d1 > d2) and (d2 < 15)
    is_strict_volume = recent_5d_vol < (current_vol_ma50 * 0.6)
    is_relaxed_vol = (d1 > d2) and (d2 < 25)
    is_relaxed_volume = recent_5d_vol < (current_vol_ma50 * 0.8)

    if is_strict_vol and is_strict_volume:
        return "STRICT", report, trendline
    elif is_relaxed_vol and is_relaxed_volume:
        return "RELAXED", report, trendline
    else:
        return "NONE", report, None


def build_plotly_figure(plot_df, is_daily, trendline):
    """차트 계산 로직 (기존 build_plotly_html의 계산 부분과 100% 동일).
    HTML/JSON 두 형식 모두 이 함수가 만든 fig 하나를 재사용합니다."""
    x_dates = plot_df.index.tolist()
    open_p = plot_df['Open'].tolist()
    high_p = plot_df['High'].tolist()
    low_p = plot_df['Low'].tolist()
    close_p = plot_df['Close'].tolist()
    vol = plot_df['Volume'].tolist()
    ma5 = plot_df['MA5'].tolist()
    ma20 = plot_df['MA20'].tolist()
    ma60 = plot_df['MA60'].tolist()

    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.03, row_heights=[0.7, 0.3])
    deep_red, deep_blue = '#B71C1C', '#0D47A1'

    fig.add_trace(go.Candlestick(
        x=x_dates, open=open_p, high=high_p, low=low_p, close=close_p, name='가격',
        increasing_line_color=deep_red, increasing_fillcolor=deep_red,
        decreasing_line_color=deep_blue, decreasing_fillcolor=deep_blue, showlegend=False
    ), row=1, col=1)

    fig.add_trace(go.Scatter(x=x_dates, y=ma5, mode='lines', line=dict(color='blue', width=1), showlegend=False), row=1, col=1)
    fig.add_trace(go.Scatter(x=x_dates, y=ma20, mode='lines', line=dict(color='orange', width=2), showlegend=False), row=1, col=1)
    fig.add_trace(go.Scatter(x=x_dates, y=ma60, mode='lines', line=dict(color='black', width=1), showlegend=False), row=1, col=1)

    if trendline:
        fig.add_trace(go.Scatter(
            x=trendline['x'], y=trendline['y'], mode='lines',
            line=dict(color='purple', width=1, dash='dot'), showlegend=False
        ), row=1, col=1)

    colors = [deep_red if c >= o else deep_blue for c, o in zip(close_p, open_p)]
    fig.add_trace(go.Bar(
        x=x_dates, y=vol, marker_color=colors, orientation='v', showlegend=False
    ), row=2, col=1)

    fig.update_layout(
        title="",
        xaxis_rangeslider_visible=False, xaxis2_rangeslider_visible=False,
        yaxis_title="", yaxis2_title="",
        height=400,
        margin=dict(l=20, r=20, t=10, b=30),
        plot_bgcolor='#ffffff', paper_bgcolor='#ffffff',
        font=dict(family="Gothic A1, sans-serif")
    )

    fig.update_yaxes(showticklabels=False, exponentformat='none', gridcolor='#eeeeee', zerolinecolor='#eeeeee')

    if is_daily:
        breaks_list = []
        if len(x_dates) > 0:
            breaks_list.append(dict(bounds=["sat", "mon"]))

            all_weekdays = pd.date_range(start=x_dates[0], end=x_dates[-1], freq='B')
            missing_dates = all_weekdays.difference(plot_df.index)

            if not missing_dates.empty:
                holiday_str_list = missing_dates.strftime('%Y-%m-%d').tolist()
                breaks_list.append(dict(values=holiday_str_list))

            last_date = x_dates[-1]
            start_date = last_date - timedelta(days=90)

            fig.update_xaxes(
                range=[start_date, last_date],
                tickformat="%Y/%m",
                gridcolor='#eeeeee',
                zerolinecolor='#eeeeee',
                rangebreaks=breaks_list
            )
        else:
            fig.update_xaxes(tickformat="%Y/%m", gridcolor='#eeeeee', zerolinecolor='#eeeeee')
    else:
        fig.update_xaxes(
            tickformat="%Y/%m",
            gridcolor='#eeeeee',
            zerolinecolor='#eeeeee'
        )

    return fig


def prepare_chart_dataframes(df):
    """일봉/주봉 데이터프레임 준비 (HTML/JSON 공통 사용)."""
    df_chart = df.copy()
    for col in ['Open', 'High', 'Low', 'Close']:
        df_chart[col] = pd.to_numeric(df_chart[col], errors='coerce') / 1000.0
    df_chart['Volume'] = pd.to_numeric(df_chart['Volume'], errors='coerce')

    if not pd.api.types.is_datetime64_any_dtype(df_chart['Date']):
        df_chart['Date'] = pd.to_datetime(df_chart['Date'], format='%Y%m%d')

    df_chart.set_index('Date', inplace=True)

    daily_df = df_chart.copy()
    daily_df['MA5'] = daily_df['Close'].rolling(window=5).mean()
    daily_df['MA20'] = daily_df['Close'].rolling(window=20).mean()
    daily_df['MA60'] = daily_df['Close'].rolling(window=60).mean()

    weekly_df = df_chart.resample('W').agg({
        'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last', 'Volume': 'sum'
    }).dropna()
    weekly_df['MA5'] = weekly_df['Close'].rolling(window=5).mean()
    weekly_df['MA20'] = weekly_df['Close'].rolling(window=20).mean()
    weekly_df['MA60'] = weekly_df['Close'].rolling(window=60).mean()
    weekly_plot_df = weekly_df.tail(100)

    return daily_df, weekly_plot_df


def create_stock_package(df, stock_name, sector, status, message, trendline):
    """종목 하나당 fig 두 개(weekly, daily)를 만들고,
    HTML 조각과 JSON 데이터를 동시에 반환합니다."""
    daily_df, weekly_plot_df = prepare_chart_dataframes(df)

    weekly_fig = build_plotly_figure(weekly_plot_df, is_daily=False, trendline=trendline)
    daily_fig = build_plotly_figure(daily_df, is_daily=True, trendline=trendline)

    weekly_html = pio.to_html(weekly_fig, full_html=False, include_plotlyjs=False)
    daily_html = pio.to_html(daily_fig, full_html=False, include_plotlyjs=False)

    if status == "STRICT":
        bg_color = "#B71C1C"
    elif status == "RELAXED":
        bg_color = "#2E7D32"
    else:
        bg_color = "#777777"

    card_html = f"""
    <div class="grid-item">
        <div style="background-color: {bg_color}; color: white; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; font-weight: 700;">
            <span style="font-size: 16px;">{stock_name}</span>
            <span style="font-size: 12px; opacity: 0.9;">{sector}</span>
        </div>
        <div style="padding: 10px; font-size: 12px; color: #555; text-align: center; border-bottom: 1px solid #eee;">
            {message}
        </div>
        <div class="chart-view view-weekly" style="display: block;">
            {weekly_html}
        </div>
        <div class="chart-view view-daily" style="display: none;">
            {daily_html}
        </div>
    </div>
    """

    json_data = {
        "name": stock_name,
        "sector": sector,
        "status": status,
        "message": message,
        "weekly": json.loads(pio.to_json(weekly_fig)),
        "daily": json.loads(pio.to_json(daily_fig)),
    }

    return card_html, json_data


def generate_dashboard_html(div_list, strict_list, relaxed_list, filename=HTML_OUTPUT_PATH):
    str_strict = ", ".join(strict_list) if strict_list else "없음"
    str_relaxed = ", ".join(relaxed_list) if relaxed_list else "없음"

    html_template = f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mark Minervini VCP 분석 결과</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700&display=swap" rel="stylesheet">
        <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
        <style>
            body {{ font-family: "Gothic A1", sans-serif; background-color: #ffffff; color: #333333; padding: 20px; margin: 0; }}
            h1 {{ text-align: center; padding: 40px 0 10px 0; margin: 0; font-weight: 700; font-size: 38px; }}
            .header-info {{ text-align: center; font-size: 13px; color: #555555; margin-bottom: 20px; line-height: 1.8; }}
            .summary-box {{ max-width: 900px; margin: 0 auto 30px auto; padding: 25px; background-color: #fcfcfc; border: 1px solid #eaeaea; border-radius: 8px; font-size: 14px; line-height: 1.8; }}
            .vcp-desc {{ margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed #cccccc; }}
            .toggle-container {{ text-align: center; margin-bottom: 30px; }}
            .btn-tf {{ background-color: #ffffff; border: 1px solid #bbbbbb; color: #555555; padding: 8px 24px; cursor: pointer; font-family: 'Gothic A1'; font-weight: bold; font-size: 14px; border-radius: 20px; margin: 0 5px; transition: 0.2s; }}
            .btn-tf.active {{ background-color: #333333; color: #ffffff; border-color: #333333; }}
            .btn-tf:hover:not(.active) {{ background-color: #f0f0f0; }}
            .grid-container {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1800px; margin: 0 auto; }}
            .grid-item {{ background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }}
            @media (max-width: 1200px) {{ .grid-container {{ grid-template-columns: repeat(2, 1fr); }} }}
            @media (max-width: 768px) {{ .grid-container {{ grid-template-columns: 1fr; }} }}
        </style>
        <script>
            function setTimeframe(tf) {{
                document.querySelectorAll('.btn-tf').forEach(btn => btn.classList.remove('active'));
                document.getElementById('btn-' + tf).classList.add('active');
                document.querySelectorAll('.chart-view').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.view-' + tf).forEach(el => el.style.display = 'block');
                window.dispatchEvent(new Event('resize'));
            }}
        </script>
    </head>
    <body>
        <h1>Mark Minervini VCP 분석 결과</h1>
        <div class="header-info">
            {datetime.today().strftime("%Y년 %m월 %d일")} 기준<br>
            가격 : 천 원 | 추세선 범례: <span style="color:blue;">5일</span>/<span style="color:orange;">20일</span>/<span style="color:black;">60일</span>
        </div>
        <div class="summary-box">
            <div class="vcp-desc">
                <b>[Minervini VCP(변동성 축소 패턴)]</b><br>
                - VCP는 주가가 상승하기 직전, 시장 내 <b>공급(매도 물량)이 고갈되는 현상</b>을 포착하는 기술적 분석 기법입니다.<br>
                - 차트가 우측으로 진행될수록 <b>하락 파동의 깊이가 얕아지고(예: -25% &rarr; -12% &rarr; -4%) 거래량이 메마르는 것</b>이 특징입니다.
                - 이는 기관 세력이 매도를 멈추고 물량을 꽉 쥐고 있는 '매집' 상태를 의미합니다.
                - 응축된 에너지가 특정 저항선(보라색 점선)을 돌파할 때가 가장 폭발적이고 안전한 진입 시점이 됩니다.
            </div>
            <b><span style="color:#B71C1C;">매수 타점</span></b> : 변동성 15% 이내 축소 및 거래량 60% 이하 고갈<br>
            <b><span style="color:#2E7D32;">관심 주시</span></b> : 변동성 25% 이내 축소 및 거래량 80% 이하 고갈<br><br>
            <b>매수 종목:</b> <span style="color:#B71C1C; font-weight:bold;">{str_strict}</span><br>
            <b>관심 종목:</b> <span style="color:#2E7D32; font-weight:bold;">{str_relaxed}</span>
        </div>
        <div class="toggle-container">
            <button id="btn-weekly" class="btn-tf active" onclick="setTimeframe('weekly')">주간 차트</button>
            <button id="btn-daily" class="btn-tf" onclick="setTimeframe('daily')">일간 차트</button>
        </div>
        <div class="grid-container">
            {''.join(div_list)}
        </div>
    </body>
    </html>
    """
    dir_name = os.path.dirname(filename)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_template)
    print(f"[HTML] 생성 완료: {os.path.abspath(filename)}")

    os.makedirs(os.path.dirname(BLOG_HTML_PATH), exist_ok=True)
    shutil.copyfile(filename, BLOG_HTML_PATH)
    print(f"[HTML] 블로그용 복사 완료: {BLOG_HTML_PATH}")


def generate_dashboard_json(stock_data_list, strict_list, relaxed_list, filename=JSON_OUTPUT_PATH):
    output = {
        "date": datetime.today().strftime("%Y.%m.%d"),
        "strict": strict_list,
        "relaxed": relaxed_list,
        "stocks": stock_data_list,
    }
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False)
    print(f"[JSON] 생성 완료: {os.path.abspath(filename)}")


# ----------------- 실제 실행 블록 -----------------
if __name__ == "__main__":
    try:
        print("시스템 구동을 시작합니다...")
        access_token = get_access_token()

        target_stocks = {
            "001450": "현대해상",
            "005950": "이수화학",
            "161890": "한국콜마",
            "086790": "하나금융지주",
            "000810": "삼성화재",
            "026910": "광진실업"
        }

        sectors = {
            "001450": "금융/보험",
            "005950": "화학/소재",
            "161890": "뷰티/화장품",
            "086790": "금융/은행",
            "000810": "금융/보험",
            "026910": "철강/중소형"
        }

        end_date = datetime.today().strftime("%Y%m%d")
        start_date = (datetime.today() - timedelta(days=500)).strftime("%Y%m%d")

        chart_divs = []
        json_stock_list = []
        strict_list = []
        relaxed_list = []

        print(f"총 {len(target_stocks)}개 종목 분석 중...\n")

        for code, name in target_stocks.items():
            time.sleep(0.5)
            raw_data = get_historical_prices(access_token, code, start_date, end_date)

            if not raw_data:
                continue

            df = pd.DataFrame(raw_data)
            df = df.sort_values(by="stck_bsop_date").reset_index(drop=True)

            df = df[['stck_bsop_date', 'stck_oprc', 'stck_hgpr', 'stck_lwpr', 'stck_clpr', 'acml_vol']]
            df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']

            for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                df[col] = pd.to_numeric(df[col])

            status, message, trendline = detect_minervini_vcp(df)
            sector_name = sectors.get(code, "기타")

            if status == "STRICT":
                strict_list.append(name)
                print(f"[매수] {name}: {message}")
            elif status == "RELAXED":
                relaxed_list.append(name)
                print(f"[관심] {name}: {message}")
            else:
                print(f"[제외] {name}: {message}")

            card_html, json_data = create_stock_package(df, name, sector_name, status, message, trendline)
            chart_divs.append(card_html)
            json_stock_list.append(json_data)

        if chart_divs:
            generate_dashboard_html(chart_divs, strict_list, relaxed_list)
            generate_dashboard_json(json_stock_list, strict_list, relaxed_list)

    except Exception as e:
        print(f"실행 중 오류가 발생했습니다: {e}")