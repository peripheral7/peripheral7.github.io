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
