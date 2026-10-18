import type { Feature } from "@/lib/features"

// 메인 화면의 "기능모음": 글자와 위·아래 가는 선만으로 이루어진 목록(항목 사이에는 선을 두지 않는다).
// 배치는 부르는 쪽(SiteHero)이 className 으로 정한다 — 넓은 화면에서는 오른쪽에 떠 있고, 좁은 화면에서는 안내 문구 아래에 쌓인다.
export function SiteFeatures({ title, items, className = "" }: { title: string; items: Feature[]; className?: string }) {
  return (
    <nav aria-label={title} className={`border-y border-foreground/25 py-4 ${className}`}>
      <p className="font-sans text-sm font-extrabold tracking-[0.12em] text-foreground">{title}</p>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((feature) => (
          <li key={feature.href}>
            <a
              href={feature.href}
              className="text-sm leading-snug text-foreground/80 transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
            >
              {feature.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
