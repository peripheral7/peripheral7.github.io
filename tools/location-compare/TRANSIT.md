# 대중교통 데이터 — 무엇을 어디서 받아 어떻게 쓰나

여기살까?(/WhereTo/)의 대중교통 시간·점수와 지도 경로 그림이 쓰는 자료를 한곳에 모은 개발자 문서.
점수 공식은 README 3·4절, 화면 결정은 UI-UX.md.

## 한눈에

| 무엇 | 자료(제공처) | 엔드포인트 · 함수 | 키 |
|---|---|---|---|
| 경로(어떤 버스·지하철을 어디서 타고 내리는지)·전체 시간 | **서울특별시 「대중교통환승경로 조회」**(공공데이터포털/서울 TOPIS) | `http://ws.bus.go.kr/api/rest/pathinfo/getPathInfoByBusNSub` (버스+지하철) | `SEOUL_PATHINFO_SERVICE_KEY` 또는 공용 `DATA_GO_KR_SERVICE_KEY` |
| 버스 종류(직행좌석·좌석·일반·마을 …) → 선 색 | **경기도 「정류소 조회」의 경유노선 목록** | `https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationViaRouteListv2?stationId=` → `routeTypeCd`·`routeTypeName` | `GG_BUS_STATION_SERVICE_KEY` 또는 공용 키 |
| 정류장·역까지 / 정류장에서 걷는 길(점선)과 시간 | **OpenStreetMap 보행 길찾기**(FOSSGIS 공개 OSRM) | `https://routing.openstreetmap.de/routed-foot/route/v1/driving/…?overview=full&geometries=geojson` | 없음 |
| 버스 구간 선 모양(근사) | **OpenStreetMap 자동차 길찾기**(같은 곳) | `https://routing.openstreetmap.de/routed-car/route/v1/driving/…` | 없음 |
| 지하철 구간 선 모양 | 없음 — 두 역 좌표를 직선으로 | — | — |
| 첫 대기 시간 | 추정(실측 아님) | `5 + min(7, round(직선km ÷ 6))`분 | — |

키는 `tools/location-compare/.env.local`(git 제외)에 둔다. `VITE_` 를 붙이지 않는다 — 공개 페이지는 API 를 부르지 않고 미리 잰 결과 파일만 읽는다.

## 흐름

```
scripts/paths-lib.mjs  transitPath(from, to)
  1) 서울시 환승경로 → 경로 후보 여러 개(itemList) 중 전체 시간(time) 최소 하나
  2) 그 경로의 구간(pathList)마다 buildLegs:
       도보(집 → 첫 정류장)      OSM foot 선 + 거리 ÷ 시속 4.7km
       버스                      정류장 좌표(fx,fy → tx,ty) · 노선 이름 · 종류(경기 API, 실패하면 번호로 짐작) · OSM car 선
       지하철(railLinkList 있음)  두 역 직선 · 노선 공식 색
       환승 도보(내린 곳 ≠ 탈 곳, 30m 넘을 때)
       도보(마지막 정류장 → 목적지)
  3) access/egress(정류장까지·에서 도보) = 위 도보 구간 시간, ride = 전체 − 도보 − 대기
         ↓
  src/paths.json            기본 후보지(scripts/fetch-paths.mjs, --transit 이면 대중교통만 다시)
  src/profiles-live.json    시험용 사용자 후보지(scripts/bake-profiles.mjs, --transit 이면 경로 그림 없는 길만)
  server/cache/r_*.json     검색으로 넣은 후보지(계산 서버 /route — legs 없는 옛 값은 물어볼 때 대중교통만 다시)
         ↓
  src/scoring.ts estimateTrip → Trip.legs → App(고른 후보지 → "장단점 기준" 목적지) → MapView(+ src/transitMap.ts)
```

## 저장 모양(`transit`)

```jsonc
{
  "min": 25, "ride": 9, "access": 10, "egress": 1, "wait": 5, "transfers": 1,
  "routes": ["1550-1오산", "1112수원"], "first": "망포역1번출구.디지털엠파이어1", "last": "생명과학대",
  "legs": [
    { "mode": "walk", "min": 10, "m": 772, "line": [[37.24858, 127.05555], …] },
    { "mode": "bus", "name": "1550-1", "routeId": "234000324", "type": "wide", "typeName": "직행좌석형시내버스", "typeFrom": "gg-api",
      "color": "#e60012", "from": "망포역1번출구.디지털엠파이어1", "to": "경희대정문", "line": [[…], …], "approx": true },
    { "mode": "subway", "name": "경의중앙선", "color": "#77c4a3", "from": "서강대역", "to": "한남역", "line": [[…], […]], "approx": true },
    { "mode": "walk", "min": 1, "m": 76, "line": [[…], …] }
  ]
}
```

- `line` = [위도, 경도], 소수 5자리, Douglas–Peucker 8m 로 줄임(파일 크기).
- `approx: true` = 실제 노선 궤적이 아닌 근사선. 도보 `approx` = OSM 길찾기 실패로 직선 × 1.25.
- `typeFrom` = `gg-api`(경기 API 로 확인) / `guess`(번호 모양으로 짐작).

## 지도 표시(`src/transitMap.ts`, `MapView.tsx`)

- **언제**: 고른 후보지 → 지도 위 "장단점 기준" 목적지. 그 목적지가 도보 10분 안이라 대중교통을 빼는 곳(`transitSkipped`)이거나, 경로를 못 찾은 곳(`transit: null` → 추정)은 예전처럼 점선 직선만.
- **도보** = 회색 점(둥근 끝 짧은 대시). **버스·지하철** = 노선 색 실선 + 흰 테두리.
- **정류장·역** = 노선 색 테두리의 흰 점 + 이름표: 타는 곳 `🚌 노선 · 정류장 이름 · 도보 N분`(앞 지점에서 걸어오는 시간), 환승은 "환승", 마지막 내리는 곳 `하차 · 정류장 · 목적지까지 도보 N분`.
- 지도 왼쪽 아래 한 줄 요약: `🚌 학교까지 대중교통 25분 · 도보 10분 → 1550-1 → 1112 → 도보 1분`.

### 선 색

| 종류(`type`) | 색 | 해당 |
|---|---|---|
| `wide` | 빨강 `#e60012` | 경기 직행좌석(11)·광역급행(14, M버스)·경기순환(16)·농어촌 직행좌석(21), 서울 광역(9xxx), G·M 으로 시작 |
| `seat` | 파랑 `#0068b7` | 경기 좌석(12·22) |
| `city` | 초록 `#2fa84f` | 경기 일반 시내(13·15·23) |
| `village` | 연두 `#8cc63f` | 마을(30), 서울 "마포08" 꼴 |
| `trunk` | 파랑 `#3d5bab` | 서울 간선(3자리) |
| `branch` | 초록 `#3fa535` | 서울 지선(4자리) |
| `circle` | 노랑 `#f2a900` | 서울 순환(2자리) |
| `night` | 남색 `#26346b` | N버스 |
| `airport` · `intercity` · `other` | 갈색 · 보라 · 회색 | 공항(51~53, 6xxx)·시외(41~43)·그 밖 |

지하철은 수도권 전철 공식 노선 색(`SUBWAY_COLORS`, 1~9호선·수인분당·신분당·경의중앙·공항철도 등).
서울 버스는 서울시 노선 API(`busRouteInfo`) 키가 없어 번호 모양으로 짐작한다(아래 "더 정확히 하려면").

## 한계

1. **버스 선은 근사**: 탄 정류장 → 내린 정류장을 자동차 최단 길로 이은 것. 실제 노선이 돌아가는 곳(아파트 단지 안·일방통행)과 다를 수 있다. 정류장 위치·이름·노선은 정확.
2. **지하철은 직선**: 환승경로 응답의 `railLinkList` 에는 구간 번호만 있고 좌표가 없다.
3. **일부 구간은 경로 없음**: 서울시 API 가 수원 → 분당, 아주대·경기대·연세대 쪽 다수 쌍에 "XML Parsing Error" — 그 길은 추정 시간만(지도엔 점선 직선).
4. **대기는 추정**: 배차 간격·실시간 도착은 아직 안 씀. 경기 버스도착(`busarrivalservice`)은 키로 호출 확인됨(실시간이라 고정 점수엔 부적합).
5. **시간표 없음**: 응답 `time` 은 시간대와 무관한 한 값.
6. 2026-10-14 다시 잴 때 정류장까지 도보가 직선 × 1.25 → OSM 보행 길 거리로 바뀌어 몇 분씩 달라졌다(예: 영통역 청명남로 → 수원가정법원 5 → 8분, 경희대 서천동로 → 경희대 20 → 24분).

## 더 정확히 하려면(키 신청 필요)

- **경기도 「버스노선 조회」**(`https://apis.data.go.kr/6410000/busrouteservice/v2`): `getBusRouteLineListv2`(노선 궤적 좌표)·`getBusRouteStationListv2`(정류장 순서·좌표)로 실제 노선 선을 탄 정류장~내린 정류장만 잘라 그릴 수 있다. 지금 공용 키는 "등록되지 않은 서비스키"(2026-10-14 확인) — data.go.kr 에서 활용 신청하면 같은 키로 열린다.
- **서울시 「노선정보조회」**(`http://ws.bus.go.kr/api/rest/busRouteInfo` `getRouteInfo`·`getRoutePath`): 서울 버스 종류(routeType)와 궤적. 지금 키로 401.
- 지하철 궤적: OSM `route=subway` 관계(Overpass)나 국가철도공단 노선 공간자료로 역 사이 선을 그릴 수 있다.
- 길찾기 자체를 직접 하려면 README 3절 "대중교통 길찾기 알고리즘 검토"(GTFS + OpenTripPlanner 2).

## 다시 재는 법(이 PC 에서)

```
node scripts/fetch-paths.mjs --transit      # 기본 후보지, 대중교통만
node scripts/bake-profiles.mjs --transit    # 시험용 사용자, 경로 그림 없는 길만
npm run build                               # → public/WhereTo
```

계산 서버(`server/analyze-server.mjs`)는 같은 `paths-lib.mjs` 를 쓰므로 서버를 다시 켜면 새 후보지도 경로 그림이 붙는다.
