// 메인 화면 오른쪽 "기능모음"(components/site-features.tsx)에 글자로 나열하는 기능 페이지들.
// 기능을 하나 더 만들면 여기에 한 줄만 추가한다(순서 = 화면에 보이는 순서).
// href 는 게시판 카드와 같은 방식의 일반 링크라서, 정적 HTML(/reports/…, /clock/, /slides/)도 Next 경로(/appraiser 등)도 그대로 쓴다.

export type Feature = { label: string; href: string }

export const FEATURES: Feature[] = [
  { label: "주식종목검색", href: "/reports/vcp_dashboard.html" },
  { label: "공원 촬영 앱", href: "/field-cam" },
  { label: "시계", href: "/clock/" },
  { label: "슬라이드", href: "/slides/" },
]

// 기능모음 아래에 나란히 보이는 "평가사 학습자료"(예전 게시판 맨 위 감정평가 카드 4장을 옮겨 온 것).
export const STUDY_MATERIALS: Feature[] = [
  { label: "매일 테스트", href: "/reports/daily-test.html" },
  { label: "행정법 기본문제", href: "/reports/admin-law-basic-problems-25.html" },
  { label: "법규 퀴즈", href: "/reports/appraisal-law-quiz.html" },
  { label: "실무 퀴즈", href: "/reports/appraisal-practice-quiz.html" },
  { label: "감정평가사 학습트리", href: "/appraiser" },
]

// 사진 왼쪽(xl)에 보이는 "Midterm": 중간고사 요약노트·퀴즈 정답 포함 PDF(public/reports/midterm/). 좁은 화면에서는 오른쪽 열 아래에 쌓인다.
export const MIDTERM: Feature[] = [
  { label: "인쇄·다운로드 페이지", href: "/reports/midterm/" },
  { label: "BF Cheat Sheet", href: "/reports/midterm/BF_Cheatsheet_Ch2-7.pdf" },
  { label: "BF 재무비율 한 장 노트", href: "/reports/midterm/Business_Finance_Ratio_One_Page_Notes.pdf" },
  { label: "IA Sub-Note", href: "/reports/midterm/Investment_Analysis_SubNote_Ch2-6.pdf" },
  { label: "BF 객관식 (Ch.2–7)", href: "/reports/midterm/BF_Midterm_MultipleChoice_Ch2-7_with_answers.pdf" },
  { label: "BF 서술형 (Ch.2–7)", href: "/reports/midterm/BF_Midterm_ShortAnswer_Ch2-7_with_answers.pdf" },
  { label: "IA 객관식", href: "/reports/midterm/IA_Midterm_MultipleChoice_with_answers.pdf" },
  { label: "IA 서술형", href: "/reports/midterm/IA_Midterm_ShortAnswer_with_answers.pdf" },
  { label: "계량 객관식", href: "/reports/midterm/Econometrics_Midterm_MultipleChoice_with_answers.pdf" },
  { label: "계량 서술형", href: "/reports/midterm/Econometrics_Midterm_ShortAnswer_with_answers.pdf" },
]
