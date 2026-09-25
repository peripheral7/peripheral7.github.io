-- 문서 스냅샷 테이블: (id, rev)가 키. 최신 rev가 현재 값이고, 최근 60개 리비전만 남긴다(src/index.js).
CREATE TABLE IF NOT EXISTS docs (
  id         TEXT    NOT NULL,
  rev        INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  device     TEXT,
  size       INTEGER NOT NULL,
  data       TEXT    NOT NULL,
  PRIMARY KEY (id, rev)
);
