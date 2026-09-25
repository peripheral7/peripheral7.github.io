import Image from "next/image"
import type { Metadata } from "next"
import { SimplePostHeader } from "@/components/simple-post-header"
import { posts } from "@/lib/posts"

// 앱은 이 블로그가 아니라 별도 주소(Cloudflare Workers)에서 실행된다. 촬영 기록은 그 주소의 폰 브라우저(IndexedDB)에
// 저장되므로 주소(오리진)를 바꾸면 이미 찍은 기록이 새 주소에서 보이지 않는다 — 함부로 옮기지 말 것.
// (배포 방법: workers/park-entrance-cam/README.md, 앱 소스: KICA 논문작성/field_app)
const APP_URL = "https://park-entrance-cam.mooncg0916.workers.dev/"
const APP_HOST = "park-entrance-cam.mooncg0916.workers.dev"

export const metadata: Metadata = {
  title: "공원 진출입로 촬영 앱 — THE FIELD FILE",
  description:
    "공원 진출입로를 찍으면 사진·GPS 위치·시각·이름이 한 묶음으로 저장되는 현장조사용 모바일 웹앱 소개와 사용법.",
}

const EXPORT_FILES = [
  {
    name: "photos/<id>.jpg",
    desc: "촬영 사진. EXIF에 GPS(위도·경도·정확도·고도), 촬영 시각, ‘공원 · 진출입로’ 이름이 들어 있어 윈도우 탐색기 속성에서도 보입니다.",
  },
  {
    name: "entrances.csv",
    desc: "한 줄 = 사진 한 장. UTF-8(BOM)이라 엑셀에서 한글이 깨지지 않습니다.",
  },
  {
    name: "entrances.geojson",
    desc: "같은 내용의 점(Point) 데이터. WGS84(EPSG:4326), 좌표 순서는 [경도, 위도]. QGIS에서 벡터 레이어로 그대로 열립니다.",
  },
]

function OpenAppButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={APP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-accent px-6 py-3 font-sans text-sm font-bold text-accent-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${className}`}
    >
      앱 열기 <span aria-hidden>→</span>
    </a>
  )
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-accent">{label}</p>
      <h2 className="mt-1 font-sans text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
      <div className="mt-4 text-[0.95rem] leading-relaxed text-card-foreground/90">{children}</div>
    </section>
  )
}

const listClass = "space-y-2.5 pl-5 marker:font-mono marker:text-accent"

export default function FieldCamPage() {
  const post = posts.find((p) => p.id === "09-park-entrance-cam")

  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono">
        Error: [09-park-entrance-cam] 기록을 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 pb-24 pt-10 md:px-10">
        <SimplePostHeader
          eyebrow={`${post.category} / Filed: ${post.date}`}
          title={post.title}
          subtitle={post.meta}
          tags={post.tags}
        />

        <div className="mx-auto mt-10 max-w-4xl px-4">
          {/* 소개 + 앱 열기. 폰에서는 소개·버튼을 그림보다 먼저 보이게(order) 하고, md 이상에서는 그림을 왼쪽 두 행에 걸쳐 놓는다. */}
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-[17rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:items-start">
            <figure className="relative order-2 mx-auto w-full max-w-[17rem] pt-4 md:order-none md:row-span-2">
              <span
                aria-hidden
                className="tape pointer-events-none absolute -top-0 left-1/2 z-20 h-7 w-28 -translate-x-1/2 -rotate-2"
              />
              <div className="bg-card p-3 pb-4 shadow-scrap ring-1 ring-black/5">
                <Image
                  src={post.image ?? "/placeholder.svg"}
                  alt={post.imageAlt ?? post.title}
                  width={800}
                  height={1000}
                  sizes="(max-width: 768px) 80vw, 17rem"
                  priority
                  className="h-auto w-full"
                />
              </div>
            </figure>

            <div className="order-1 md:order-none">
              <p className="text-base leading-relaxed text-card-foreground">
                공원 진출입로를 찍으면 <strong className="font-bold">사진 + GPS 위치 + 시각 + 공원·진출입로 이름</strong>이
                한 묶음으로 저장되는 현장조사용 모바일 웹앱입니다. 안드로이드·아이폰 브라우저에서 열고 ‘홈 화면에
                추가’하면 앱처럼 쓰고, 한 번 열어 두면 인터넷이 없는 공원에서도 열립니다.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <OpenAppButton />
                <span className="font-mono text-xs text-muted-foreground">{APP_HOST}</span>
              </div>
            </div>

            <ul className="order-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-accent md:order-none">
              <li>폰에서 열어 주세요. 위치·카메라는 폰 브라우저에서 쓰는 기능이고, PC에서는 위치가 잡히지 않을 수 있습니다.</li>
              <li>기록은 폰 브라우저 안에만 저장되며 이 블로그나 어떤 서버로도 전송되지 않습니다.</li>
              <li>앱은 이 블로그가 아닌 위 주소에서 실행됩니다. 이 페이지는 소개·사용법 안내입니다.</li>
            </ul>
          </div>

          <Section label="Step 1" title="처음 한 번 — 폰에 설치">
            <ol className={`list-decimal ${listClass}`}>
              <li>폰 브라우저(안드로이드 Chrome · 아이폰 Safari)로 위 ‘앱 열기’를 누릅니다.</li>
              <li>
                위치 권한을 <strong className="font-bold">허용</strong>합니다. 브라우저는 HTTPS 주소에서만 위치 기능을 켜 줍니다.
              </li>
              <li>
                홈 화면에 추가합니다. 안드로이드 Chrome은 메뉴(⋮) → <em className="not-italic font-semibold">앱 설치</em> 또는{" "}
                <em className="not-italic font-semibold">홈 화면에 추가</em>, 아이폰 Safari는 공유 버튼 →{" "}
                <em className="not-italic font-semibold">홈 화면에 추가</em>입니다.
              </li>
              <li>공원에 가기 전에 집 근처에서 시험 촬영을 한 번 하고, 내보내기로 ZIP이 잘 나오는지 확인합니다.</li>
            </ol>
          </Section>

          <Section label="Step 2" title="현장에서 — 촬영">
            <ol className={`list-decimal ${listClass}`}>
              <li>
                <strong className="font-bold">촬영</strong> 탭에서 공원과 진출입로 이름(자동 번호 ‘입구 1, 2, …’)·구분을 고르고
                ‘진출입로 촬영’을 누릅니다. 폰 카메라가 열리고, 찍고 돌아오면 확인 화면에 사진·좌표·정확도가 뜹니다. 문제없으면
                ‘저장’.
              </li>
              <li>
                상단 <strong className="font-bold">GPS 표시</strong>가 초록(±15 m 이내)일 때 찍는 것이 좋습니다. 노랑·빨강이면
                하늘이 트인 곳에서 잠시 기다리거나, 확인 화면의 ‘지금 위치로 다시 잡기’를 누릅니다(찍은 자리에 서 있을 때만).
              </li>
              <li>
                <strong className="font-bold">기록</strong> 탭에서 목록·상세를 확인하고, 이름·구분·메모를 고치거나 삭제하고, 지도
                링크(카카오맵·구글지도·OSM)로 위치를 볼 수 있습니다.
              </li>
            </ol>
          </Section>

          <Section label="Step 3" title="촬영이 끝나면 — 내보내기">
            <p>
              <strong className="font-bold">내보내기</strong> 탭에서 ‘ZIP 만들기’를 누르면 공유(드라이브·카톡·메일)하거나 파일로 저장할 수
              있습니다. ZIP에는 다음이 들어 있습니다.
            </p>
            <div className="mt-4 divide-y divide-border border-y border-border">
              {EXPORT_FILES.map((f) => (
                <div key={f.name} className="grid gap-1 py-3 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-4">
                  <code className="font-mono text-xs text-foreground">{f.name}</code>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 border-l-2 border-accent bg-muted/40 px-4 py-3 text-sm">
              <strong className="font-bold">브라우저 데이터를 지우거나 앱을 삭제하면 기록이 사라집니다.</strong> 촬영이 끝나면 바로
              내보내 두세요.
            </p>
          </Section>

          <Section label="Notes" title="알아둘 것">
            <ul className="list-disc space-y-2 pl-5 marker:text-accent">
              <li>
                사진은 긴 변 1600 px의 JPEG로 줄여 저장합니다(설정에서 1280/2400 선택). 한 장에 대개 0.2~0.8 MB라 브라우저가 허용하는
                범위에서 수백 장은 무리가 없고, 설정 화면 아래쪽 ‘저장 공간’에서 사용량을 볼 수 있습니다.
              </li>
              <li>
                위치는 앱이 열려 있는 동안 GPS를 계속 받고, 촬영 시각에 가장 믿을 만한 값(정확도와 시간차, 이동 가능 거리를 함께
                고려)을 골라 기록합니다. 카메라 앱이 남기는 위치 정보에는 기대지 않습니다.
              </li>
              <li>
                카메라 앱으로 넘어갔다 돌아오는 사이 폰이 메모리를 회수하면 방금 찍은 사진이 확인 화면에 오지 않을 수 있습니다(입력해
                둔 공원·이름은 남습니다). 그때는 다시 촬영하면 됩니다.
              </li>
            </ul>
          </Section>

          <div className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-8">
            <OpenAppButton />
            <span className="text-sm text-muted-foreground">폰에서 열고 ‘홈 화면에 추가’까지 해 두면 현장에서 바로 쓸 수 있습니다.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
