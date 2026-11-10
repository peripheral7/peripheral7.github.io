# 작업지시서 — BF·IA 학습자료 (2026-11-10)

메인 세션이 허브 페이지(`public/study/index.html`)·`lib/features.ts`·빌드·커밋·푸시를 맡는다.
작업자는 **자기 폴더 하나**(`public/study/<id>/`)와 강의 폴더의 사본 파일만 만든다. 다른 폴더·파일은 건드리지 않는다. `git commit`/`push` 금지.

## 원본 위치
- BF 강의 PDF: `C:\Users\moonc\desktop\2026-2\Business Finance\` (BF_Chap09_students.pdf, BF_Chap11_students.pdf …)
- IA 강의 PDF: `C:\Users\moonc\desktop\2026-2\Investment Analysis\` (IA_Chap07_students.pdf, Investment Chap09_stidents.pdf …)
- IA 참고: `IA_course_toc.md`(Ch.7 정답 요약 포함), `IA_Final_Slides_Text.md`(Ch.7 쪽별 글자)
- 퀴즈 템플릿: `C:\Users\moonc\desktop\2026-2\quiz_template_integrated.html` (맨 위 주석에 데이터 형식·출제 규칙이 있다 — 반드시 읽을 것)
- 슬라이드 엔진: `public/slides/deck.css`, `public/slides/deck.js`, 사용법은 `public/slides/index.html` 머리 주석. 그림 장 예시는 `public/slides/econ2/index.html`.
- 강의 PDF 쪽 크기 960×540 pt. 쪽 글자 추출은 PyMuPDF(`import pymupdf`), 쪽을 보려면 PNG로 렌더해 Read 로 본다. Windows 콘솔 출력은 `PYTHONIOENCODING=utf-8`.

## A. 빈칸 채운 슬라이드 (예습 장: bf11, ia9)
1. 학생용 PDF의 **모든 쪽을 그림으로 보고** 빈칸을 찾는다. 빈칸 종류: (a) 글자 사이·표 칸·상자 안의 빈 자리, (b) 흰 글자로 숨겨진 라벨(span color 가 흰색인데 바탕도 흰색), (c) 비어 있는 풀이·정답 상자, 빈 카드 제목·색 상자 라벨.
2. 정답은 그 쪽과 앞뒤 쪽의 내용, 계산(파이썬으로 검산), 교재(RWJ *Essentials of Corporate Finance* / BKM *Essentials of Investments*) 지식으로 정한다. 확신이 없으면 보고에 적는다.
3. PyMuPDF 로 원본 위에 글자를 얹어 **벡터 PDF**로 저장(래스터화 금지). 글꼴은 `C:/Windows/Fonts/calibrib.ttf`(굵게) — `page.insert_font(fontname="cb", fontfile=...)`. 크기는 주변 글자에 맞춘다. 색은 채운 답이 눈에 띄게 **#C0392B**(어두운 바탕 위라면 #FFD54F). 흰 글자 라벨은 같은 자리에 답 색으로 다시 쓴다. 글자가 칸을 넘치거나 다른 글자와 겹치면 안 된다 — 다 채운 뒤 **모든 쪽을 다시 그림으로 보고 확인**한다.
4. 산출물(`public/study/<id>/` 아래):
   - `<ID>_filled.pdf` (예: `BF_Ch11_filled.pdf`, `IA_Ch09_filled.pdf`)
   - `p01.jpg …` : 채운 PDF 를 2배(1920×1080) JPG 품질 82 로
   - `index.html` : 그림 장 덱. econ2 덱처럼 `<link rel="stylesheet" href="/slides/deck.css">`, 장마다 `<section class="slide pg" data-title="쪽 제목"><img src="p01.jpg" alt="쪽 제목" decoding="async"></section>`(첫 장만 `fetchpriority="high"`), 스타일은 `.slide.pg{padding:0}.slide.pg>img{position:absolute;left:0;top:0;width:1600px;height:900px;max-width:none;max-height:none}`, 끝에 `<script src="/slides/deck.js"></script>`. `<html lang="ko">`, `<meta name="robots" content="noindex">`, `<title>` 은 예: `BF Ch.11 Risk and Return — 빈칸 채움`.
   - 강의 폴더에도 사본: `BF_Chap11_filled.pdf` / `IA_Chap09_filled.pdf`.

## B. 예습자료 (bf11, ia9) — 간단하게 구조를 이해하기 위한 것
- `public/study/<id>/preview/index.html` : 덱 엔진(HTML 장)으로 **8~12장**. 한국어 설명 + 영어 핵심 용어 병기(예: 체계적 위험(systematic risk)).
- 들어갈 것: 표지 → 장 전체 지도(절 순서와 "왜 이 순서인가", 한 장에 흐름도/표로) → 절마다 핵심 질문·핵심 개념·핵심 식 1장씩(묶어도 됨) → 앞 장과의 연결(예: BF Ch.10 → 11, IA Ch.8 EMH → 9) → 수업 전에 볼 체크리스트(자주 헷갈리는 쌍 3~5개) .
- 길게 쓰지 말 것. 장마다 글 6줄 안팎, 표·흐름도 위주. 숫자 예시는 강의 PDF 의 것을 그대로 써도 된다.
- 덱 HTML 장 문법: `<section class="slide">` 안에 h2·p·ul·table·`<div class="cols">`; 표지 `class="slide title"`, 구분 장 `class="slide section"`. 사용 예는 `public/slides/index.html`. 덱 전용 스타일은 `<style>` 에 최소한으로(흰/검은 바탕 전환에서도 읽혀야 하므로 글자색을 고정하지 말 것).

## C. 복습자료 + 연습문제 (복습 장: bf9, ia7)
- `public/study/<id>/review/index.html` : 덱 엔진(HTML 장). 한국어 설명 + 영어 용어 병기.
  1. 복습 요약 8~12장: 절별 핵심 개념·식·판단 규칙, 헷갈리는 쌍 비교표.
  2. 연습문제: **한 장에 한 문제**(정말 중요해 묶어야 할 때만 한 장에 두 문제). 15~20문제. 문제는 장 위쪽, 풀이는 같은 장 아래에 `class="step"` 블록으로(→ 를 누르면 나타남). 계산 문제는 식에 숫자를 대입한 풀이 + BA II Plus 키 순서(해당 시). 강의 예제 구조는 따르되 숫자는 바꿔도 되고 그대로 써도 된다(복습용).
  - 문제 장 제목 형식: `Q3 · 주제` 와 `data-title="Q3 · 주제"`.
- `public/study/<id>/quiz.html` : `quiz_template_integrated.html` 을 복사해 **`<script type="text/plain" id="quizData">` 와 `</script>` 사이만** 바꾼다(다른 곳 수정 금지). 출제 언어 영어.
  - **개념 문제 = 객관식(MC)**, **계산 문제 = 서술형(WRITTEN, 표를 채우는 계산은 @grid TABLE)**. 18~25문항, MC 와 서술형 대략 6:4.
  - 템플릿 머리 주석의 출제 프롬프트(B~I: 오답 설계, 정답 위치 분산, 검산, 단독 풀이 가능)를 따른다. 숫자·회사명은 새로 창작(연습문제와도 겹치지 않게). 모든 정답·key results·표 빈칸을 파이썬으로 검산.
  - 만든 뒤 브라우저 없이도 데이터 오류를 잡을 수 있게: 파일을 열면 맨 위 빨간 상자에 데이터 오류가 뜨는 구조이므로, node 로 quizData 를 파싱하거나 형식 규칙(=== 구분, 보기 `*` 정확히 1개, `|` 개수)을 스크립트로 점검한다.
  - 강의 폴더에도 사본: `BF_Ch09_Review_Quiz.html` / `IA_Ch07_Review_Quiz.html`.

## 확인 (모든 작업자)
- 덱: `node -e` 로 HTML 이 열리는지까지는 못 보므로, 대신 `<section` 개수·`step` 구조·이미지 파일 존재를 스크립트로 점검. 가능하면 Playwright 없이 PyMuPDF 렌더/눈 확인으로 대체.
- 마지막 보고 형식:
```
만든 파일: <경로 목록>
빈칸/문항 요약: <채운 빈칸 수와 쪽 번호별 핵심 답 / 문항 수·형식 분포>
확신 없는 것: <없으면 "없음">
```
