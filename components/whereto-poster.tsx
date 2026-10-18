// 메인 화면 오른쪽 위의 "여기살까?" 작은 포스터.
// 앞에는 물까치 로고(whereto 저장소 public/logo-magpie.svg 를 그대로 복사한 /images/whereto/logo-magpie.svg),
// 뒤에는 앱 화면을 줄여 그린 것 — 지도 위 후보지 위치 마커(핀)·대중교통 경로와, 후보지 상세카드(종합평점, 고리 안 3D 집) 하나가 열린 모습.
// 숫자·지명은 앱 소개 그림(og.jpg)의 예시값이다. 폭은 부르는 쪽이 정하고(기능모음 열과 같은 폭), 정사각형으로 늘어난다.

const WHERETO_URL = "https://whereto.maverickway.workers.dev/"

// 종합평점 고리: 7.2 / 10 만큼 채운 호
const RING = { cx: 66, cy: 132, r: 27 }
const RING_LEN = 2 * Math.PI * RING.r

// 고리 안 집의 벽면 점: 왼쪽(앞) 벽은 x 50→64 에서 아래로 반 칸씩, 오른쪽 벽은 64→78 에서 위로 반 칸씩 기운다.
// [x, 지붕선에서 내려온 거리] → "x,y" 목록
function iso(pts: [number, number][], face: "L" | "R") {
  return pts
    .map(([x, d]) => `${x},${face === "L" ? 115 + (x - 50) * 0.5 + d : 122 - (x - 64) * 0.5 + d}`)
    .join(" ")
}

export function WheretoPoster({ className = "" }: { className?: string }) {
  return (
    <a
      href={WHERETO_URL}
      target="_blank"
      rel="noopener noreferrer"
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

          {/* 후보지 위치 마커(끝이 뾰족한 핀) — 고른 후보지만 초록 */}
          {[
            { x: 170, y: 38, color: "#22262B" },
            { x: 222, y: 82, color: "#22262B" },
            { x: 160, y: 214, color: "#22262B" },
            { x: 196, y: 112, color: "#2E8B57" },
          ].map((pin) => (
            <g key={`${pin.x}-${pin.y}`} transform={`translate(${pin.x} ${pin.y})`}>
              <ellipse cx="0" cy="0.5" rx="3.2" ry="1.2" fill="#000" opacity="0.18" />
              <path d="M0 0 C-2 -4 -6.5 -7.5 -6.5 -12 A6.5 6.5 0 1 1 6.5 -12 C6.5 -7.5 2 -4 0 0 Z" fill={pin.color} stroke="#fff" strokeWidth="1" />
              <circle cx="0" cy="-12" r="2.4" fill="#fff" />
            </g>
          ))}

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

          {/* 고리 안 3D 집(앱의 평지붕 주택을 등각 투영으로 줄여 그림) */}
          <g transform="translate(66 133) scale(0.82) translate(-66 -128)">
          <ellipse cx="66" cy="146" rx="21" ry="7" fill="#E8E4D8" />
          <g strokeLinejoin="round">
            <polygon points={iso([[50, 0], [64, 0], [64, 22], [50, 22]], "L")} fill="#EDE3D1" />
            <polygon points={iso([[64, 0], [78, 0], [78, 22], [64, 22]], "R")} fill="#D2C3AA" />
            <polygon points="64,108 78,115 64,122 50,115" fill="#F6F0E6" stroke="#C9BBA3" strokeWidth="0.8" />
            <line x1="50" y1={115 + 11} x2="64" y2={122 + 11} stroke="#CDBFA6" strokeWidth="0.8" />
            <line x1="64" y1={122 + 11} x2="78" y2={115 + 11} stroke="#B9A98E" strokeWidth="0.8" />
            {[3, 14].map((d) => (
              <g key={d}>
                <polygon points={iso([[52.5, d], [56.5, d], [56.5, d + 5], [52.5, d + 5]], "L")} fill="#5F7A92" />
                <polygon points={iso([[58, d], [62, d], [62, d + 5], [58, d + 5]], "L")} fill="#5F7A92" />
                <polygon points={iso([[67, d], [71, d], [71, d + 5], [67, d + 5]], "R")} fill="#4E667C" />
                <polygon points={iso([[73, d], [76, d], [76, d + 5], [73, d + 5]], "R")} fill="#4E667C" />
              </g>
            ))}
            {/* 옥탑 물탱크 */}
            <polygon points="68,110 72,112 72,116 68,114" fill="#4A8FC0" />
            <polygon points="72,112 75,110.5 75,114.5 72,116" fill="#3A76A3" />
            <polygon points="68,110 71,108.5 75,110.5 72,112" fill="#7DB3D9" />
          </g>
          {/* 나무 */}
          <rect x="83.2" y="138" width="1.6" height="6" fill="#8E7B69" />
          <circle cx="84" cy="135" r="4.6" fill="#6FA35E" />
          <circle cx="46" cy="143" r="2.8" fill="#7FB36C" />
          </g>
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
