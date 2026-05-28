(function () {

  const STORAGE_KEY = 'luckrush_coin_v2';
  const BET_KEY     = 'luckrush_bet_v2';

  /* ── 저장/불러오기 ── */
  let coin = (() => {
    try { const v = localStorage.getItem(STORAGE_KEY); return v !== null ? Number(v) : 10; }
    catch (e) { return 10; }
  })();

  let betAmt = (() => {
    try { const v = localStorage.getItem(BET_KEY); return v !== null ? Math.max(1, Number(v)) : 1; }
    catch (e) { return 1; }
  })();

  let spinning     = false;
  let slotSpinning = false;


const SYMBOLS = [
  '🩷',
  '💖',
  '🌷',
  '🌸',
  '7️⃣',
  '🎀'
];


  /* DOM */
  const coinText       = document.getElementById('coinText');
  const moneyEl        = document.getElementById('money');
  const betInput       = document.getElementById('betInput');
  const coinInner      = document.getElementById('coinInner');
  const drumText       = document.getElementById('drumText');
  const resultEl       = document.getElementById('result');
  const btnFront       = document.getElementById('btnFront');
  const btnBack        = document.getElementById('btnBack');
  const flashOverlay   = document.getElementById('flashOverlay');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const debtBanner     = document.getElementById('debtBanner');
  const slotDebtBanner = document.getElementById('slotDebtBanner');
  const menuBtnCoinflip = document.getElementById('menuBtnCoinflip');
  const menuBtnSlot    = document.getElementById('menuBtnSlot');
  const slotBetInput   = document.getElementById('slotBetInput');
  const slotSpinBtn    = document.getElementById('slotSpinBtn');
  const slotResultEl   = document.getElementById('slotResult');

  betInput.value     = betAmt;
  slotBetInput.value = betAmt;

function updateCoinUI() {
  const abs = Math.abs(coin).toLocaleString();
  coinText.textContent =
    coin < 0
    ? '-' + abs + ' (빚)'
    : abs;
  moneyEl.className =
    coin < 0
    ? 'debt'
    : '';
  menuBtnCoinflip.disabled =
    coin < 0;
  menuBtnSlot.disabled =
    coin < 0;

  /* 빚 탈출 시 배너 제거 */

  if (coin >= 0) {
    debtBanner.className = 'debt-banner';
    slotDebtBanner.className = 'debt-banner';
  }

}
  function saveCoin() {
    try { localStorage.setItem(STORAGE_KEY, coin); } catch (e) {}
  }

  updateCoinUI();

  /* ── 배팅 금액 저장 ── */
  betInput.addEventListener('change', () => {
    betAmt = Math.max(1, parseInt(betInput.value) || 1);
    betInput.value = betAmt;
    try { localStorage.setItem(BET_KEY, betAmt); } catch (e) {}
  });

  slotBetInput.addEventListener('change', () => {
    const v = Math.max(1, parseInt(slotBetInput.value) || 1);
    slotBetInput.value = v;
  });

  /* ── 화면 전환 ── */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  }

  window.openGame = function (gameId) {
    const inDebt = coin < 0;

    if (gameId === 'coinflip') {
      resultEl.textContent      = '';
      resultEl.className        = '';
      drumText.textContent      = '';
      coinInner.style.transform = 'rotateY(0deg)';
      debtBanner.className      = inDebt ? 'debt-banner show' : 'debt-banner';
      btnFront.disabled         = inDebt;
      btnBack.disabled          = inDebt;
    }

    if (gameId === 'slot') {
      slotResultEl.textContent  = '';
      slotResultEl.className    = '';
      slotDebtBanner.className  = inDebt ? 'debt-banner show' : 'debt-banner';
      slotSpinBtn.disabled      = inDebt;
      /* 릴 초기 위치 */
      [0,1,2].forEach(i => {
        document.getElementById('reel'+i).style.top = '0px';
      });
    }

    showScreen(gameId);
  };

  window.goMenu = function () {
    showScreen('menu');
    updateCoinUI();
  };

window.showTab = function (tab) {

  document.getElementById('tabGame-content').style.display =
    tab === 'game' ? 'block' : 'none';

  document.getElementById('tabWork-content').style.display =
    tab === 'work' ? 'block' : 'none';

  document.getElementById('tabShop-content').style.display =
    tab === 'shop' ? 'block' : 'none';

  document.getElementById('tabGame')
    .classList.toggle('active-tab', tab === 'game');

  document.getElementById('tabWork')
    .classList.toggle('active-tab', tab === 'work');

  document.getElementById('tabShop')
    .classList.toggle('active-tab', tab === 'shop');

};


  /* ════════════════════════════
     코인 플립
  ════════════════════════════ */
  const drumMessages = ['두구', '두구두구', '두구두구두구!!'];

  window.flip = function (choice) {
    if (spinning || coin < 0) return;
    const bet = Math.max(1, parseInt(betInput.value) || 1);
    betAmt = bet;
    try { localStorage.setItem(BET_KEY, betAmt); } catch (e) {}

    spinning = true;
    btnFront.disabled    = true;
    btnBack.disabled     = true;
    resultEl.textContent = '';
    resultEl.className   = '';

    let rotY = 0;
    const spinInterval = setInterval(() => {
      rotY += 60;
      coinInner.style.transform = `rotateY(${rotY}deg)`;
    }, 80);

    let drumIdx = 0;
    const msgInterval = setInterval(() => {
      if (drumIdx < drumMessages.length) drumText.textContent = drumMessages[drumIdx++];
    }, 280);

    setTimeout(() => {
      clearInterval(spinInterval);
      clearInterval(msgInterval);
      drumText.textContent = '';

      const outcome = Math.random() < 0.5 ? 'front' : 'back';
      const won     = choice === outcome;
      coinInner.style.transform = outcome === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)';

      if (won) {
        coin += bet;
        saveCoin(); updateCoinUI();
        resultEl.textContent = `성공! +${bet.toLocaleString()} ✦`;
        resultEl.className   = 'win';
        launchConfetti();
      } else {
        coin -= bet;
        saveCoin(); updateCoinUI();
        resultEl.textContent = `실패 -${bet.toLocaleString()}${coin < 0 ? '  (돈 벌러 가!)' : ''}`;
        resultEl.className   = 'lose';
        doFlash();
        if (coin < 0) {
          debtBanner.className = 'debt-banner show';
          btnFront.disabled = true;
          btnBack.disabled  = true;
        }
      }

      spinning = false;
      if (coin >= 0) { btnFront.disabled = false; btnBack.disabled = false; }
    }, 1000);
  };


/* ════════════════════════════
   슬롯머신
════════════════════════════ */

window.spinSlot = function () {

  if (slotSpinning || coin < 0) return;

  const bet =
    Math.max(
      1,
      parseInt(slotBetInput.value) || 1
    );

  /* 배팅금 먼저 차감 */

  coin -= bet;

  coin = Number(coin);

  saveCoin();
  updateCoinUI();

  slotSpinning = true;

  slotSpinBtn.disabled = true;

  slotResultEl.textContent = '';
  slotResultEl.className = '';

  /* 결과 미리 결정 */

  const finals =
    [0,1,2].map(() =>
      Math.floor(
        Math.random() * SYMBOLS.length
      )
    );

  const itemH = 100;

  [0,1,2].forEach(i => {

    const reel =
      document.getElementById('reel' + i);

    const stopAt = finals[i];

    const totalH =
      reel.querySelectorAll('.reel-item').length
      * itemH;

    const stopTime =
      500 + i * 350;

    let pos = 0;

    let elapsed = 0;

    const tick = setInterval(() => {

      elapsed += 16;

      pos = (pos + 28) % totalH;

      reel.style.top = -pos + 'px';

      if (elapsed >= stopTime) {

        clearInterval(tick);

        reel.style.top =
          -(stopAt * itemH) + 'px';

        if (i === 2) {

          setTimeout(() => {

            judgeSlot(
              bet,
              finals
            );

          }, 120);

        }

      }

    }, 16);

  });

};



function judgeSlot(bet, finals) {

  const syms =
    finals.map(f => SYMBOLS[f]);

  let mult = 0;

  /* 쓰리 */

  if (
    syms[0] === syms[1]
    &&
    syms[1] === syms[2]
  ) {

    mult =
      syms[0] === '7️⃣'
      ? 10
      : 3;

  }

  /* 투 */

  else if (

    syms[0] === syms[1]
    ||
    syms[1] === syms[2]
    ||
    syms[0] === syms[2]

  ) {

    mult = 2;

  }

  /* 성공 */

  if (mult > 0) {

    const gain =
      Math.floor(
        bet * mult
      );

    coin += gain;

    coin = Number(coin);

    saveCoin();

    updateCoinUI();

    slotResultEl.textContent =

      mult === 10

      ? `🎰 JACKPOT! +${gain.toLocaleString()}`

      : `성공! ×${mult}  +${gain.toLocaleString()} ✦`;

    slotResultEl.className = 'win';

    launchConfetti();

  }

  /* 실패 */

  else {

    saveCoin();

    updateCoinUI();

    slotResultEl.textContent =

      `실패 -${bet.toLocaleString()}`
      +
      (
        coin < 0
        ? '  (돈 벌러 가!)'
        : ''
      );

    slotResultEl.className = 'lose';

    doFlash();

    if (coin < 0) {

      slotDebtBanner.className =
        'debt-banner show';

      slotSpinBtn.disabled = true;

    }

  }

  slotSpinning = false;

  if (coin >= 0) {

    slotSpinBtn.disabled = false;

  }

}



  /* ── 실패 플래시 ── */
  function doFlash() {
    flashOverlay.style.background = 'rgba(255,30,30,0.35)';
    setTimeout(() => { flashOverlay.style.background = 'rgba(255,30,30,0)';   }, 220);
    setTimeout(() => { flashOverlay.style.background = 'rgba(255,30,30,0.2)'; }, 380);
    setTimeout(() => { flashOverlay.style.background = 'rgba(255,30,30,0)';   }, 540);
  }

  /* ── 팡파레 ── */
  function launchConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ['#ff69b4','#ff9dcc','#ffb3d9','#ff3388','#ff66aa','#ffcce6'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height * 0.4,
      r: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
      alpha: 1,
      rot: Math.random() * Math.PI * 2,
      rspeed: (Math.random() - 0.5) * 0.2
    }));

    let frame;
    function draw() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.08;
        p.rot += p.rspeed;
        if (p.y > confettiCanvas.height * 0.85) p.alpha -= 0.04;
      });
      if (alive) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    if (frame) cancelAnimationFrame(frame);
    draw();
  }




/* ════════════════════════════
   노동 시스템
════════════════════════════ */

let workStored = 0;



/* UI */

function updateWorkUI() {

  document.getElementById("storedText")
    .innerText =
      "저장된 칩: "
      + workStored.toFixed(1);

}

/* 칩 클릭 생산 */

window.mineChip = function () {

  workStored += 0.1;

  workStored =
    Math.round(workStored * 10) / 10;

  updateWorkUI();

};


window.collectWorkChip = function () {

  if (workStored <= 0) return;

  coin += workStored;

  coin =
    Math.round(coin * 10) / 10;

  saveCoin();

  updateCoinUI();

  if (coin >= 0) {

    btnFront.disabled = false;
    btnBack.disabled = false;
    slotSpinBtn.disabled = false;

    debtBanner.className = 'debt-banner';
    slotDebtBanner.className = 'debt-banner';

  }

  workStored = 0;

  updateWorkUI();

};

})();