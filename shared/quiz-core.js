/* =========================================================================
   共有：進捗エンジン（漢字図鑑・称号・メダル）— 全アプリ共通の育成系
   ・localStorage キー 'kanjiQuiz.v1' を全アプリで共有（localStorage はオリジン単位
     ＝ github.io/kanji-quiz 全体で1つ）。同じ store スキーマ・同じ STAGES/MEDALS を
     使うので、onaji と okurigana など複数アプリの進捗が自動で合算される。
   ・store の既存フィールドは破壊せず保持（full load → 一部更新 → full save）。
   ・shared/kanji-db.js（KANJI）より後に読み込むこと。
   使い方:  QuizCore.recordCorrect('移る'); QuizCore.bumpCorrect(); QuizCore.save();
            QuizCore.checkMedals(); QuizCore.renderBuddy({...}); 等
   ========================================================================= */
(function (global) {
  const KANJI = global.KANJI;
  const STORE_KEY = 'kanjiQuiz.v1';

  let store = {};
  function load() {
    try { store = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { store = {}; }
    store.kanji        = store.kanji        || {};   // { 漢字: 正解回数 }
    store.medals       = store.medals       || {};   // { メダルID: true }
    store.bestCombo    = store.bestCombo    || 0;
    store.plays        = store.plays        || 0;
    store.perfect      = store.perfect      || false;
    store.perfectCount = store.perfectCount || 0;
    store.totalCorrect = store.totalCorrect || 0;
    return store;
  }
  load();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) {} }

  /* ── 図鑑（集められる漢字＝DB全字） ── */
  const COLLECTIBLE = Object.keys(KANJI)
    .sort((a, b) => KANJI[a].g - KANJI[b].g || KANJI[a].s - KANJI[b].s || (a < b ? -1 : 1));
  const dexCount     = () => COLLECTIBLE.filter(ch => (store.kanji[ch] || 0) >= 1).length;
  const masterCount  = () => COLLECTIBLE.filter(ch => (store.kanji[ch] || 0) >= 3).length;
  const dexGradeDone = (g) => COLLECTIBLE.filter(ch => KANJI[ch].g === g).every(ch => (store.kanji[ch] || 0) >= 1);

  /* ── 記録 ── */
  function recordCorrect(word) {           // 正解した語の漢字を図鑑に（1回で図鑑入り→3回で★）
    [...String(word)].filter(c => KANJI[c]).forEach(ch => { store.kanji[ch] = (store.kanji[ch] || 0) + 1; });
  }
  function bumpCorrect(n = 1) { store.totalCorrect = (store.totalCorrect || 0) + n; }
  function noteCombo(c)       { if (c > (store.bestCombo || 0)) store.bestCombo = c; }
  function notePlay()         { store.plays = (store.plays || 0) + 1; }
  function notePerfect()      { store.perfect = true; store.perfectCount = (store.perfectCount || 0) + 1; }

  /* ── メダル（onaji と同一定義。store 共有なので合算） ── */
  const MEDALS = [
    {id:'firstClear', icon:'🎫', name:'はじめの一歩',  desc:'1かい あそんだ',    test:()=> store.plays>=1},
    {id:'play5',      icon:'🎮', name:'5かい あそんだ', desc:'5かい あそんだ',    test:()=> store.plays>=5},
    {id:'play10',     icon:'🎯', name:'10かい あそんだ',desc:'10かい あそんだ',   test:()=> store.plays>=10},
    {id:'play20',     icon:'🕹️', name:'20かい あそんだ',desc:'20かい あそんだ',   test:()=> store.plays>=20},
    {id:'play30',     icon:'🎲', name:'30かい あそんだ',desc:'30かい あそんだ',   test:()=> store.plays>=30},
    {id:'play50',     icon:'🏅', name:'50かい あそんだ',desc:'50かい あそんだ',   test:()=> store.plays>=50},
    {id:'play100',    icon:'💎', name:'100かい あそんだ',desc:'100かい あそんだ', test:()=> store.plays>=100},
    {id:'play200',    icon:'👑', name:'200かい あそんだ',desc:'200かい あそんだ', test:()=> store.plays>=200},
    {id:'perfect',    icon:'💯', name:'ぜんもん せいかい', desc:'1かいで ぜんぶ正かい',  test:()=> store.perfect},
    {id:'perfect3',   icon:'🥉', name:'全問正かい 3かい', desc:'ぜんもん正かいを 3かい', test:()=> store.perfectCount>=3},
    {id:'perfect5',   icon:'🥈', name:'全問正かい 5かい', desc:'ぜんもん正かいを 5かい', test:()=> store.perfectCount>=5},
    {id:'perfect10',  icon:'🥇', name:'全問正かい 10かい',desc:'ぜんもん正かいを 10かい',test:()=> store.perfectCount>=10},
    {id:'correct50',  icon:'✏️', name:'50もん 正かい',  desc:'ぜんぶで 50もん正かい',  test:()=> store.totalCorrect>=50},
    {id:'correct100', icon:'📘', name:'100もん 正かい', desc:'ぜんぶで 100もん正かい', test:()=> store.totalCorrect>=100},
    {id:'correct200', icon:'📗', name:'200もん 正かい', desc:'ぜんぶで 200もん正かい', test:()=> store.totalCorrect>=200},
    {id:'correct300', icon:'📙', name:'300もん 正かい', desc:'ぜんぶで 300もん正かい', test:()=> store.totalCorrect>=300},
    {id:'correct500', icon:'📕', name:'500もん 正かい', desc:'ぜんぶで 500もん正かい', test:()=> store.totalCorrect>=500},
    {id:'correct1000',icon:'📜', name:'1000もん 正かい',desc:'ぜんぶで 1000もん正かい',test:()=> store.totalCorrect>=1000},
    {id:'firstCombo', icon:'✌️', name:'はじめての コンボ', desc:'2れんぞく 正かい',  test:()=> store.bestCombo>=2},
    {id:'combo3',     icon:'🔥', name:'コンボ 3',  desc:'3れんぞく 正かい',  test:()=> store.bestCombo>=3},
    {id:'combo5',     icon:'🌶️', name:'コンボ 5',  desc:'5れんぞく 正かい',  test:()=> store.bestCombo>=5},
    {id:'combo10',    icon:'⚡', name:'コンボ 10', desc:'10れんぞく 正かい', test:()=> store.bestCombo>=10},
    {id:'combo15',    icon:'☄️', name:'コンボ 15', desc:'15れんぞく 正かい', test:()=> store.bestCombo>=15},
    {id:'combo20',    icon:'🌈', name:'コンボ 20', desc:'20れんぞく 正かい', test:()=> store.bestCombo>=20},
    {id:'firstDex',   icon:'📄', name:'ずかん はじめ', desc:'図かんに 1字',  test:()=> dexCount()>=1},
    {id:'dex10',      icon:'📗', name:'ずかん 10字',  desc:'図かんに 10字',  test:()=> dexCount()>=10},
    {id:'dex25',      icon:'📒', name:'ずかん 25字',  desc:'図かんに 25字',  test:()=> dexCount()>=25},
    {id:'dex50',      icon:'📚', name:'ずかん 50字',  desc:'図かんに 50字',  test:()=> dexCount()>=50},
    {id:'dex100',     icon:'📕', name:'ずかん 100字', desc:'図かんに 100字', test:()=> dexCount()>=100},
    {id:'dex200',     icon:'📖', name:'ずかん 200字', desc:'図かんに 200字', test:()=> dexCount()>=200},
    {id:'dexAll',     icon:'👑', name:'ずかん コンプリート', desc:'ぜんぶ 図かんに', test:()=> dexCount()>=COLLECTIBLE.length},
    {id:'dexG1',      icon:'🟢', name:'1年 ずかん コンプ', desc:'1年の かん字を ぜんぶ', test:()=> dexGradeDone(1)},
    {id:'dexG2',      icon:'🔵', name:'2年 ずかん コンプ', desc:'2年の かん字を ぜんぶ', test:()=> dexGradeDone(2)},
    {id:'dexG3',      icon:'🟣', name:'3年 ずかん コンプ', desc:'3年の かん字を ぜんぶ', test:()=> dexGradeDone(3)},
    {id:'firstStar',  icon:'⭐', name:'はじめての ★',  desc:'★を 1字',   test:()=> masterCount()>=1},
    {id:'master10',   icon:'🌟', name:'マスター 10字', desc:'★を 10字',  test:()=> masterCount()>=10},
    {id:'master50',   icon:'💫', name:'マスター 50字', desc:'★を 50字',  test:()=> masterCount()>=50},
    {id:'master100',  icon:'🪐', name:'マスター 100字',desc:'★を 100字', test:()=> masterCount()>=100},
    {id:'masterAll',  icon:'🏵️', name:'ぜんぶ マスター', desc:'ぜんぶ ★に', test:()=> masterCount()>=COLLECTIBLE.length},
    {id:'grandMaster',icon:'🏆', name:'グランドマスター', desc:'図かん＆★を ぜんぶ', test:()=> dexCount()>=COLLECTIBLE.length && masterCount()>=COLLECTIBLE.length},
  ];
  function checkMedals() {
    const newly = [];
    MEDALS.forEach(m => {
      try { if (!store.medals[m.id] && m.test()) { store.medals[m.id] = true; newly.push(m); } }
      catch (e) {}
    });
    if (newly.length) save();
    return newly;
  }

  /* ── 称号（累計正解数で育つ。onaji と同一） ── */
  const STAGES = [
    {need:0,     icon:'🥚',   title:'漢字みならい'},
    {need:30,    icon:'🐣',   title:'漢字かけだし'},
    {need:80,    icon:'🐥',   title:'漢字がんばりや'},
    {need:150,   icon:'🐦',   title:'漢字じょうず'},
    {need:300,   icon:'🦜',   title:'漢字もの知り'},
    {need:500,   icon:'🦉',   title:'漢字はかせ'},
    {need:800,   icon:'🦅',   title:'漢字せんせい'},
    {need:1200,  icon:'🐺',   title:'漢字名人'},
    {need:1800,  icon:'🦁',   title:'漢字達人'},
    {need:2600,  icon:'🐲',   title:'漢字マスター'},
    {need:3800,  icon:'🐉',   title:'漢字グランドマスター'},
    {need:5500,  icon:'👑',   title:'漢字キング'},
    {need:8000,  icon:'🌟',   title:'漢字チャンピオン'},
    {need:11500, icon:'☄️',   title:'漢字レジェンド'},
    {need:16000, icon:'🧙',   title:'漢字仙人'},
    {need:22000, icon:'🐉✨', title:'漢字の神さま'},
    {need:30000, icon:'🌌',   title:'漢字うちゅういち'},
  ];
  function rankStage(n) { let s = 0; STAGES.forEach((e, i) => { if (n >= e.need) s = i; }); return s; }

  /* ── 描画ヘルパー（共有CSSの .dcard / .medal / .buddy を使う） ── */
  function renderBuddy(els) {   // els = {icon,name,coin,bar,next}（DOM要素）
    const tc = store.totalCorrect || 0, s = rankStage(tc), cur = STAGES[s], nxt = STAGES[s + 1];
    if (els.icon) els.icon.textContent = cur.icon;
    if (els.name) els.name.textContent = cur.title;
    if (els.coin) els.coin.textContent = `これまで せいかい ${tc}問`;
    if (nxt) {
      const span = nxt.need - cur.need;
      const prog = Math.max(0, Math.min(100, Math.floor((tc - cur.need) / span * 100)));
      if (els.bar)  els.bar.style.width = prog + '%';
      if (els.next) els.next.textContent = `あと ${nxt.need - tc}問 正解で「${nxt.title}」`;
    } else {
      if (els.bar)  els.bar.style.width = '100%';
      if (els.next) els.next.textContent = 'さいこうの 称号に なった！🎉';
    }
  }
  function dexHead() { return `${dexCount()} / ${COLLECTIBLE.length} 字（★${masterCount()}）`; }
  function dexGridHTML() {
    return COLLECTIBLE.map(ch => {
      const k = KANJI[ch], c = store.kanji[ch] || 0;
      if (c >= 1) {
        const master = c >= 3;
        const on  = k.on.length  ? '音 ' + k.on.join('・')  : '';
        const kun = k.kun.length ? '訓 ' + k.kun.join('・') : '';
        return `<div class="dcard${master ? ' master' : ''}"><div class="k">${ch}</div>`
          + `<div class="star">${master ? '★' : '☆'}</div>`
          + `<div class="info">${k.s}画${(on || kun) ? '<br>' : ''}${on}${on && kun ? '<br>' : ''}${kun}</div></div>`;
      }
      return `<div class="dcard locked"><div class="k">？</div><div class="info">みつけよう</div></div>`;
    }).join('');
  }
  function medalsHead() { return `${MEDALS.filter(m => store.medals[m.id]).length} / ${MEDALS.length}`; }
  function medalsGridHTML() {
    return MEDALS.map(m => {
      const has = !!store.medals[m.id];
      return `<div class="medal${has ? '' : ' locked'}"><div class="mi">${has ? m.icon : '🔒'}</div>`
        + `<div class="mn">${m.name}</div><div class="md">${m.desc}</div></div>`;
    }).join('');
  }

  global.QuizCore = {
    get store() { return store; }, reload: load, save,
    COLLECTIBLE, dexCount, masterCount, dexGradeDone,
    recordCorrect, bumpCorrect, noteCombo, notePlay, notePerfect,
    MEDALS, checkMedals, STAGES, rankStage,
    renderBuddy, dexHead, dexGridHTML, medalsHead, medalsGridHTML,
  };
})(window);
