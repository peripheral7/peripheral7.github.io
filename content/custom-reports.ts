// 게시판 글 id → 그 글 페이지(/gallery/[id])에 그릴 전용 보고서 컴포넌트.
import { ParkHedonicReport } from "@/components/reports/park-hedonic"

export const customReportsByPostId: Record<string, React.ComponentType> = {
  "01-park-hedonic": ParkHedonicReport,
}
