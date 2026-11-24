/* 학습자료 간단 잠금. /study/ 아래 모든 HTML 의 <head> 에서 <script src="/study/gate.js"></script> 로 부른다.
   비밀번호가 맞으면 이 브라우저(localStorage)에 기억하고 다시 묻지 않는다.
   가볍게 막는 용도일 뿐이다 — 비밀번호가 이 파일에 그대로 있고, PDF·이미지 주소를 직접 열면 막지 못한다.
   file:// 로 열 때(scripts/quiz-to-pdf.mjs 의 PDF 생성)는 잠그지 않는다. */
(function () {
  var PASS = "0000", KEY = "study-gate-ok";
  if (location.protocol === "file:") return;
  try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}

  var root = document.documentElement;
  root.classList.add("study-lock");
  var css = document.createElement("style");
  css.textContent =
    "html.study-lock body > *:not(#study-gate){display:none !important}" +
    "#study-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:16px;background:#f6f7f9;color:#0f1115;" +
    "font:15px/1.5 Pretendard,system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}" +
    "#study-gate form{width:min(18rem,100%);display:grid;gap:10px;padding:22px 20px;background:#fff;border:1px solid #e7e9ee;border-radius:14px;box-shadow:0 1px 2px rgba(16,24,40,.06)}" +
    "#study-gate b{font-size:17px}" +
    "#study-gate input{height:40px;padding:0 12px;font:inherit;font-size:16px;letter-spacing:.2em;border:1px solid #d9dce3;border-radius:9px;background:#fff;color:inherit}" +
    "#study-gate button{height:40px;font:inherit;font-weight:600;color:#fff;background:#0f1115;border:0;border-radius:9px;cursor:pointer}" +
    "#study-gate p{margin:0;min-height:1.5em;font-size:13px;color:#c0392b}";
  (document.head || root).appendChild(css);

  function mount() {
    var box = document.createElement("div");
    box.id = "study-gate";
    box.innerHTML =
      '<form><b>학습자료</b>' +
      '<input type="password" inputmode="numeric" autocomplete="off" placeholder="비밀번호" aria-label="비밀번호">' +
      '<button type="submit">들어가기</button><p role="alert"></p></form>';
    document.body.appendChild(box);
    var input = box.querySelector("input"), msg = box.querySelector("p");
    // 슬라이드 덱·퀴즈의 단축키(→, L, F …)가 입력 중에 먹지 않게 막는다.
    ["keydown", "keyup", "keypress"].forEach(function (t) {
      box.addEventListener(t, function (e) { e.stopPropagation(); });
    });
    box.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      if (input.value === PASS) {
        try { localStorage.setItem(KEY, "1"); } catch (err) {}
        // 가려진 채로 크기를 잰 덱이 있을 수 있으니 새로 불러온다. 저장이 막힌 브라우저면 그냥 연다.
        var saved = false;
        try { saved = localStorage.getItem(KEY) === "1"; } catch (err) {}
        if (saved) location.reload();
        else { root.classList.remove("study-lock"); box.remove(); window.dispatchEvent(new Event("resize")); }
      } else {
        msg.textContent = "비밀번호가 맞지 않습니다.";
        input.value = ""; input.focus();
      }
    });
    input.focus();
  }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
})();
