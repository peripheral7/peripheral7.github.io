// 메인 화면 오른쪽 위의 "여기살까?" 작은 포스터.
// 앞에는 물까치 로고(whereto 저장소 public/logo-magpie.svg 를 그대로 복사한 /images/whereto/logo-magpie.svg),
// 뒤에는 앱 화면을 줄여 그린 것 — 지도 위 후보지 번호 마커·대중교통 경로와, 후보지 상세카드(종합평점) 하나가 열린 모습.
// 숫자·지명은 앱 소개 그림(og.jpg)의 예시값이다. 폭은 부르는 쪽이 정하고(기능모음 열과 같은 폭), 정사각형으로 늘어난다.

const WHERETO_URL = "https://whereto.maverickway.workers.dev/"

// 종합평점 고리: 7.2 / 10 만큼 채운 호
const RING = { cx: 66, cy: 132, r: 27 }
const RING_LEN = 2 * Math.PI * RING.r

export function WheretoPoster({ className = "" }: { className?: string }) {
  return (
    <a
      href={WHERETO_URL}
      className={`group block focus-visible:outline-none ${className}`}
      aria-label="여기살까? — 후보지 입지 비교 앱 열기"
    >
      <svg
        viewBox="0 0 240 240"
        className="block aspect-square w-full border border-foreground/15 transition-opacity group-hover:opacity-90 group-focus-visible:ring-2 group-focus-visible:ring-accent"
        aria-hidden="true"
        style={{ fontFamily: "inherit" }}
      >
        <defs>
          <filter id="wt-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.14" />
          </filter>
          <clipPath id="wt-frame">
            <rect width="240" height="240" />
          </clipPath>
        </defs>

        <g clipPath="url(#wt-frame)">
          {/* 지도 바탕 */}
          <rect width="240" height="240" fill="#EEF0EC" />
          <path d="M150 0 H240 V70 C214 76 188 60 170 38 C160 26 154 12 150 0 Z" fill="#D9E8D2" />
          <path d="M0 196 C30 186 52 200 70 224 L76 240 H0 Z" fill="#D9E8D2" />
          <path d="M196 150 C210 140 232 146 240 160 V214 C222 210 200 196 196 176 Z" fill="#D3E3EE" />

          {/* 길: 흰 골목 → 노란 큰길 → 빨간 대중교통 경로 */}
          <g fill="none" stroke="#fff" strokeLinecap="round">
            <path d="M0 40 L240 92" strokeWidth="5" />
            <path d="M40 0 L96 240" strokeWidth="4" />
            <path d="M120 0 L134 240" strokeWidth="4" />
            <path d="M0 150 L240 128" strokeWidth="4" />
            <path d="M186 0 L210 240" strokeWidth="3" />
            <path d="M0 98 L120 110" strokeWidth="3" />
          </g>
          <path d="M0 70 C70 78 150 96 240 112" fill="none" stroke="#F3D57A" strokeWidth="5" />
          <path d="M162 0 C170 60 176 120 214 240" fill="none" stroke="#9AA3AD" strokeWidth="1.5" strokeDasharray="5 3" />
          <path
            d="M150 112 H196 V166 L214 182 V240"
            fill="none"
            stroke="#D6242E"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="150" cy="112" r="4" fill="#fff" stroke="#D6242E" strokeWidth="2.5" />

          {/* 후보지 번호 마커 */}
          <g fontWeight="700" fontSize="8" textAnchor="middle">
            <circle cx="170" cy="30" r="8" fill="#fff" stroke="#22262B" strokeWidth="1.4" />
            <text x="170" y="33" fill="#22262B">1</text>
            <circle cx="222" cy="74" r="8" fill="#fff" stroke="#22262B" strokeWidth="1.4" />
            <text x="222" y="77" fill="#22262B">3</text>
            <circle cx="160" cy="206" r="8" fill="#fff" stroke="#22262B" strokeWidth="1.4" />
            <text x="160" y="209" fill="#22262B">4</text>
          </g>

          {/* 후보지 상세카드(종합평점) */}
          <g filter="url(#wt-shadow)">
            <rect x="10" y="44" width="112" height="186" rx="8" fill="#fff" />
          </g>
          <text x="18" y="58" fontSize="7" fontWeight="700" fill="#22262B">
            종합평점
          </text>
          <rect x="84" y="51" width="32" height="10" rx="5" fill="none" stroke="#D5D8DC" strokeWidth="0.8" />
          <text x="100" y="58" fontSize="4.6" textAnchor="middle" fill="#5B6168">
            라이프스타일
          </text>
          <text x="66" y="72" fontSize="5.2" fontWeight="700" textAnchor="middle" fill="#2E8B57">
            종합 2위
          </text>
          <text x="66" y="84" fontSize="8.5" fontWeight="800" textAnchor="middle" fill="#22262B">
            망포역 영통로
          </text>
          <text x="66" y="93" fontSize="4.3" textAnchor="middle" fill="#7A8087">
            경기도 수원시 영통구 영통로200번길
          </text>

          <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke="#ECEEF0" strokeWidth="4" />
          <circle
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            fill="none"
            stroke="#2E8B57"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${RING_LEN * 0.72} ${RING_LEN}`}
            transform={`rotate(-90 ${RING.cx} ${RING.cy})`}
          />
          <text x="62" y="177" fontSize="15" fontWeight="500" textAnchor="middle" fill="#22262B">
            7.2
          </text>
          <text x="75" y="177" fontSize="5" fill="#9097A0">
            / 10
          </text>

          {/* 수단별 점수 막대 */}
          {[
            { y: 194, label: "대중교통", score: "6.9", color: "#2E8B57", fill: 0.69 },
            { y: 208, label: "차량", score: "9.4", color: "#E08A3C", fill: 0.94 },
          ].map((row) => (
            <g key={row.label}>
              <circle cx="20" cy={row.y - 1.6} r="2" fill={row.color} />
              <text x="25" y={row.y} fontSize="5" fill="#22262B">
                {row.label}
              </text>
              {Array.from({ length: 14 }, (_, i) => (
                <rect
                  key={i}
                  x={54 + i * 3.2}
                  y={row.y - 5}
                  width="1.6"
                  height="6"
                  fill={i < Math.round(row.fill * 14) ? row.color : "#E3E5E8"}
                />
              ))}
              <text x="114" y={row.y} fontSize="5" textAnchor="end" fill="#22262B">
                {row.score}
              </text>
            </g>
          ))}
          <line x1="18" y1="200" x2="114" y2="200" stroke="#F0F1F3" strokeWidth="0.6" />

          {/* 앞: 물까치 */}
          <image href="/images/whereto/logo-magpie.svg" x="88" y="56" width="150" height="150" />
        </g>
      </svg>

      <span className="mt-2 flex items-baseline justify-between gap-3">
        <span className="font-sans text-sm font-extrabold tracking-[0.04em] text-foreground underline-offset-4 group-hover:text-accent group-hover:underline">
          여기살까?
        </span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Fig. 02 — App</span>
      </span>
    </a>
  )
}
