import os
import requests
import json
import pandas as pd
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots
import shutil
import FinanceDataReader as fdr
from collections import Counter

from algo_vcp import detect_minervini_vcp
from algo_pullback import detect_pullback_bounce

load_dotenv()
APP_KEY = os.getenv("APP_KEY")
APP_SECRET = os.getenv("APP_SECRET")
URL_BASE = os.getenv("URL_BASE")
HTS_USER_ID = os.getenv("HTS_USER_ID")

# 03_stock_trading 폴더 자체가 블로그 리포 안으로 이동했으므로, 스크립트 파일 위치를 기준으로
# 모든 경로를 상대적으로 도출한다 (폴더가 다시 이동해도 깨지지 않도록).
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLOG_ROOT = os.path.dirname(SCRIPT_DIR)
HTML_OUTPUT_PATH = os.path.join(SCRIPT_DIR, "vcp_dashboard.html")
BLOG_HTML_PATH = os.path.join(BLOG_ROOT, "public", "reports", "vcp_dashboard.html")
JSON_OUTPUT_PATH = os.path.join(BLOG_ROOT, "public", "reports", "data.json")

def get_access_token():
    url = f"{URL_BASE}/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    body = {"grant_type": "client_credentials", "appkey": APP_KEY, "appsecret": APP_SECRET}
    response = requests.post(url, headers=headers, data=json.dumps(body))
    response.raise_for_status()
    return response.json().get("access_token")

def get_condition_seq(token, hts_id, target_group="trading", target_name="minervini"):
    url = f"{URL_BASE}/uapi/domestic-stock/v1/quotations/psearch-title?user_id={hts_id}"
    headers = {
        "content-type": "application/json; charset=utf-8", "authorization": f"Bearer {token}",
        "appkey": APP_KEY, "appsecret": APP_SECRET, "tr_id": "HHKST03900300", "custtype": "P"
    }
    for attempt in range(3):
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                result = response.json()
                if result.get("rt_cd") == "0":
                    for cond in result.get("output2", []):
                        if cond.get("grp_nm", "").strip().lower() == target_group.lower() and cond.get("condition_nm", "").strip().lower() == target_name.lower():
                            return cond.get("seq")
        except Exception:
            pass
        time.sleep(1)
    return None

def get_condition_search_list(token, hts_id, seq):
    url = f"{URL_BASE}/uapi/domestic-stock/v1/quotations/psearch-result"
    headers = {
        "content-type": "application/json; charset=utf-8", "authorization": f"Bearer {token}",
        "appkey": APP_KEY, "appsecret": APP_SECRET, "tr_id": "HHKST03900400", "custtype": "P"
    }
    params = {"user_id": hts_id, "seq": seq}
    
    for attempt in range(3):
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                result = response.json()
                if result.get("rt_cd") == "0":
                    extracted = {}
                    for stock in result.get("output2", []):
                        if stock.get("code") and stock.get("name"): 
                            extracted[str(stock.get("code")).zfill(6)] = stock.get("name")
                    return extracted
        except Exception:
            pass
        time.sleep(1)
    return {}

def check_stock_validity(token, stock_code):
    url = f"{URL_BASE}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "content-type": "application/json; charset=utf-8", "authorization": f"Bearer {token}",
        "appkey": APP_KEY, "appsecret": APP_SECRET, "tr_id": "FHKST01010100", "custtype": "P"
    }
    params = {"FID_COND_MRKT_DIV_CODE": "J", "FID_INPUT_ISCD": stock_code}
    
    for attempt in range(3):
        try:
            response = requests.get(url, headers=headers, params=params)
            if response.status_code == 200:
                result = response.json()
                if result.get("rt_cd") == "0":
                    output = result.get("output", {})
                    
                    status_code = output.get("iscd_stat_cls_code", "00")
                    bad_status = {
                        "51": "관리종목", "52": "투자주의", "53": "투자경고", 
                        "54": "투자위험", "57": "환기종목", "58": "단기과열"
                    }
                    if status_code in bad_status:
                        return False, bad_status[status_code]
                        
                    marg_rate = output.get("marg_rate", "0")
                    if marg_rate == "100.00":
                        return False, "증거금100%"
                        
                    return True, "정상"
        except Exception:
            pass
        time.sleep(0.3)
    return False, "상태조회실패"

def get_historical_prices(token, stock_code, start_date, end_date):
    url = f"{URL_BASE}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
    headers = {
        "content-type": "application/json; charset=utf-8", "authorization": f"Bearer {token}",
        "appkey": APP_KEY, "appsecret": APP_SECRET, "tr_id": "FHKST03010100", "custtype": "P"
    }
    all_data = []
    current_end_date = end_date
    
    while len(all_data) < 300:
        time.sleep(0.35) 
        params = {"FID_COND_MRKT_DIV_CODE": "J", "FID_INPUT_ISCD": stock_code, "FID_INPUT_DATE_1": start_date, "FID_INPUT_DATE_2": current_end_date, "FID_PERIOD_DIV_CODE": "D", "FID_ORG_ADJ_PRC": "1"}
        
        success = False
        got_data = False
        
        for attempt in range(3): 
            try:
                response = requests.get(url, headers=headers, params=params)
                if response.status_code == 200:
                    result = response.json()
                    if result.get("rt_cd") == "0":
                        valid_data = [item for item in result.get("output2", []) if item and item.get("stck_bsop_date")]
                        if valid_data:
                            all_data.extend(valid_data)
                            oldest_date = datetime.strptime(valid_data[-1].get("stck_bsop_date"), "%Y%m%d")
                            current_end_date = (oldest_date - timedelta(days=1)).strftime("%Y%m%d")
                            got_data = True
                        success = True
                        break 
            except Exception:
                pass
            
            time.sleep(1)
            
        if not success or not got_data or current_end_date < start_date:
            break
            
    return all_data

def build_plotly_figure(plot_df, is_daily, trendline, is_kospi=False):
    x_dates = plot_df.index.tolist()
    open_p, high_p = plot_df['Open'].tolist(), plot_df['High'].tolist()
    low_p, close_p = plot_df['Low'].tolist(), plot_df['Close'].tolist()
    vol = plot_df['Volume'].tolist()
    ma5, ma20, ma60 = plot_df['MA5'].tolist(), plot_df['MA20'].tolist(), plot_df['MA60'].tolist()

    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.03, row_heights=[0.75, 0.25])
    
    # 💡 [핵심] 차트 색상을 고급스럽고 채도 낮은 다크 스칼렛, 다크 블루로 변경
    deep_red, deep_blue = '#8B0000', '#003366'

    fig.add_trace(go.Candlestick(x=x_dates, open=open_p, high=high_p, low=low_p, close=close_p, increasing_line_color=deep_red, increasing_fillcolor=deep_red, decreasing_line_color=deep_blue, decreasing_fillcolor=deep_blue, showlegend=False, hoverinfo='x+y'), row=1, col=1)
    fig.add_trace(go.Scatter(x=x_dates, y=ma5, mode='lines', line=dict(color='blue', width=1), showlegend=False, hoverinfo='none'), row=1, col=1)
    fig.add_trace(go.Scatter(x=x_dates, y=ma20, mode='lines', line=dict(color='orange', width=2), showlegend=False, hoverinfo='none'), row=1, col=1)
    fig.add_trace(go.Scatter(x=x_dates, y=ma60, mode='lines', line=dict(color='black', width=1), showlegend=False, hoverinfo='none'), row=1, col=1)

    if trendline:
        fig.add_trace(go.Scatter(x=trendline['x'], y=trendline['y'], mode='lines', line=dict(color='purple', width=1.5, dash='dot'), showlegend=False, hoverinfo='none'), row=1, col=1)

    colors = [deep_red if c >= o else deep_blue for c, o in zip(close_p, open_p)]
    fig.add_trace(go.Bar(x=x_dates, y=vol, marker_color=colors, showlegend=False, hoverinfo='none'), row=2, col=1)

    layout_args = dict(
        margin=dict(l=20, r=20, t=10, b=30), 
        plot_bgcolor='#ffffff', paper_bgcolor='#ffffff', font=dict(family="Gothic A1, sans-serif"), 
        xaxis_rangeslider_visible=False,
        hovermode='x', 
        spikedistance=-1,
        autosize=True 
    )
    
    fig.update_layout(**layout_args)
    
    breaks_list = [dict(bounds=["sat", "mon"])]
    
    if is_daily and len(x_dates) > 0:
        missing_dates = pd.date_range(start=x_dates[0], end=x_dates[-1], freq='B').difference(plot_df.index)
        if not missing_dates.empty: breaks_list.append(dict(values=missing_dates.strftime('%Y-%m-%d').tolist()))
        
        last_date = x_dates[-1]
        default_start = last_date - timedelta(days=90)
        start_view = default_start
        
        if trendline and len(trendline['x']) > 0:
            pivot_date = pd.to_datetime(trendline['x'][0])
            if pivot_date < start_view:
                start_view = pivot_date - timedelta(days=10) 
                
        if start_view < x_dates[0]:
            start_view = x_dates[0]
            
        if is_kospi: start_view = x_dates[0]
        end_view = last_date + timedelta(days=5)
        
        fig.update_xaxes(
            range=[start_view, end_view], rangebreaks=breaks_list,
            showspikes=True, spikemode='across', spikesnap='cursor', showline=False, spikedash='solid', spikecolor='#bbbbbb', spikethickness=1, gridcolor='#eeeeee',
            hoverformat="%Y/%m/%d"
        )
    else:
        if len(x_dates) > 0:
            start_view, end_view = x_dates[0], x_dates[-1] + timedelta(days=7)
        else:
            start_view, end_view = None, None
            
        fig.update_xaxes(
            range=[start_view, end_view], rangebreaks=breaks_list,
            showspikes=True, spikemode='across', spikesnap='cursor', showline=False, spikedash='solid', spikecolor='#bbbbbb', spikethickness=1, gridcolor='#eeeeee',
            hoverformat="%Y/%m/%d"
        )

    if start_view and end_view and not plot_df.empty:
        visible_df = plot_df[(plot_df.index >= start_view) & (plot_df.index <= end_view)]
        if not visible_df.empty:
            min_y = visible_df['Low'].min()
            max_y = visible_df['High'].max()
            if trendline:
                max_y = max(max_y, max(trendline['y']))
                min_y = min(min_y, min(trendline['y']))
                
            y_margin = (max_y - min_y) * 0.15 
            fig.update_yaxes(range=[min_y - y_margin, max_y + y_margin], row=1, col=1)

    fig.update_yaxes(
        showticklabels=False, 
        showspikes=True, spikemode='across', spikesnap='cursor', showline=False, spikedash='solid', spikecolor='#bbbbbb', spikethickness=1, gridcolor='#eeeeee', zerolinecolor='#eeeeee'
    )
    fig.update_yaxes(tickformat=",.0f", hoverformat=",.0f", row=1, col=1) 
    fig.update_yaxes(tickformat=",.0f", hoverformat=",.0f", row=2, col=1) 
        
    return fig

def get_kospi_html(end_date):
    start_date = (datetime.strptime(end_date, "%Y%m%d") - timedelta(days=200)).strftime("%Y-%m-%d")
    
    try:
        df = fdr.DataReader('KS11', start_date, datetime.strptime(end_date, "%Y%m%d").strftime("%Y-%m-%d"))
        if df.empty:
            return "<div style='text-align:center; padding:50px;'>코스피 데이터가 없습니다.</div>"
            
        df['Date'] = df.index
        df.rename(columns={'Adj Close': 'Close'}, inplace=True, errors='ignore') 
        
        df['MA5'] = df['Close'].rolling(5).mean()
        df['MA20'] = df['Close'].rolling(20).mean()
        df['MA60'] = df['Close'].rolling(60).mean()
        
        df.dropna(subset=['MA60'], inplace=True)
        df_6m = df.tail(120)
        
        if df_6m.empty:
            return "<div style='text-align:center; padding:50px;'>코스피 차트 계산 오류 (데이터 부족)</div>"
            
        fig = build_plotly_figure(df_6m, is_daily=True, trendline=None, is_kospi=True)
        fig.update_layout(title=dict(text="<b>KOSPI 종합 일간차트 (최근 6개월)</b>", font=dict(size=14)), margin=dict(l=10, r=10, t=30, b=10))
        return pio.to_html(fig, full_html=False, include_plotlyjs=False, default_height="100%", default_width="100%")
        
    except Exception as e:
        return f"<div style='text-align:center; padding:50px;'>코스피 차트 렌더링 에러: {e}</div>"

def prepare_chart_dataframes(df):
    df_chart = df.copy()
    for col in ['Open', 'High', 'Low', 'Close']: df_chart[col] = pd.to_numeric(df_chart[col], errors='coerce')
    df_chart['Volume'] = pd.to_numeric(df_chart['Volume'], errors='coerce')
    if not pd.api.types.is_datetime64_any_dtype(df_chart['Date']): df_chart['Date'] = pd.to_datetime(df_chart['Date'], format='%Y%m%d')
    df_chart.set_index('Date', inplace=True)

    daily_df = df_chart.copy()
    daily_df['MA5'], daily_df['MA20'], daily_df['MA60'] = daily_df['Close'].rolling(5).mean(), daily_df['Close'].rolling(20).mean(), daily_df['Close'].rolling(60).mean()

    weekly_df = df_chart.resample('W-FRI').agg({'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last', 'Volume': 'sum'}).dropna()
    weekly_df['MA5'], weekly_df['MA20'], weekly_df['MA60'] = weekly_df['Close'].rolling(5).mean(), weekly_df['Close'].rolling(20).mean(), weekly_df['Close'].rolling(60).mean()
    
    return daily_df, weekly_df.tail(100)

def run_algorithms(df_slice):
    status_vcp, msg_vcp, trendline_vcp = detect_minervini_vcp(df_slice)
    status_pb, msg_pb, trendline_pb = detect_pullback_bounce(df_slice)

    matched = []
    messages = []
    trendline = trendline_vcp 

    if status_vcp == "STRICT":
        matched.append("VCP/JDL:매수")
        messages.append(msg_vcp)
    elif status_vcp == "RELAXED":
        matched.append("VCP:관심")
        messages.append(msg_vcp)

    if status_pb == "STRICT":
        matched.append("눌림목:매수")
        messages.append(msg_pb)
    elif status_pb == "RELAXED":
        matched.append("눌림목:관심")
        messages.append(msg_pb)

    if "STRICT" in [status_vcp, status_pb]: final_status = "STRICT"
    elif "RELAXED" in [status_vcp, status_pb]: final_status = "RELAXED"
    else: final_status = "NONE"

    final_msg = "<br>".join(messages) if messages else "알고리즘 조건 미달 (차트 참조)"
    return final_status, final_msg, trendline, ", ".join(matched)

def create_stock_package(df, code, stock_name, sector, status, message, trendline):
    if trendline and len(trendline.get('y', [])) > 0:
        if max(trendline['y']) < df['Close'].min() * 0.1:
            trendline['y'] = [y * 1000 for y in trendline['y']]

    daily_df, weekly_plot_df = prepare_chart_dataframes(df)
    weekly_fig = build_plotly_figure(weekly_plot_df, is_daily=False, trendline=trendline)
    daily_fig = build_plotly_figure(daily_df, is_daily=True, trendline=trendline)

    weekly_html = pio.to_html(weekly_fig, full_html=False, include_plotlyjs=False, default_height="100%", default_width="100%")
    daily_html = pio.to_html(daily_fig, full_html=False, include_plotlyjs=False, default_height="100%", default_width="100%")

    if status == "STRICT": bg_color = "#111111"
    elif status == "RELAXED": bg_color = "#555555"
    elif status.endswith("_PAST"): bg_color = "#4E342E" 
    else: bg_color = "#9e9e9e"

    current_price = df['Close'].iloc[-1]
    
    card_html = f"""
    <div class="grid-item">
        <div class="card-header" style="background-color: {bg_color}; color: white; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; border-bottom: 1px solid #d0d0d0;" onclick="openModal(this)">
            <div style="display: flex; align-items: center; overflow: hidden; white-space: nowrap;">
                <span style="font-size: 16px; margin-right: 8px;">{stock_name}</span>
                <span style="font-size: 13px; color: rgba(255,255,255,0.7); font-weight: 400; display: flex; align-items: center;">
                    [{code}] {current_price:,.0f}원 <span style="margin: 0 6px;">|</span> {sector}
                </span>
            </div>
            <div class="modal-close-btn" onclick="closeModal(event)">✕</div>
        </div>
        <div style="padding: 10px; font-size: 12px; color: #555; text-align: center; border-bottom: 1px solid #eee; min-height: 20px;">{message}</div>
        <div class="chart-wrapper">
            <div class="chart-view view-weekly" style="display: block;">{weekly_html}</div>
            <div class="chart-view view-daily" style="display: none;">{daily_html}</div>
        </div>
    </div>
    """
    json_data = {"name": stock_name, "sector": sector, "status": status, "message": message, "weekly": json.loads(pio.to_json(weekly_fig)), "daily": json.loads(pio.to_json(daily_fig))}
    return card_html, json_data

def generate_dashboard_html(div_list_current, div_list_past, div_list_none, strict_list, relaxed_list, valid_sectors, kospi_html, filename=HTML_OUTPUT_PATH):
    str_strict = ", ".join(strict_list) if strict_list else "없음(조건미달)"
    str_relaxed = ", ".join(relaxed_list) if relaxed_list else "없음(조건미달)"
    
    sector_str = "없음(조건미달)"
    if valid_sectors:
        total_valid = len(valid_sectors)
        counts = Counter(valid_sectors).most_common(3)
        
        # 💡 [개선] 비중이 30%를 초과(> 30)하는 섹터만 리스트에 담습니다.
        filtered_sectors = [
            f"{s} ({int(round(c/total_valid*100, 0))}%)" 
            for s, c in counts 
            if (c / total_valid * 100) > 30
        ]
        
        # 30% 넘는 섹터가 존재할 때만 문자열로 합치고, 없으면 기본값인 "없음" 유지
        if filtered_sectors:
            sector_str = ", ".join(filtered_sectors)
    
    past_section = f"""
    <div style="margin: 60px 0 30px 0; border-bottom: 1px dashed #555555;"></div>
    <h2 style="text-align: center; color: #aaaaaa; margin-bottom: 30px; font-size: 20px;">과거 10일 내 포착 (현재 기준 이탈)</h2>
    <div class="grid-container">
        {''.join(div_list_past)}
    </div>
    """ if div_list_past else ""
    
    none_section = f"""
    <div style="margin: 60px 0 30px 0; border-bottom: 1px dashed #555555;"></div>
    <h2 style="text-align: center; color: #aaaaaa; margin-bottom: 30px; font-size: 20px;">HTS 조건식 포착 (알고리즘 미달)</h2>
    <div class="grid-container">
        {''.join(div_list_none)}
    </div>
    """ if div_list_none else ""

    html_template = f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mark Minervini 트레이딩 분석</title>
        <link href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700&display=swap" rel="stylesheet">
        <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
        <style>
            body {{ font-family: "Gothic A1", sans-serif; background-color: #2a2a2a; color: #111111; padding: 0; margin: 0; }}
            .wrap-container {{ width: 100%; max-width: 100%; background-color: #ffffff; margin: 0 auto; padding: 40px 20px 80px 20px; box-sizing: border-box; }}
            @media (min-width: 1201px) {{ .wrap-container {{ width: 66.66%; padding: 40px 40px 100px 40px; }} }}
            
            .title-section {{ text-align: center; padding: 90px 0 150px 0; }}
            h1 {{ margin: 0 0 25px 0; font-weight: 700; font-size: 46px; letter-spacing: -1px; }}
            .header-info {{ font-size: 15px; color: #555555; margin: 0; }}
            
            .top-section {{ display: flex; gap: 30px; margin-bottom: 30px; align-items: stretch; }}
            .summary-box {{ flex: 2; background-color: #ffffff; border: 1px solid #d0d0d0; padding: 25px 30px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }}
            .kospi-box {{ flex: 1; background-color: #ffffff; border: 1px solid #d0d0d0; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; }}
            .kospi-box > div {{ flex: 1; width: 100%; min-height: 250px; }}
            
            .vcp-desc {{ margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; font-size: 14px; line-height: 1.8; }}
            .stock-lists {{ font-size: 15px; margin-bottom: 10px; line-height: 1.8; }}
            .footnotes {{ font-size: 12px; color: #777777; margin-top: 15px; line-height: 1.6; }}
            
            .toggle-bar {{ text-align: left; margin-bottom: 30px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }}
            .toggle-wrap {{ display: flex; align-items: center; }}
            .toggle-bar.fixed {{ 
                position: fixed; top: 0; left: 0; width: 100%; 
                background-color: rgba(255, 255, 255, 0.95); 
                backdrop-filter: blur(5px);
                border-bottom: 1px solid #d0d0d0; z-index: 1000; margin-bottom: 0; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            }}
            .toggle-bar.fixed .toggle-wrap {{ margin: 0 auto; box-sizing: border-box; padding: 15px 20px; width: 100%; }}
            @media (min-width: 1201px) {{ .toggle-bar.fixed .toggle-wrap {{ width: 66.66%; padding: 15px 40px; }} }}
            .toggle-bar.hidden {{ transform: translateY(-100%); }}
            
            .toggle-box {{ display: inline-flex; border: 1px solid #111111; }}
            .btn-tf {{ background-color: #ffffff; color: #777777; border: none; padding: 10px 40px; font-family: 'Gothic A1'; font-weight: bold; font-size: 14px; cursor: pointer; margin: 0; outline: none; transition: background 0.2s, color 0.2s; }}
            .btn-tf.active {{ background-color: #111111; color: #ffffff; }}
            .btn-tf:hover:not(.active) {{ background-color: #f0f0f0; color: #111111; }}
            
            .grid-container {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin: 0 auto; }}
            
            /* 💡 트랜지션 삭제를 통한 슬라이딩 효과 차단, 우아한 페이드 효과 적용 */
            .grid-item {{ position: relative; background-color: #ffffff; border: 1px solid #d0d0d0; overflow: hidden; }}
            .chart-wrapper {{ width: 100%; display: flex; flex-direction: column; background-color: #ffffff; }}
            .chart-view {{ height: 270px; width: 100%; }}
            
            .card-header {{ cursor: pointer; transition: filter 0.2s; }}
            .card-header:hover {{ filter: brightness(1.2); }}
            
            .modal-backdrop {{ position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); z-index: 1500; display: none; backdrop-filter: blur(2px); }}
            .modal-backdrop.active {{ display: block; }}
            
            /* 💡 우아한 페이드 인 효과 추가 */
            .grid-item.is-expanded {{
                position: fixed;
                top: 10vh;
                left: 50%;
                transform: translateX(-50%);
                height: 80vh;
                z-index: 2000;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                margin: 0 !important;
                border-radius: 6px;
                animation: modalFadeIn 0.2s ease-out forwards;
            }}
            @keyframes modalFadeIn {{
                from {{ opacity: 0; transform: translate(-50%, 10px); }}
                to {{ opacity: 1; transform: translate(-50%, 0); }}
            }}
            
            .grid-item.is-expanded .chart-wrapper {{ flex: 1; height: 100%; }}
            .grid-item.is-expanded .chart-view {{ height: 100%; min-height: 400px; }}
            
            .modal-close-btn {{ 
                color: rgba(255,255,255,0.5); 
                font-size: 18px; 
                cursor: pointer; 
                display: none; 
                line-height: 1; 
                padding: 4px;
                margin-left: 10px;
            }}
            .modal-close-btn:hover {{ color: #ffffff; }}
            .grid-item.is-expanded .modal-close-btn {{ display: block; }}
            
            @media (max-width: 1200px) {{
                .top-section {{ flex-direction: row; }}
                .summary-box {{ flex: 1; }}
                .kospi-box {{ flex: 1; }}
                .grid-container {{ grid-template-columns: repeat(2, 1fr); }}
            }}
            @media (max-width: 768px) {{ 
                .top-section {{ flex-direction: column; }}
                .summary-box, .kospi-box {{ width: 100%; flex: none; }}
                .grid-container {{ grid-template-columns: 1fr; }} 
            }}
        </style>
        <script>
            function setTimeframe(tf) {{
                if (document.getElementById('btn-' + tf).classList.contains('active')) return;
                
                document.querySelectorAll('.btn-tf').forEach(btn => btn.classList.remove('active'));
                document.getElementById('btn-' + tf).classList.add('active');
                
                document.querySelectorAll('.chart-view').forEach(el => el.style.display = 'none');
                document.querySelectorAll('.view-' + tf).forEach(el => el.style.display = 'block');
                window.dispatchEvent(new Event('resize'));
            }}
            
            let currentExpanded = null;
            let placeholderItem = null;
            
            function openModal(headerElement) {{
                const gridItem = headerElement.closest('.grid-item');
                if (gridItem.classList.contains('is-expanded')) return;
                
                placeholderItem = document.createElement('div');
                placeholderItem.style.visibility = 'hidden';
                placeholderItem.style.height = gridItem.offsetHeight + 'px';
                gridItem.parentNode.insertBefore(placeholderItem, gridItem);
                
                const wrap = document.querySelector('.wrap-container');
                const wrapStyle = window.getComputedStyle(wrap);
                const contentWidth = wrap.clientWidth - parseFloat(wrapStyle.paddingLeft) - parseFloat(wrapStyle.paddingRight);
                
                gridItem.style.width = contentWidth + 'px';
                gridItem.classList.add('is-expanded');
                document.getElementById('modal-backdrop').classList.add('active');
                
                currentExpanded = gridItem;
                
                setTimeout(() => {{ window.dispatchEvent(new Event('resize')); }}, 50);
            }}
            
            // 💡 닫을 때 부드럽고 찰나의 순간에 복귀 (슬라이딩 차단)
            function closeModal(event) {{
                if(event) event.stopPropagation();
                if(currentExpanded) {{
                    currentExpanded.classList.remove('is-expanded');
                    currentExpanded.style.width = ''; 
                    document.getElementById('modal-backdrop').classList.remove('active');
                    
                    if (placeholderItem) {{
                        placeholderItem.parentNode.removeChild(placeholderItem);
                        placeholderItem = null;
                    }}
                    
                    currentExpanded = null;
                    window.dispatchEvent(new Event('resize'));
                }}
            }}
            
            document.addEventListener("DOMContentLoaded", function() {{
                let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const toggleBar = document.getElementById('toggle-bar');
                const placeholder = document.getElementById('toggle-placeholder');
                
                window.addEventListener('scroll', function() {{
                    let barOffset = placeholder.offsetTop; 
                    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (scrollTop > barOffset) {{
                        if (!toggleBar.classList.contains('fixed')) {{
                            placeholder.style.height = toggleBar.offsetHeight + 'px';
                            toggleBar.classList.add('fixed');
                        }}
                        
                        if (scrollTop > lastScrollTop && scrollTop > barOffset + 50) {{
                            toggleBar.classList.add('hidden');
                        }} else if (scrollTop < lastScrollTop) {{
                            toggleBar.classList.remove('hidden');
                        }}
                    }} else {{
                        if (toggleBar.classList.contains('fixed')) {{
                            toggleBar.classList.remove('fixed');
                            toggleBar.classList.remove('hidden');
                            placeholder.style.height = '0px';
                        }}
                    }}
                    lastScrollTop = Math.max(0, scrollTop);
                }}, false);
                
                document.getElementById('modal-backdrop').addEventListener('click', function() {{
                    closeModal();
                }});
            }});
        </script>
    </head>
    <body>
        <div class="wrap-container">
            <div class="title-section">
                <h1>Mark Minervini 트레이딩 분석</h1>
                <div class="header-info">
                    {datetime.today().strftime("%Y년 %m월 %d일")} 기준 | 선 범례: <span style="color:blue;">5</span>/<span style="color:orange;">20</span>/<span style="color:black;">60</span>/<span style="color:purple;">저항</span>
                </div>
            </div>
            
            <div class="top-section">
                <div class="summary-box">
                    <div class="vcp-desc">
                        <b>[매매 기법 및 알고리즘 기준]</b><br>
                        - <b>JDL (Just Draw the Line):</b> 복잡한 패턴이 형성되기 전, 최근 90일 내 최고점(수평 저항선)을 뚫어내는 <b>초기 주도주 선점</b> 기법. 돌파 당일 50일 평균 대비 <b>120% 이상의 폭발적인 거래량</b> 수반 必.<br>
                        - <b>VCP (변동성 축소):</b> 주가가 횡보하며 우측으로 갈수록 하락 파동이 얕아지는 패턴. 돌파 직전 최근 5일 평균 거래량이 50일 평균 대비 <b>60% 이하로 극도로 메말라야</b> 매수 타점 인정.<br>
                        - <b>Pullback (눌림목):</b> 상승 추세 중 이격도를 좁히며 핵심 이평선에 저거래량으로 안착한 기술적 반등 타점.
                    </div>
                    <div class="stock-lists">
                        <b>매수 종목:</b> <span style="color:#B71C1C; font-weight:bold;">{str_strict}</span><br>
                        <b>관심 종목:</b> <span style="color:#2E7D32; font-weight:bold;">{str_relaxed}</span><br>
                        <b>주요 섹터:</b> <span style="color:#111111; font-weight:bold;">{sector_str}</span>
                    </div>
                    <div class="footnotes">
                        * <b><span style="color:#B71C1C;">매수 타점</span></b> : 변동성/이격도 완벽 충족 및 거래량 고갈/폭발 기준 도달<br>
                        * <b><span style="color:#2E7D32;">관심 주시</span></b> : 변동성/이격도 완화 충족 및 50일 평균대비 거래량 80% 이하 고갈
                    </div>
                </div>
                <div class="kospi-box">
                    {kospi_html}
                </div>
            </div>

            <div id="toggle-placeholder" style="height:0;"></div>
            <div id="toggle-bar" class="toggle-bar">
                <div class="toggle-wrap">
                    <div class="toggle-box">
                        <button id="btn-weekly" class="btn-tf active" onclick="setTimeframe('weekly')">주간 차트</button>
                        <button id="btn-daily" class="btn-tf" onclick="setTimeframe('daily')">일간 차트</button>
                    </div>
                </div>
            </div>
            
            <div class="grid-container">
                {''.join(div_list_current)}
            </div>
            
            {past_section}
            {none_section}
            
        </div>
        <div id="modal-backdrop" class="modal-backdrop"></div>
    </body>
    </html>
    """
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f: f.write(html_template)
    os.makedirs(os.path.dirname(BLOG_HTML_PATH), exist_ok=True)
    shutil.copyfile(filename, BLOG_HTML_PATH)

def generate_dashboard_json(stock_data_list, strict_list, relaxed_list, filename=JSON_OUTPUT_PATH):
    output = {"date": datetime.today().strftime("%Y.%m.%d"), "strict": strict_list, "relaxed": relaxed_list, "stocks": stock_data_list}
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f: json.dump(output, f, ensure_ascii=False)

if __name__ == "__main__":
    try:
        print("시스템 구동을 시작합니다...")
        if not HTS_USER_ID:
            print("시스템 에러: .env 파일에 HTS_USER_ID 값이 설정되지 않았습니다.")
            exit()
            
        access_token = get_access_token()

        print("[1] 로컬 섹터 정보를 불러옵니다...")
        try:
            with open('sectors.json', 'r', encoding='utf-8') as f:
                raw_sectors = json.load(f)
                sectors = {str(k).zfill(6): str(v) for k, v in raw_sectors.items()}
        except Exception as e:
            print(f" └ sectors.json 읽기 실패. 임시 딕셔너리 사용: {e}")
            sectors = {}

        print("\n[2] HTS 조건식 번호를 탐색합니다...")
        condition_seq = get_condition_seq(access_token, HTS_USER_ID, "trading", "minervini")
        if not condition_seq: 
            print(" └ HTS 조건식 탐색 실패. API 또는 환경 변수를 확인하세요.")
            exit()
            
        target_stocks = get_condition_search_list(access_token, HTS_USER_ID, condition_seq)
        if not target_stocks: 
            print(" └ HTS 조건식 포착 종목이 없거나 데이터를 불러오지 못했습니다.")
            exit()
        
        print(f" └ HTS 조건식 포착 종목 수: {len(target_stocks)}개\n")

        end_date = datetime.today().strftime("%Y%m%d")
        start_date = (datetime.today() - timedelta(days=500)).strftime("%Y%m%d")

        print(f"[3] 코스피 일간차트(6개월) 렌더링 중...")
        kospi_html = get_kospi_html(end_date)
        print(" └ 코스피 차트 렌더링 완료\n")

        current_results = []
        past_results = []
        none_results = []
        strict_list = []
        relaxed_list = []
        
        valid_sectors = []

        total_stocks = len(target_stocks)
        print(f"[4] 개별 종목 데이터 수집 및 분석 시작 (총 {total_stocks}개)")
        
        for idx, (code, name) in enumerate(target_stocks.items(), 1):
            print(f" ├ [{idx}/{total_stocks}] {name} ({code}) 처리 중...", end=" ", flush=True)
            
            name_upper = name.upper()
            is_fund_or_spac = any(keyword in name_upper for keyword in [
                "KODEX", "TIGER", "KBSTAR", "ACE", "ARIRANG", "KOSEF", 
                "HANARO", "SOL", "TIMEFOLIO", "WON", "PLUS", "TREX", "마이티", "WOORI", "ETN", "스팩"
            ])
            if is_fund_or_spac or not (len(code) == 6 and code.isdigit() and code.endswith('0')):
                print("완료 (제외: ETF/스팩/우선주)")
                continue

            is_valid, reject_reason = check_stock_validity(access_token, code)
            if not is_valid:
                print(f"완료 (제외: {reject_reason})")
                continue
            
            raw_data = get_historical_prices(access_token, code, start_date, end_date)
            if len(raw_data) < 200: 
                print("완료 (제외: 데이터 누락/상장기간 부족)")
                continue

            df = pd.DataFrame(raw_data)
            df = df.sort_values(by="stck_bsop_date").reset_index(drop=True)
            df = df[['stck_bsop_date', 'stck_oprc', 'stck_hgpr', 'stck_lwpr', 'stck_clpr', 'acml_vol']]
            df.columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
            for col in ['Open', 'High', 'Low', 'Close', 'Volume']: df[col] = pd.to_numeric(df[col])

            sector_name = sectors.get(code.zfill(6))
            if not sector_name or sector_name == "nan":
                sector_name = "기타 업종"
            
            final_status, final_msg, final_trendline, pattern_name = run_algorithms(df)
            is_past = False
            
            if final_status == "NONE":
                for i in range(1, 11):
                    past_df = df.iloc[:-i].copy()
                    if len(past_df) < 200: break
                    
                    p_status, p_msg, p_trendline, p_pattern = run_algorithms(past_df)
                    if p_status != "NONE":
                        final_status = p_status + "_PAST"
                        final_msg = f"<b style='color:#E65100;'>[{i}영업일 전 포착]</b> " + p_msg
                        final_trendline = p_trendline
                        pattern_name = p_pattern
                        is_past = True
                        break

            print(f"완료 ({final_status})")

            card_html, json_data = create_stock_package(df, code, name, sector_name, final_status, final_msg, final_trendline)
            
            if "PAST" in final_status:
                past_results.append({"status": final_status, "card_html": card_html, "json_data": json_data})
            elif final_status in ["STRICT", "RELAXED"]:
                if final_status == "STRICT": strict_list.append(f"{name} ({pattern_name})")
                elif final_status == "RELAXED": relaxed_list.append(f"{name} ({pattern_name})")
                
                valid_sectors.append(sector_name)
                current_results.append({"status": final_status, "card_html": card_html, "json_data": json_data})
            else:
                none_results.append({"status": final_status, "card_html": card_html, "json_data": json_data})

        def sort_priority(item):
            if "STRICT" in item["status"]: return 1
            elif "RELAXED" in item["status"]: return 2
            else: return 3
            
        current_results.sort(key=sort_priority)
        past_results.sort(key=sort_priority)

        div_list_current = [item["card_html"] for item in current_results]
        div_list_past = [item["card_html"] for item in past_results]
        div_list_none = [item["card_html"] for item in none_results]
        json_stock_list = [item["json_data"] for item in current_results + past_results + none_results]

        if div_list_current or div_list_past or div_list_none:
            generate_dashboard_html(div_list_current, div_list_past, div_list_none, strict_list, relaxed_list, valid_sectors, kospi_html)
            generate_dashboard_json(json_stock_list, strict_list, relaxed_list)
            print("\n[5] 전체 파일 추출이 완료되었습니다. 대시보드를 확인하세요!")

    except Exception as e:
        print(f"실행 중 오류가 발생했습니다: {e}")