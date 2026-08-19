import { TreeNode } from "./skilltree"

export const sections: Record<string, { title: string; tier: number }> = {
  root: { title: "감정평가 실무", tier: 0 },
  fundamentals: { title: "기초 및 기본 원리", tier: 1 },
  approaches: { title: "감정평가 3방식", tier: 1 },
  purpose: { title: "목적별 감정평가", tier: 1 },
  standard: { title: "표준지 및 표준주택", tier: 1 }, // 새로 추가된 섹션
  compensation: { title: "보상 감정평가", tier: 1 },
}

export const skillTree: TreeNode = {
  id: "root0",
  name: "감정평가 실무",
  section: "root",
  children: [
    {
      id: "f0",
      name: "기초 및 기본 원리",
      section: "fundamentals",
      children: [
        { id: "f1", name: "감정평가기초", section: "fundamentals" },
        { id: "f2", name: "화폐의 시간가치", section: "fundamentals" },
      ],
    },
    {
      id: "a0",
      name: "감정평가 3방식",
      section: "approaches",
      children: [
        {
          id: "a1",
          name: "비교방식",
          section: "approaches",
          children: [
            { id: "a1a", name: "공시지가기준법", section: "approaches" },
            { id: "a1b", name: "거래사례비교법", section: "approaches" },
          ],
        },
        {
          id: "a2",
          name: "원가방식",
          section: "approaches",
          children: [
            {
              id: "a2a",
              name: "건물의 원가법",
              section: "approaches",
              children: [
                { id: "a2a1", name: "분해법", section: "approaches" },
              ],
            },
            {
              id: "a2b",
              name: "토지의 원가법",
              section: "approaches",
              children: [
                { id: "a2c", name: "개발법", section: "approaches" },
              ],
            },
          ],
        },
        {
          id: "a3",
          name: "수익방식 및 임대료 평가",
          section: "approaches",
          children: [
            {
              id: "a3a",
              name: "수익환원법",
              section: "approaches",
              children: [
                {
                  id: "a3f",
                  name: "할인현금수지분석법",
                  section: "approaches",
                  children: [
                    { id: "a3c", name: "타당성분석(환원이율·IRR)", section: "approaches" },
                  ],
                },
                { id: "a3g", name: "토지잔여법", section: "approaches" },
              ],
            },
            { id: "a3b", name: "임대사례비교법", section: "approaches" },
            { id: "a3d", name: "적산법(임대료, 원가방식)", section: "approaches" },
            { id: "a3e", name: "임대차평가", section: "approaches" },
          ],
        },
      ],
    },
    {
      id: "t0",
      name: "물건별 감정평가",
      section: "property",
      children: [
        {
          id: "t1",
          name: "복합부동산 및 집합건물",
          section: "property",
          children: [
            {
              id: "t1a",
              name: "토지건물 일괄평가",
              section: "property",
              children: [
                { id: "t1a1", name: "창고평가", section: "property" },
              ],
            },
            { id: "t1b", name: "구분건물감정평가", section: "property" },
          ],
        },
        {
          id: "t2",
          name: "특수토지 및 권리",
          section: "property",
          spacingScale: 1.3,
          children: [
            {
              id: "t2a",
              name: "지상권",
              section: "property",
              children: [
                { id: "t2c", name: "구분지상권 설정토지", section: "property" },
              ],
            },
            { id: "t2b", name: "도시계획시설 저촉토지 평가", section: "property" },
            { id: "t2d", name: "둘 이상의 용도지역에 걸치는 토지평가", section: "property" },
          ],
        },
        {
          id: "t3",
          name: "기업가치 및 동산·무형자산",
          section: "property",
          spacingScale: 1.3,
          children: [
            { id: "t3a", name: "기업가치평가", section: "property" },
            { id: "t3b", name: "지식재산권", section: "property" },
            { id: "t3c", name: "기계기구평가", section: "property" },
            { id: "t3d", name: "영업권", section: "property" },
          ],
        },
      ],
    },
    {
      id: "p0",
      name: "목적별 감정평가",
      section: "purpose",
      children: [
        {
          id: "p1",
          name: "일반 및 특수 목적",
          section: "purpose",
          children: [
            {
              id: "p1a",
              name: "오피스 매입에 따른 감정평가",
              section: "purpose",
              children: [
                { id: "p1a1", name: "매후환대차평가", section: "purpose" },
                { id: "p1a2", name: "최유효이용 분석", section: "purpose" },
              ],
            },
            { id: "p1bc", name: "담보·경매평가", section: "purpose" },
            {
              id: "p1d",
              name: "권리금감정평가",
              section: "purpose",
              children: [
                {
                  id: "p1e",
                  name: "오염부동산평가(스티그마)",
                  section: "purpose",
                  children: [
                    { id: "p1f", name: "개발부담금 산정평가", section: "purpose" },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "c1a",
          name: "사업유형별 토지보상평가",
          section: "compensation",
          children: [
            { id: "c1a1", name: "재개발사업", section: "compensation" },
            { id: "c1a2", name: "재건축사업", section: "compensation" },
            { 
              id: "c1a3", 
              name: "도시개발사업", 
              section: "compensation",
              children: [
                { id: "c1a4", name: "가로주택사업", section: "compensation" },
                { id: "c1a5", name: "국공유지처분목적감정평가", section: "compensation" },
              ]
            },
          ],
        },
      ],
    },
    // 새로 추가된 '표준지공시지가 및 표준주택' 노드
    {
      id: "s0",
      name: "표준지공시지가 및 표준주택",
      section: "standard",
    },
    {
      id: "c0",
      name: "보상 감정평가",
      section: "compensation",
      children: [
        {
          id: "c1",
          name: "토지 보상",
          section: "compensation",
          children: [
            {
              id: "c1b",
              name: "특수토지 보상평가",
              section: "compensation",
              children: [
                { id: "c1b1", name: "미지급용지 평가", section: "compensation" },
                { id: "c1b2", name: "무허가건축물 평가", section: "compensation" },
                { id: "c1b3", name: "불법형질변경토지 평가", section: "compensation" },
                { id: "c1b5", name: "도로부지, 도수로부지와 구거부지 등", section: "compensation" },
                { id: "c1b6", name: "소유권 외의 권리의 목적이 되고 있는 토지 등", section: "compensation" },
              ],
            },
            {
              id: "c1c",
              name: "그 밖의 토지에 관한 평가",
              section: "compensation",
              children: [
                { id: "c1c1", name: "토지사용료(및 지하사용료)", section: "compensation" },
                { id: "c1c2", name: "송전선로부지 등의 보상", section: "compensation" },
                { id: "c1c3", name: "개간비", section: "compensation" },
                { id: "c1c4", name: "잔여지", section: "compensation" },
                { id: "c1c5", name: "환매토지", section: "compensation" },
              ],
            },
          ],
        },
        {
          id: "c2",
          name: "지장물 및 권리 보상",
          section: "compensation",
          children: [
            { id: "c2a", name: "지장물보상감정평가", section: "compensation" },
            {
              id: "c2b",
              name: "영업손실보상",
              section: "compensation",
              children: [
                { id: "c2b1", name: "어업권", section: "compensation" },
              ],
            },
          ],
        },
      ],
    },
  ],
}