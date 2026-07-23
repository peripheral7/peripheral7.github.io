// components/html-report.tsx
"use client"

import { useEffect, useRef, useState } from "react"

export function HtmlReport({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Report not found at: ${src}`)
        return res.text()
      })
      .then((html) => {
        if (cancelled || !containerRef.current) return

        const doc = new DOMParser().parseFromString(html, "text/html")
        const bodyContent = doc.body.innerHTML
        containerRef.current.innerHTML = bodyContent

        // dangerouslySetInnerHTML/innerHTML은 <script>를 실행하지 않으므로
        // 각 script를 새로 만들어 순서대로 다시 실행시켜줍니다.
        const scripts = Array.from(containerRef.current.querySelectorAll("script"))
        scripts.forEach((oldScript) => {
          const newScript = document.createElement("script")
          Array.from(oldScript.attributes).forEach((attr) =>
            newScript.setAttribute(attr.name, attr.value)
          )
          newScript.textContent = oldScript.textContent
          oldScript.replaceWith(newScript)
        })
      })
      .catch((err) => {
        console.error(err)
        setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [src])

  if (error) {
    return (
      <div className="border border-dashed border-border bg-muted/30 p-6 text-center font-mono text-sm text-muted-foreground">
        [에러] 리포트를 불러올 수 없습니다. 경로 확인: {src}
      </div>
    )
  }

  return <div ref={containerRef} className="report-embed w-full bg-white" />
}