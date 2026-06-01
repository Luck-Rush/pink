(function () {

  /* ════════════════════════════
     상수 & 저장 키
  ════════════════════════════ */
  const STORAGE_KEY = 'luckrush_coin_v2';
  const BET_KEY     = 'luckrush_bet_v2';
  const SYMBOLS     = ['🩷', '💖', '🌷', '🌸', '7️⃣', '🎀'];

  /* ════════════════════════════
     상태 변수
  ════════════════════════════ */
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
  let autoMiner    = false;
  let workStored   = 0;

  /* ════════════════════════════
     DOM 참조
  ════════════════════════════ */
  const coinText        = document.getElementById('coinText');
  const moneyEl         = document.getElementById('money');
  const betInput        = document.getElementById('betInput');
  const coinInner       = document.getElementById('coinInner');
  const drumText        = document.getElementById('drumText');
  const resultEl        = document.getElementById('result');
  const btnFront        = document.getElementById('btnFront');
  const btnBack         = document.getElementById('btnBack');
  const flashOverlay    = document.getElementById('flashOverlay');
  const confettiCanvas  = document.getElementById('confettiCanvas');
  const debtBanner      = document.getElementById('debtBanner');
  const slotDebtBanner  = document.getElementById('slotDebtBanner');
  const menuBtnCoinflip = document.getElementById('menuBtnCoinflip');
  const menuBtnSlot     = document.getElementById('menuBtnSlot');
  const slotBetInput    = document.getElementById('slotBetInput');
  const slotSpinBtn     = document.getElementById('slotSpinBtn');
  const slotResultEl    = document.getElementById('slotResult');

  /* 초기값 반영 */
  betInput.value     = betAmt;
  slotBetInput.value = betAmt;

  /* ════════════════════════════
     저장
  ════════════════════════════ */
  function saveCoin() {
    try { localStorage.setItem(STORAGE_KEY, coin); } catch {}
  }

  function saveBet() {
    try { localStorage.setItem(BET_KEY, betAmt); } catch {}
  }

  /* ════════════════════════════
     UI 업데이트
  ════════════════════════════ */
  function updateCoinUI() {
    const abs = Math.abs(coin).toLocaleString();
    coinText.textContent = coin < 0 ? '-' + abs + ' (빚)' : abs;
    moneyEl.className    = coin < 0 ? 'debt' : '';

    const inDebt = coin < 0;
    menuBtnCoinflip.disabled = inDebt;
    menuBtnSlot.disabled     = inDebt;
    debtBanner.classList.toggle('show', inDebt);
    slotDebtBanner.classList.toggle('show', inDebt);
  }

  function updateWorkUI() {
    document.getElementById('storedText').innerText = '모은 칩: ' + workStored.toFixed(1);
  }

  updateCoinUI();
  updateWorkUI();

  /* ════════════════════════════
     배팅 입력
  ════════════════════════════ */
  betInput.addEventListener('change', () => {
    betAmt = Math.max(1, parseInt(betInput.value) || 1);
    betInput.value = betAmt;
    saveBet();
  });

  slotBetInput.addEventListener('change', () => {
    betAmt = Math.max(1, parseInt(slotBetInput.value) || 1);
    slotBetInput.value = betAmt;
    saveBet();
  });

  /* ════════════════════════════
     화면 전환
  ════════════════════════════ */
  window.showScreen = function (id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
  };

  window.goMenu = function () {
    showScreen('menu');
    updateCoinUI();
  };

  window.openGame = function (name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name).classList.add('active');
  };

  /* ════════════════════════════
     탭 전환
  ════════════════════════════ */
  window.showTab = function (name) {
    ['game', 'work', 'shop'].forEach(t => {
      const key = t.charAt(0).toUpperCase() + t.slice(1);
      document.getElementById('tab' + key + '-content').style.display = 'none';
      document.getElementById('tab' + key).classList.remove('active-tab');
    });

    const selKey = name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById('tab' + selKey + '-content').style.display = 'block';
    document.getElementById('tab' + selKey).classList.add('active-tab');
  };

  /* ════════════════════════════
     코인플립
  ════════════════════════════ */
  const drumMessages = ['두구', '두구두구', '두구두구두구'];

  window.flip = function (choice) {
    if (spinning || coin < 0) return;

    const bet = Math.max(1, parseInt(betInput.value) || 1);
    betAmt = bet;
    saveBet();

    spinning = true;
    btnFront.disabled = true;
    btnBack.disabled  = true;
    resultEl.textContent = '';
    resultEl.className   = '';

    let rotY = 0;
    const spinInterval = setInterval(() => {
      rotY += 60;
      coinInner.style.transform = `rotateY(${rotY}deg)`;
    }, 80);

    let i = 0;
    const drumInterval = setInterval(() => {
      if (i < drumMessages.length) drumText.textContent = drumMessages[i++];
    }, 280);

    setTimeout(() => {
      clearInterval(spinInterval);
      clearInterval(drumInterval);

      const outcome = Math.random() < 0.2 ? 'front' : 'back';
      const won = choice === outcome;

      coinInner.style.transform =
        outcome === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)';

      if (won) {
        coin += bet;
        resultEl.textContent = `성공 +${bet.toLocaleString()}`;
        resultEl.className   = 'win';
        launchConfetti();
      } else {
        coin -= bet;
        resultEl.textContent = `실패 -${bet.toLocaleString()}`;
        resultEl.className   = 'lose';
        doFlash();
      }

      saveCoin();
      updateCoinUI();
      spinning = false;

      if (coin >= 0) {
        btnFront.disabled = false;
        btnBack.disabled  = false;
      }
    }, 1000);
  };

  /* ════════════════════════════
     슬롯머신
  ════════════════════════════ */
  window.spinSlot = function () {
    if (slotSpinning || coin < 0) return;

    const bet = Math.max(1, parseInt(slotBetInput.value) || 1);
    betAmt = bet;
    saveBet();

    coin -= bet;
    saveCoin();
    updateCoinUI();

    slotSpinning = true;
    slotSpinBtn.disabled    = true;
    slotResultEl.textContent = '';
    slotResultEl.className   = '';

    const finals = [0, 1, 2].map(() => Math.floor(Math.random() * SYMBOLS.length));
    const itemH  = 100;

    [0, 1, 2].forEach(i => {
      const reel   = document.getElementById('reel' + i);
      const totalH = reel.children.length * itemH;

      let pos     = 0;
      let elapsed = 0;
      const stopTime = 500 + i * 350;

      const tick = setInterval(() => {
        elapsed += 16;
        pos = (pos + 28) % totalH;
        reel.style.top = -pos + 'px';

        if (elapsed >= stopTime) {
          clearInterval(tick);
          reel.style.top = -(finals[i] * itemH) + 'px';

          if (i === 2) {
            setTimeout(() => judgeSlot(bet, finals), 120);
          }
        }
      }, 16);
    });
  };

  function judgeSlot(bet, finals) {
    const syms = finals.map(f => SYMBOLS[f]);
    let mult = 0;

    if (syms[0] === syms[1] && syms[1] === syms[2]) {
      mult = syms[0] === '7️⃣' ? 10 : 3;
    } else if (syms[0] === syms[1] || syms[1] === syms[2] || syms[0] === syms[2]) {
      mult = 2;
    }

    if (mult > 0) {
      const gain = Math.floor(bet * mult);
      coin += gain;
      slotResultEl.textContent = mult === 10
        ? `🎰 JACKPOT! +${gain.toLocaleString()}`
        : `성공 ×${mult} +${gain.toLocaleString()}`;
      slotResultEl.className = 'win';
      launchConfetti();
    } else {
      slotResultEl.textContent = `실패 -${bet.toLocaleString()}`;
      slotResultEl.className   = 'lose';
      doFlash();
    }

    saveCoin();
    updateCoinUI();
    slotSpinning         = false;
    slotSpinBtn.disabled = coin < 0;
  }

  /* ════════════════════════════
     노동 시스템
  ════════════════════════════ */
  window.mineChip = function () {
    workStored = Math.round((workStored + 0.1) * 10) / 10;
    updateWorkUI();
  };

  window.collectWorkChip = function () {
    if (workStored <= 0) return;

    coin = Math.round((coin + workStored) * 10) / 10;
    saveCoin();
    updateCoinUI();

    if (coin >= 0) {
      btnFront.disabled        = false;
      btnBack.disabled         = false;
      slotSpinBtn.disabled     = false;
    }

    workStored = 0;
    updateWorkUI();
  };

  /* ════════════════════════════
     상점 — 자동 클릭 구매
  ════════════════════════════ */
  window.buyAutoMiner = function () {
    if (autoMiner) {
      alert('이미 구매했어요!');
      return;
    }
    if (coin < 100000000) {
      alert('칩이 부족해요!');
      return;
    }

    coin -= 100000000;
    saveCoin();
    updateCoinUI();

    autoMiner = true;
    const btn = document.getElementById('autoMinerBtn');
    btn.disabled  = true;
    btn.innerText = '구매 완료';

    /* 1초당 1칩 자동 생산 */
    setInterval(() => {
      workStored = Math.round((workStored + 1) * 10) / 10;
      updateWorkUI();
    }, 1000);

    alert('자동 클릭을 구매했어요!');
  };

  /* ════════════════════════════
     효과
  ════════════════════════════ */
  function doFlash() {
    flashOverlay.style.background = 'rgba(255,30,30,0.35)';
    setTimeout(() => { flashOverlay.style.background = 'rgba(255,30,30,0)'; }, 200);
  }

  function launchConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors    = ['#ff69b4', '#ff9dcc', '#ffb3d9', '#ff3388', '#ff66aa'];
    const particles = Array.from({ length: 80 }, () => ({
      x:     Math.random() * confettiCanvas.width,
      y:     Math.random() * confettiCanvas.height * 0.4,
      r:     Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx:    (Math.random() - 0.5) * 4,
      vy:    Math.random() * 3 + 1,
      alpha: 1
    }));

    function draw() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.alpha <= 0) return;
        alive = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.fillRect(p.x, p.y, p.r, p.r);
        p.x    += p.vx;
        p.y    += p.vy;
        p.alpha -= 0.02;
      });

      if (alive) requestAnimationFrame(draw);
    }

    draw();
  }

  /* ════════════════════════════
     키보드 단축키 (스페이스 → 칩 채굴)
  ════════════════════════════ */
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      window.mineChip();
    }
  });

})();