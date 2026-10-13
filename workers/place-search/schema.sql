-- 사용량 카운터: k = "g:날짜"(전체) · "ip:해시:시각"(IP 시간당) · "ipd:해시:날짜"(IP 하루), n = 횟수, exp = 지워도 되는 시각(초)
CREATE TABLE IF NOT EXISTS usage (
  k   TEXT    PRIMARY KEY,
  n   INTEGER NOT NULL,
  exp INTEGER NOT NULL
);

-- 검색 결과 캐시(같은 검색어 7일): q = 소문자 검색어, body = 화면용 JSON, exp = 만료 시각(초)
CREATE TABLE IF NOT EXISTS cache (
  q    TEXT    PRIMARY KEY,
  body TEXT    NOT NULL,
  exp  INTEGER NOT NULL
);

-- 계산 서버(사용자 PC, cloudflared 빠른 터널) 주소: k = 'compute', url = https://….trycloudflare.com, at = 마지막 알림 시각(초)
CREATE TABLE IF NOT EXISTS relay (
  k   TEXT    PRIMARY KEY,
  url TEXT    NOT NULL,
  at  INTEGER NOT NULL
);
