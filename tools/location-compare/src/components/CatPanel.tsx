import { useEffect, useRef, useState } from 'react'
import {
  CAT_RADIUS_M, FIELD_RADIUS_M, PHOTO_VALID_DAYS, TIME_SLOTS, UPLOAD_ENABLED,
  addCat, addPhotoToCat, daysLeft, hasMyPhoto, liveCats, livePhotos, metersBetween, shrinkPhoto, type Cat, type CatState,
} from '../cats'
import { isEn, t } from '../i18n'

const SLOT_EN: Record<string, string> = { 새벽: 'dawn', 아침: 'morning', 낮: 'daytime', 저녁: 'evening', 밤: 'night' }
const slotName = (s: string) => (isEn ? SLOT_EN[s] ?? s : s)

// 길고양이: 현장 등록 창 + 고양이 사진 보기 창.
// 위치는 내 현재 위치(GPS)로만 정해진다 — 지도에서 찍어 넣거나 갤러리 사진을 올리는 길은 없다(사진도 카메라로 바로 찍게 한다).

type Fix = { lat: number; lng: number; acc: number }

const kb = (s: string) => Math.round((s.length * 3) / 4 / 1024)

export function CatRegister({ state, onChange, onClose }: { state: CatState; onChange: (s: CatState) => boolean; onClose: () => void }) {
  const [fix, setFix] = useState<Fix | null>(null)
  const [gps, setGps] = useState<'wait' | 'ok' | 'fail'>('wait')
  const [gpsMsg, setGpsMsg] = useState('')
  const [target, setTarget] = useState('new') // 'new' 또는 기존 고양이 id
  const [times, setTimes] = useState<string[]>([])
  const [traits, setTraits] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const locate = () => {
    setGps('wait'); setGpsMsg('')
    if (!navigator.geolocation) { setGps('fail'); setGpsMsg(t('이 기기에서는 위치를 알 수 없어요.', 'This device cannot report its location.')); return }
    navigator.geolocation.getCurrentPosition(
      (p) => { setFix({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); setGps('ok') },
      (e) => { setGps('fail'); setGpsMsg(e.code === 1 ? t('위치 권한을 허용해야 현장에서 등록할 수 있어요.', 'Allow location access to register on site.') : t('현재 위치를 찾지 못했어요. 야외에서 다시 시도해 주세요.', 'Could not find your location. Try again outdoors.')) },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }
  useEffect(locate, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const now = Date.now()
  // 내 위치 100m 안의 등록된 고양이(같은 고양이면 사진만 더한다)
  const near = fix ? liveCats(state.cats, now).filter((c) => metersBetween(fix, c) <= FIELD_RADIUS_M) : []
  const chosen = target === 'new' ? null : near.find((c) => c.id === target) ?? null
  const mine = chosen ? hasMyPhoto(chosen, state.user, now) : false
  const accBad = !!fix && fix.acc > 80

  const pick = async (f?: File) => {
    if (!f) return
    setBusy(true); setErr('')
    try { setPhoto(await shrinkPhoto(f)) } catch (e) { setPhoto(null); setErr((e as Error).message || t('사진을 읽지 못했어요.', 'Could not read the photo.')) } finally { setBusy(false) }
  }
  const toggleTime = (t: string) => setTimes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))

  const submit = () => {
    if (!fix || !photo) return
    const input = { name: '', times, traits }
    const next = chosen ? addPhotoToCat(state, chosen.id, input, photo) : addCat(state, fix, input, photo)
    if (!next) { setErr(t('이 고양이에는 이미 내 사진이 있어요(고양이 한 마리당 한 사람 한 장).', 'You already have a photo of this cat (one photo per person per cat).')); return }
    if (!onChange(next)) { setErr(t('저장 공간이 부족해요. 오래된 사진을 지우거나 다른 사진으로 시도해 주세요.', 'Out of storage. Delete old photos or try another photo.')); return }
    onClose()
  }
  const can = gps === 'ok' && !accBad && !!photo && !mine && !busy

  return (
    <div className="overlay" onClick={onClose}>
      <section className="glass drawer cat-dlg" role="dialog" aria-modal="true" aria-label={t('길고양이 현장 등록', 'Register a street cat on site')} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><div><small>FIELD ONLY</small><h2>🐈 {t('길고양이 등록', 'Add a street cat')}</h2></div><button className="close" aria-label={t('닫기', 'Close')} onClick={onClose}>×</button></div>

        {isEn ? (
          <ul className="cat-rules">
            <li>On site only — your <b>current location</b> is recorded as the cat's location (cannot be picked).</li>
            <li>Photos stay valid for <b>{PHOTO_VALID_DAYS} days (about 2 months)</b>, then drop out of the index.</li>
            <li>Each person can upload <b>one photo</b> per cat.</li>
            <li>Large photos are resized automatically (long side max 1280px, good quality).</li>
          </ul>
        ) : (
          <ul className="cat-rules">
            <li>현장에서만 — 내 <b>현재 위치</b>가 고양이 위치로 기록돼요(직접 고를 수 없음).</li>
            <li>사진은 <b>{PHOTO_VALID_DAYS}일(약 2달)</b> 동안만 유효해요. 지나면 지수에서 빠져요.</li>
            <li>한 사람이 고양이 한 마리에 <b>사진 한 장</b>만 올릴 수 있어요.</li>
            <li>큰 사진은 자동으로 줄여요(긴 변 최대 1280px · 화질 좋게).</li>
          </ul>
        )}

        <div className={'cat-gps ' + gps}>
          {gps === 'wait' && <span>{t('현재 위치 확인 중…', 'Checking your location…')}</span>}
          {gps === 'ok' && fix && <span>{t(`위치 확인됨 · 정확도 약 ${Math.round(fix.acc)}m`, `Location found · accuracy about ${Math.round(fix.acc)} m`)}{accBad ? t(' — 너무 부정확해요. 하늘이 트인 곳에서 다시 확인해 주세요.', ' — too inaccurate. Try again under open sky.') : ''}</span>}
          {gps === 'fail' && <span>{gpsMsg}</span>}
          {gps !== 'wait' && <button type="button" className="ghost" onClick={locate}>{t('위치 다시 확인', 'Check location again')}</button>}
        </div>

        {near.length > 0 && (
          <label className="cat-field">{t('이 고양이는…', 'This cat is…')}
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="new">{t('새로 만난 고양이', 'A new cat')}</option>
              {near.map((c) => <option key={c.id} value={c.id}>{t(`이미 등록된 고양이 (${Math.round(metersBetween(fix!, c))}m 거리)`, `Already registered (${Math.round(metersBetween(fix!, c))} m away)`)}{hasMyPhoto(c, state.user, now) ? t(' — 내 사진 있음', ' — has my photo') : ''}</option>)}
            </select>
          </label>
        )}
        {mine && <p className="warn-line">{t('이 고양이에는 이미 내 사진이 있어요. 새로 만난 고양이로 등록하거나 다른 고양이를 고르세요.', 'You already have a photo of this cat. Register it as a new cat or pick another one.')}</p>}

        <div className="cat-field">{t('사진', 'Photo')}
          <input ref={file} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
          <div className="cat-photo">
            {photo ? <img data-pin-nopin="true" src={photo} alt={t('등록할 고양이 사진', 'Cat photo to upload')} /> : <span className="muted">{busy ? t('사진 줄이는 중…', 'Resizing photo…') : t('카메라로 찍어 주세요', 'Take a photo with the camera')}</span>}
            <button type="button" className="ghost" onClick={() => file.current?.click()} disabled={gps !== 'ok'}>{photo ? t('다시 찍기', 'Retake') : t('사진 찍기', 'Take photo')}</button>
          </div>
          {photo && <small className="faint">{t(`줄인 크기 약 ${kb(photo)}KB`, `Resized to about ${kb(photo)} KB`)}</small>}
        </div>

        <div className="cat-field">{t('출몰 시간', 'Seen at')} <small className="faint">{t('여러 개 고를 수 있어요', 'pick any')}</small>
          <div className="chips">
            {TIME_SLOTS.map((s) => <button key={s} type="button" className={'chip' + (times.includes(s) ? ' on' : '')} aria-pressed={times.includes(s)} onClick={() => toggleTime(s)}>{slotName(s)}</button>)}
          </div>
        </div>
        <label className="cat-field">{t('특징', 'Traits')}
          <input value={traits} maxLength={80} placeholder={t('털색·무늬·성격(사람을 피함/다가옴) 등', 'Coat color, pattern, temperament (shy/friendly)…')} onChange={(e) => setTraits(e.target.value)} />
        </label>

        {err && <p className="warn-line" role="alert">{err}</p>}
        <p className="faint upload-off">{UPLOAD_ENABLED ? '' : t('서버 업로드는 아직 꺼져 있어요 — 등록한 사진과 정보는 이 브라우저에만 저장되고, 다른 사람에게는 보이지 않아요.', 'Server upload is off for now — photos and info stay in this browser only and are not visible to others.')}</p>
        <div className="pop-foot"><button className="ghost" onClick={onClose}>{t('취소', 'Cancel')}</button><button className="solid" disabled={!can} onClick={submit}>{chosen ? t('내 사진 더하기', 'Add my photo') : t('고양이 등록', 'Register cat')}</button></div>
      </section>
    </div>
  )
}

/** 후보지 반경 안 고양이 사진 보기. */
export function CatGallery({ title, cats, user, onRemoveMine, onClose, start = 0 }: { title: string; cats: Cat[]; user: string; onRemoveMine: (id: string) => void; onClose: () => void; start?: number }) {
  const [i, setI] = useState(start)
  const now = Date.now()
  const list = cats.flatMap((c) => livePhotos(c, now).map((p) => ({ c, p })))
  const cur = list[Math.min(i, list.length - 1)]
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
      else if (e.key === 'ArrowRight') setI((x) => Math.min(list.length - 1, x + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, list.length])
  return (
    <div className="overlay" onClick={onClose}>
      <section className="glass drawer cat-dlg" role="dialog" aria-modal="true" aria-label={t('길고양이 사진', 'Street-cat photos')} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head"><div><small>{title} · {t(`반경 ${CAT_RADIUS_M}m`, `within ${CAT_RADIUS_M} m`)}</small><h2>🐈 {t('길고양이 사진', 'Street-cat photos')}</h2></div><button className="close" aria-label={t('닫기', 'Close')} onClick={onClose}>×</button></div>
        {!cur ? <p className="muted">{t('유효한 사진이 없어요.', 'No valid photos.')}</p> : (
          <>
            <img data-pin-nopin="true" className="cat-big" src={cur.p.data} alt={cur.c.name || t('길고양이', 'Street cat')} />
            <div className="cat-meta">
              <span>{t('출몰 시간', 'Seen at')} {cur.c.times.length ? cur.c.times.map(slotName).join('·') : t('미입력', 'not given')}</span>
              <span>{t('특징', 'Traits')} {cur.c.traits || t('미입력', 'not given')}</span>
              <small className="faint">{t(`${new Date(cur.p.at).toLocaleDateString('ko-KR')} 등록 · 유효 ${daysLeft(cur.p, now)}일 남음`, `Added ${new Date(cur.p.at).toLocaleDateString('en-US')} · valid ${daysLeft(cur.p, now)} more days`)}{cur.p.user === user ? t(' · 내 사진', ' · my photo') : ''}</small>
            </div>
            <div className="cat-nav">
              <button className="ghost" disabled={i <= 0} onClick={() => setI(i - 1)}>{t('← 이전', '← Prev')}</button>
              <span className="muted">{Math.min(i, list.length - 1) + 1} / {list.length}</span>
              <button className="ghost" disabled={i >= list.length - 1} onClick={() => setI(i + 1)}>{t('다음 →', 'Next →')}</button>
            </div>
            {cur.p.user === user && <div className="pop-foot"><button className="danger" onClick={() => { if (confirm(t('내 사진을 지울까요?', 'Delete my photo?'))) { onRemoveMine(cur.c.id); setI(0) } }}>{t('내 사진 삭제', 'Delete my photo')}</button></div>}
          </>
        )}
      </section>
    </div>
  )
}
