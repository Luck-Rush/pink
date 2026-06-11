(function () {

  /* ════════════════════════════
     저장 키
  ════════════════════════════ */
  const STORAGE_KEY      = 'luckrush_coin_v2';
  const BET_KEY          = 'luckrush_bet_v2';
  const AUTOMINER_KEY    = 'luckrush_autominer';
  const PET_HATS_KEY     = 'luckrush_pet_hats';
  const PET_EQUIPPED_KEY = 'luckrush_pet_equipped';
  const PET_LIST_KEY     = 'luckrush_pet_list';
  const PET_ACTIVE_KEY   = 'luckrush_pet_active';

  const SYMBOLS = ['🩷', '💖', '🌷', '🌸', '7️⃣', '🎀'];

  /* ════════════════════════════
     상태 로드
  ════════════════════════════ */
  function loadJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  let coin        = loadJSON(STORAGE_KEY, 10);
  let betAmt      = Math.max(1, loadJSON(BET_KEY, 1));
  let spinning    = false;
  let slotSpinning= false;
  let autoMiner   = loadJSON(AUTOMINER_KEY, false);
  let workStored  = 0;

  // 펫 뽑기 목록 (보유)
  let ownedPets   = loadJSON(PET_LIST_KEY, []);
  // 현재 활성 펫 index
  let activePetIdx= loadJSON(PET_ACTIVE_KEY, -1);
  // 보유 모자 목록
  let ownedHats   = loadJSON(PET_HATS_KEY, []);
  // 장착 모자
  let equippedHat = loadJSON(PET_EQUIPPED_KEY, null);

  /* ════════════════════════════
     펫 & 모자 데이터
  ════════════════════════════ */
  const PET_POOL = [
    { id:'cat',    name:'냥이',    emoji:'🐱', rarity:'커먼',   color:'#ffcce0' },
    { id:'dog',    name:'멍멍이',  emoji:'🐶', rarity:'커먼',   color:'#ffd9a8' },
    { id:'bunny',  name:'토끼',    emoji:'🐰', rarity:'커먼',   color:'#d4f0ff' },
    { id:'fox',    name:'여우',    emoji:'🦊', rarity:'레어',   color:'#ffe0b2' },
    { id:'wolf',   name:'늑대',    emoji:'🐺', rarity:'레어',   color:'#dce3ff' },
    { id:'bear',   name:'곰돌이',  emoji:'🐻', rarity:'레어',   color:'#c8f7c5' },
    { id:'dragon', name:'드래곤',  emoji:'🐲', rarity:'에픽',   color:'#e8d5ff' },
    { id:'unicorn',name:'유니콘',  emoji:'🦄', rarity:'에픽',   color:'#ffe4f7' },
    { id:'phoenix',name:'불사조',  emoji:'🦅', rarity:'레전더리',color:'#fff4c2' },
  ];

  const RARITY_WEIGHTS = { '커먼':50, '레어':30, '에픽':15, '레전더리':5 };

  const HAT_SHOP = [
    { id:'top',    name:'탑햇',     emoji:'🎩', price: 200 },
    { id:'party',  name:'파티햇',   emoji:'🎉', price: 150 },
    { id:'crown',  name:'왕관',     emoji:'👑', price: 500 },
    { id:'cap',    name:'야구모자', emoji:'🧢', price: 120 },
    { id:'witch',  name:'마녀모자', emoji:'🧙', price: 300 },
    { id:'santa',  name:'산타햇',   emoji:'🎅', price: 250 },
  ];

  function rollPet() {
    const pool = [];
    PET_POOL.forEach(p => {
      const w = RARITY_WEIGHTS[p.rarity] || 1;
      for (let i = 0; i < w; i++) pool.push(p);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /* ════════════════════════════
     저장
  ════════════════════════════ */
  function saveCoin()    { saveJSON(STORAGE_KEY, coin); }
  function saveBet()     { saveJSON(BET_KEY, betAmt); }
  function saveShopData(){
    saveJSON(AUTOMINER_KEY,    autoMiner);
    saveJSON(PET_HATS_KEY,     ownedHats);
    saveJSON(PET_EQUIPPED_KEY, equippedHat);
    saveJSON(PET_LIST_KEY,     ownedPets);
    saveJSON(PET_ACTIVE_KEY,   activePetIdx);
  }

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

  betInput.value     = betAmt;
  slotBetInput.value = betAmt;

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

  function showToast(msg, type = 'info') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = 'toast show toast-' + type;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /* ════════════════════════════
     배팅 검증
  ════════════════════════════ */
  function validateBet(inputEl) {
    const val = Math.max(1, parseInt(inputEl.value) || 1);
    inputEl.value = val;
    if (val > coin) {
      showToast('배팅 칩이 너무 많습니다!', 'warn');
      const clamped = Math.max(1, coin);
      inputEl.value = clamped;
      return clamped;
    }
    return val;
  }

  betInput.addEventListener('change', () => {
    betAmt = validateBet(betInput);
    slotBetInput.value = betAmt;
    saveBet();
  });
  slotBetInput.addEventListener('change', () => {
    betAmt = validateBet(slotBetInput);
    betInput.value = betAmt;
    saveBet();
  });

  updateCoinUI();
  updateWorkUI();

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

    if (name === 'blackjack') {
      document.getElementById('bjResult').textContent    = '';
      document.getElementById('playerCards').innerHTML   = '';
      document.getElementById('dealerCards').innerHTML   = '';
      document.getElementById('playerScore').textContent = '';
      document.getElementById('dealerScore').textContent = '';
      document.getElementById('bjHitBtn').disabled       = true;
      document.getElementById('bjStandBtn').disabled     = true;
    }
    if (name === 'pet') {
      renderPetScreen();
    }
  };

  /* ════════════════════════════
     탭 전환
  ════════════════════════════ */
  window.showTab = function (name) {
    ['game','work','shop'].forEach(t => {
      const key = t.charAt(0).toUpperCase() + t.slice(1);
      document.getElementById('tab' + key + '-content').style.display = 'none';
      document.getElementById('tab' + key).classList.remove('active-tab');
    });
    const selKey = name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById('tab' + selKey + '-content').style.display = 'block';
    document.getElementById('tab' + selKey).classList.add('active-tab');

    if (name === 'shop') renderShop();
  };

  /* ════════════════════════════
     코인플립
  ════════════════════════════ */
  const drumMessages = ['두구', '두구두구', '두구두구두구'];

  window.flip = function (choice) {
    if (spinning || coin < 0) return;

    const bet = validateBet(betInput);
    if (bet > coin) return;
    betAmt = bet; saveBet();

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

      const outcome = Math.random() < 0.5 ? 'front' : 'back';
      const won     = choice === outcome;

      coinInner.style.transform = outcome === 'front' ? 'rotateY(0deg)' : 'rotateY(180deg)';

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

    const bet = validateBet(slotBetInput);
    if (bet > coin) return;
    betAmt = bet; saveBet();

    coin -= bet;
    saveCoin();
    updateCoinUI();

    slotSpinning = true;
    slotSpinBtn.disabled     = true;
    slotResultEl.textContent = '';
    slotResultEl.className   = '';

    const finals = [0,1,2].map(() => Math.floor(Math.random() * SYMBOLS.length));
    const itemH  = 100;

    [0,1,2].forEach(i => {
      const reel   = document.getElementById('reel' + i);
      const totalH = reel.children.length * itemH;
      let pos = 0, elapsed = 0;
      const stopTime = 500 + i * 350;

      const tick = setInterval(() => {
        elapsed += 16;
        pos = (pos + 28) % totalH;
        reel.style.top = -pos + 'px';
        if (elapsed >= stopTime) {
          clearInterval(tick);
          reel.style.top = -(finals[i] * itemH) + 'px';
          if (i === 2) setTimeout(() => judgeSlot(bet, finals), 120);
        }
      }, 16);
    });
  };

  function judgeSlot(bet, finals) {
    const syms = finals.map(f => SYMBOLS[f]);
    let mult = 0;
    if (syms[0]===syms[1] && syms[1]===syms[2]) {
      mult = syms[0]==='7️⃣' ? 10 : 3;
    } else if (syms[0]===syms[1] || syms[1]===syms[2] || syms[0]===syms[2]) {
      mult = 2;
    }

    if (mult > 0) {
      const gain = Math.floor(bet * mult);
      coin += gain;
      slotResultEl.textContent = mult===10 ? `🎰 JACKPOT! +${gain.toLocaleString()}` : `성공 ×${mult} +${gain.toLocaleString()}`;
      slotResultEl.className   = 'win';
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
     노동
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
      btnFront.disabled    = false;
      btnBack.disabled     = false;
      slotSpinBtn.disabled = false;
    }
    workStored = 0;
    updateWorkUI();
  };

  /* ════════════════════════════
     상점 렌더링
  ════════════════════════════ */
  function renderShop() {
    const wrap = document.getElementById('shopDynamic');
    if (!wrap) return;
    wrap.innerHTML = '';

    /* 자동 채굴 */
    const autoDiv = document.createElement('div');
    autoDiv.className = 'shop-item';
    autoDiv.innerHTML = `
      <div>
        <h3>⛏ 자동 클릭</h3>
        <p>1초당 1칩 자동 생산</p>
        <p class="shop-price">💎 100,000,000</p>
      </div>
      <button onclick="buyAutoMiner()" id="autoMinerBtn" ${autoMiner ? 'disabled' : ''}>${autoMiner ? '구매 완료' : '구매'}</button>
    `;
    wrap.appendChild(autoDiv);

    /* 펫 뽑기 */
    const gachaDiv = document.createElement('div');
    gachaDiv.className = 'shop-item';
    gachaDiv.innerHTML = `
      <div>
        <h3>🎲 펫 뽑기</h3>
        <p>랜덤 펫 획득! 레전더리 5%</p>
        <p class="shop-price">💎 500</p>
      </div>
      <button onclick="gachaPet()">뽑기</button>
    `;
    wrap.appendChild(gachaDiv);

    /* 모자 목록 */
    const hatTitle = document.createElement('h3');
    hatTitle.className = 'shop-section-title';
    hatTitle.textContent = '🎩 펫 모자';
    wrap.appendChild(hatTitle);

    HAT_SHOP.forEach(hat => {
      const owned = ownedHats.includes(hat.id);
      const equipped = equippedHat === hat.id;
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="shop-hat-info">
          <span class="hat-emoji">${hat.emoji}</span>
          <div>
            <h3>${hat.name}</h3>
            <p class="shop-price">💎 ${hat.price.toLocaleString()}</p>
          </div>
        </div>
        <div class="shop-hat-btns">
          ${owned
            ? `<button class="${equipped ? 'btn-equipped' : 'btn-equip'}" onclick="equipHat('${hat.id}')">${equipped ? '장착중' : '장착'}</button>`
            : `<button onclick="buyHat('${hat.id}')">구매</button>`}
        </div>
      `;
      wrap.appendChild(div);
    });
  }

  window.buyAutoMiner = function () {
    if (autoMiner) { showToast('이미 구매했어요!', 'warn'); return; }
    if (coin < 100000000) { showToast('칩이 부족해요!', 'warn'); return; }
    coin -= 100000000;
    saveCoin(); updateCoinUI();
    autoMiner = true;
    saveShopData();
    renderShop();
    setInterval(() => { workStored = Math.round((workStored + 1) * 10) / 10; updateWorkUI(); }, 1000);
    showToast('자동 클릭 구매 완료!', 'win');
  };

  // 자동 채굴 복원
  if (autoMiner) {
    setInterval(() => { workStored = Math.round((workStored + 1) * 10) / 10; updateWorkUI(); }, 1000);
  }

  window.gachaPet = function () {
    if (coin < 500) { showToast('칩이 부족해요! (500 필요)', 'warn'); return; }
    coin -= 500;
    saveCoin(); updateCoinUI();

    const pet = rollPet();
    ownedPets.push(pet.id);
    if (activePetIdx < 0) activePetIdx = 0;
    saveShopData();

    // 뽑기 연출
    showGachaResult(pet);
  };

  window.buyHat = function (hatId) {
    const hat = HAT_SHOP.find(h => h.id === hatId);
    if (!hat) return;
    if (ownedHats.includes(hatId)) { showToast('이미 보유 중이에요!', 'warn'); return; }
    if (coin < hat.price) { showToast('칩이 부족해요!', 'warn'); return; }
    coin -= hat.price;
    saveCoin(); updateCoinUI();
    ownedHats.push(hatId);
    saveShopData();
    renderShop();
    showToast(`${hat.name} 구매 완료!`, 'win');
  };

  window.equipHat = function (hatId) {
    if (equippedHat === hatId) {
      equippedHat = null;
      showToast('모자를 벗었어요.', 'info');
    } else {
      equippedHat = hatId;
      const hat = HAT_SHOP.find(h => h.id === hatId);
      showToast(`${hat.name} 장착!`, 'win');
    }
    saveShopData();
    renderShop();
    renderPetScreen();
  };

  /* ════════════════════════════
     펫 화면
  ════════════════════════════ */
  function renderPetScreen() {
    const screen = document.getElementById('screen-pet');
    const body   = screen.querySelector('.pet-body');
    if (!body) return;

    if (ownedPets.length === 0) {
      body.innerHTML = `
        <div class="pet-empty">
          <p>아직 펫이 없어요!</p>
          <p class="pet-empty-sub">상점에서 펫 뽑기를 해보세요 🎲</p>
          <button onclick="showTab('shop'); showScreen('menu');">상점 가기</button>
        </div>`;
      return;
    }

    // activePetIdx 안전 클램프
    activePetIdx = Math.max(0, Math.min(activePetIdx, ownedPets.length - 1));

    const petId  = ownedPets[activePetIdx];
    const petData= PET_POOL.find(p => p.id === petId) || PET_POOL[0];
    const hat    = HAT_SHOP.find(h => h.id === equippedHat);
    const rarityClass = { '커먼':'rarity-common','레어':'rarity-rare','에픽':'rarity-epic','레전더리':'rarity-legendary' }[petData.rarity] || '';

    body.innerHTML = `
      <div class="pet-display">
        <div class="pet-face" style="background:${petData.color}">
          ${hat ? `<div class="pet-hat">${hat.emoji}</div>` : ''}
          <div class="pet-emoji">${petData.emoji}</div>
        </div>
        <p class="pet-name">${petData.name} <span class="rarity-badge ${rarityClass}">${petData.rarity}</span></p>
      </div>

      <div class="pet-nav">
        <button class="pet-nav-btn" onclick="changePet(-1)">◀</button>
        <span class="pet-nav-count">${activePetIdx + 1} / ${ownedPets.length}</span>
        <button class="pet-nav-btn" onclick="changePet(1)">▶</button>
      </div>

      <div class="pet-owned-list">
        ${ownedPets.map((pid, idx) => {
          const p = PET_POOL.find(x => x.id === pid) || PET_POOL[0];
          return `<div class="pet-thumb ${idx === activePetIdx ? 'active' : ''}" onclick="selectPet(${idx})" style="background:${p.color}">${p.emoji}</div>`;
        }).join('')}
      </div>
    `;
  }

  window.changePet = function (dir) {
    if (ownedPets.length === 0) return;
    activePetIdx = (activePetIdx + dir + ownedPets.length) % ownedPets.length;
    saveShopData();
    renderPetScreen();
  };

  window.selectPet = function (idx) {
    activePetIdx = idx;
    saveShopData();
    renderPetScreen();
  };

  /* ════════════════════════════
     뽑기 연출 모달
  ════════════════════════════ */
  function showGachaResult(pet) {
    let modal = document.getElementById('gachaModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'gachaModal';
      document.body.appendChild(modal);
    }

    const rarityClass = { '커먼':'rarity-common','레어':'rarity-rare','에픽':'rarity-epic','레전더리':'rarity-legendary' }[pet.rarity] || '';

    modal.innerHTML = `
      <div class="gacha-inner">
        <p class="gacha-title">펫 획득!</p>
        <div class="gacha-face" style="background:${pet.color}">${pet.emoji}</div>
        <p class="gacha-name">${pet.name}</p>
        <span class="rarity-badge ${rarityClass} gacha-rarity">${pet.rarity}</span>
        <button class="gacha-close" onclick="closeGacha()">확인</button>
      </div>`;
    modal.classList.add('show');

    if (pet.rarity === '레전더리' || pet.rarity === '에픽') launchConfetti();
  }

  window.closeGacha = function () {
    const modal = document.getElementById('gachaModal');
    if (modal) modal.classList.remove('show');
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
    const colors    = ['#ff69b4','#ff9dcc','#ffb3d9','#ff3388','#ff66aa'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height * 0.4,
      r: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 1,
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
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
      });
      if (alive) requestAnimationFrame(draw);
    }
    draw();
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); window.mineChip(); }
  });

  /* ════════════════════════════
     블랙잭
  ════════════════════════════ */
  let bjDeck     = [];
  let playerHand = [];
  let dealerHand = [];
  let bjPlaying  = false;
  let bjBetAmt   = 0;

  function createDeck() {
    const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    bjDeck = [];
    for (let i = 0; i < 4; i++) ranks.forEach(r => bjDeck.push(r));
  }

  function drawCard() {
    return bjDeck.splice(Math.floor(Math.random() * bjDeck.length), 1)[0];
  }

  function getScore(hand) {
    let score = 0, aces = 0;
    hand.forEach(c => {
      if (c==='A') { score+=11; aces++; }
      else if (['J','Q','K'].includes(c)) score+=10;
      else score+=Number(c);
    });
    while (score > 21 && aces > 0) { score -= 10; aces--; }
    return score;
  }

  function renderHand(id, hand) {
    const el = document.getElementById(id);
    el.innerHTML = '';
    hand.forEach(c => {
      const div = document.createElement('div');
      div.className   = 'card';
      div.textContent = c;
      el.appendChild(div);
    });
  }

  function updateBlackjackUI() {
    renderHand('playerCards', playerHand);
    renderHand('dealerCards', dealerHand);
    document.getElementById('playerScore').textContent = '점수 : ' + getScore(playerHand);
    document.getElementById('dealerScore').textContent = '점수 : ' + getScore(dealerHand);
  }

  window.startBlackjack = function () {
    if (bjPlaying) return;
    const bjBetInput = document.getElementById('bjBet');
    bjBetAmt = Math.max(1, parseInt(bjBetInput.value) || 1);
    if (bjBetAmt > coin) {
      showToast('배팅 칩이 보유 칩보다 많습니다!', 'warn');
      bjBetInput.value = Math.max(1, coin);
      return;
    }
    coin -= bjBetAmt; saveCoin(); updateCoinUI();
    createDeck();
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];
    bjPlaying  = true;
    document.getElementById('bjHitBtn').disabled   = false;
    document.getElementById('bjStandBtn').disabled  = false;
    document.getElementById('bjResult').textContent = '';
    document.getElementById('bjResult').className   = '';
    updateBlackjackUI();
    if (getScore(playerHand) === 21) {
      coin += Math.floor(bjBetAmt * 2.5);
      saveCoin(); updateCoinUI();
      endBlackjack('블랙잭! 🎉', true);
    }
  };

  window.hit = function () {
    if (!bjPlaying) return;
    playerHand.push(drawCard());
    updateBlackjackUI();
    if (getScore(playerHand) > 21) endBlackjack('버스트! 패배', false);
  };

  window.stand = function () {
    if (!bjPlaying) return;
    while (getScore(dealerHand) < 17) dealerHand.push(drawCard());
    updateBlackjackUI();
    const p = getScore(playerHand), d = getScore(dealerHand);
    if (d > 21 || p > d) {
      coin += bjBetAmt * 2; saveCoin(); updateCoinUI();
      endBlackjack('승리! 🎉', true);
    } else if (p === d) {
      coin += bjBetAmt; saveCoin(); updateCoinUI();
      endBlackjack('무승부', null);
    } else {
      endBlackjack('패배', false);
    }
  };

  function endBlackjack(text, win) {
    const el = document.getElementById('bjResult');
    el.textContent = text;
    el.className   = win === true ? 'win' : win === false ? 'lose' : '';
    document.getElementById('bjHitBtn').disabled   = true;
    document.getElementById('bjStandBtn').disabled  = true;
    bjPlaying = false;
    if (win === true) launchConfetti();
    if (win === false) doFlash();
  }

})();