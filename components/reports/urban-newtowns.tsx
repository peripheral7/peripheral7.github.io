import { ParkCapitalizationReport } from "@/components/reports/park-capitalization"
import { SimplePostHeader } from "@/components/simple-post-header"
import { urbanNewtownsMeta } from "@/content/reports/urban-newtowns"

export function UrbanNewtownsReport() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SimplePostHeader
        eyebrow={urbanNewtownsMeta.eyebrow}
        title={urbanNewtownsMeta.title}
        subtitle={urbanNewtownsMeta.subtitle}
        tags={urbanNewtownsMeta.tags}
      />

      <div className="mx-auto max-w-4xl px-4 pb-20">
        <div className="mt-10">
          <ParkCapitalizationReport />
        </div>
      </div>
    </div>
  )
}
