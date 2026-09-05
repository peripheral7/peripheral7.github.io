import { TreeNode } from "./skilltree"

// 감정평가실무 퀴즈 페이지(public/reports/appraisal-practice-quiz.html)의
// 대분류(9개)·소분류 탭 구조를 그대로 미러링한다. 각 리프 노드의 id는
// 퀴즈의 sub id와 동일하게 맞춰, 추후 퀴즈 진행도와 직접 연결할 수 있게 했다.
export const sections: Record<string, { title: string; tier: number }> = {
  root: { title: "감정평가실무", tier: 0 },
  c1: { title: "1. 기초/TVM", tier: 1 },
  c2: { title: "2. 3방식", tier: 1 },
  c3: { title: "3. 임대료/임대차", tier: 1 },
  c4: { title: "4. 구분소유/지상권", tier: 1 },
  c5: { title: "5. 유형별 평가", tier: 1 },
  c6: { title: "6. 타당성/최유효", tier: 1 },
  c7: { title: "7. 목적별 평가", tier: 1 },
  c8: { title: "8. 표준지/주택", tier: 1 },
  c9: { title: "9. 보상감정평가", tier: 1 },
}

export const skillTree: TreeNode = {
  id: "root0",
  name: "감정평가실무",
  section: "root",
  children: [
    {
      id: "c1",
      name: "1. 기초/TVM",
      section: "c1",
      children: [
        { id: "basics", name: "감정평가기초", section: "c1" },
        { id: "tvm", name: "TVM", section: "c1" },
      ],
    },
    {
      id: "c2",
      name: "2. 3방식",
      section: "c2",
      children: [
        { id: "cmp", name: "비교방식", section: "c2" },
        { id: "cost", name: "원가방식", section: "c2" },
        { id: "inc", name: "수익방식", section: "c2" },
        { id: "mix", name: "3방식 병용", section: "c2" },
      ],
    },
    {
      id: "c3",
      name: "3. 임대료/임대차",
      section: "c3",
      children: [
        { id: "rent", name: "임대료 감정평가", section: "c3" },
        { id: "lease", name: "임대차 감정평가", section: "c3" },
      ],
    },
    {
      id: "c4",
      name: "4. 구분소유/지상권",
      section: "c4",
      children: [
        { id: "sec_own", name: "구분소유권", section: "c4" },
        { id: "sec_gnd", name: "구분지상권", section: "c4" },
      ],
    },
    {
      id: "c5",
      name: "5. 유형별 평가",
      section: "c5",
      spacingScale: 1.3,
      children: [
        { id: "t_land", name: "토지 / 건물", section: "c5" },
        { id: "t_mach", name: "기계기구 등", section: "c5" },
        { id: "t_fac", name: "공장 / 사업체", section: "c5" },
        { id: "t_int", name: "무형 / 기업가치", section: "c5" },
        { id: "t_sec", name: "유가증권", section: "c5" },
        { id: "t_pol", name: "오염부동산 등", section: "c5" },
      ],
    },
    {
      id: "c6",
      name: "6. 타당성/최유효",
      section: "c6",
      children: [
        { id: "feasibility", name: "타당성분석", section: "c6" },
        { id: "hbu", name: "최유효분석", section: "c6" },
      ],
    },
    {
      id: "c7",
      name: "7. 목적별 평가",
      section: "c7",
      children: [
        { id: "p_col", name: "담보 / 경매평가", section: "c7" },
        { id: "p_urb", name: "도시정비 등 평가", section: "c7" },
      ],
    },
    {
      id: "c8",
      name: "8. 표준지/주택",
      section: "c8",
      children: [
        { id: "s_land", name: "표준지", section: "c8" },
        { id: "s_house", name: "표준주택", section: "c8" },
      ],
    },
    {
      id: "c9",
      name: "9. 보상감정평가",
      section: "c9",
      spacingScale: 1.3,
      children: [
        { id: "general", name: "토지보상평가", section: "c9" },
        { id: "gb", name: "개발제한구역 보상", section: "c9" },
        { id: "repurchase", name: "환매", section: "c9" },
        { id: "obstacles", name: "지장물 보상평가", section: "c9" },
        { id: "comp_biz", name: "영업손실 보상평가", section: "c9" },
        { id: "comp_fish", name: "어업손실 보상평가", section: "c9" },
        { id: "comp_mine", name: "광업권 보상평가", section: "c9" },
        { id: "comp_life", name: "생활보상", section: "c9" },
      ],
    },
  ],
}
