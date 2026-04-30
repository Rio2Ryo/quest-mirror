export type Inputs = {
  name: string;
  mood: string;
  energy: number;
  motivation: number;
  focus: number;
  hunger: number;
  sleepiness: number;
  tasks: number;
};

export type ActionKind = 'rest' | 'venture' | 'snack' | 'spark';

export type QuestCard = {
  seed: number;
  title: string;
  className: string;
  level: number;
  hp: number;
  mp: number;
  atk: number;
  def: number;
  agi: number;
  luck: number;
  aura: string;
  status: string[];
  equipment: string[];
  quest: string;
  familiar: string;
  relic: string;
  weakness: string;
  combo: string;
  prophecy: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'GLITCH';
};

export const defaultInputs: Inputs = {
  name: '',
  mood: '眠いけど、少しだけ進みたい',
  energy: 46,
  motivation: 38,
  focus: 54,
  hunger: 42,
  sleepiness: 66,
  tasks: 61,
};

export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function normalizeInputs(input: Inputs): Inputs {
  return {
    name: input.name.trim().slice(0, 24),
    mood: input.mood.trim().slice(0, 90),
    energy: clamp(input.energy),
    motivation: clamp(input.motivation),
    focus: clamp(input.focus),
    hunger: clamp(input.hunger),
    sleepiness: clamp(input.sleepiness),
    tasks: clamp(input.tasks),
  };
}

export function hashString(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)] ?? items[0];
}

function topSignals(input: Inputs): string[] {
  const signals: Array<[string, number]> = [
    ['低HP', 100 - input.energy],
    ['低MP', 100 - input.motivation],
    ['集中光', input.focus],
    ['空腹', input.hunger],
    ['眠気', input.sleepiness],
    ['予定過多', input.tasks],
  ];
  return signals.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
}

export function generateQuestCard(raw: Inputs, salt = 0): QuestCard {
  const input = normalizeInputs(raw);
  const baseText = `${input.name}|${input.mood}|${input.energy}|${input.motivation}|${input.focus}|${input.hunger}|${input.sleepiness}|${input.tasks}|${salt}`;
  const seed = hashString(baseText);
  const rng = createRng(seed);
  const signals = topSignals(input);

  const adjectives = ['ねむれる', '半透明の', '午後から本気の', '通知を避ける', '小さな勇気の', 'カフェイン待ちの', '机上を漂う', '締切前夜の'];
  const roles = signals.includes('眠気')
    ? ['夢見の賢者', '布団国の騎士', 'まばたき魔導士']
    : signals.includes('予定過多')
      ? ['タスク平原の斥候', '会議迷宮の地図師', '締切ドラゴン使い']
      : signals.includes('空腹')
        ? ['おやつ神殿の巡礼者', '胃袋の錬金術師', '昼食待ちの槍兵']
        : ['小休止の勇者', 'あと一歩の吟遊詩人', '静かなバグハンター'];

  const hp = clamp(input.energy - input.sleepiness * 0.28 - input.tasks * 0.08 + rng() * 12);
  const mp = clamp(input.motivation + input.focus * 0.25 - input.hunger * 0.18 + rng() * 10);
  const atk = clamp(input.motivation * 0.58 + input.energy * 0.3 + rng() * 18);
  const def = clamp(100 - input.tasks * 0.45 + input.focus * 0.24 + rng() * 14);
  const agi = clamp(100 - input.sleepiness * 0.55 + input.energy * 0.27 + rng() * 12);
  const luck = clamp((input.mood.length * 7 + seed % 101 + rng() * 30) % 101);
  const level = clamp(Math.round((hp + mp + atk + def + agi + luck) / 42), 1, 20);

  const statusPool = [
    input.sleepiness > 58 ? '状態異常: まぶた重力' : '耐性: 睡魔かわし',
    input.hunger > 58 ? '状態異常: 胃袋の警鐘' : '加護: おやつ保留',
    input.tasks > 64 ? '呪い: クエスト渋滞' : '祝福: 余白の小道',
    input.focus < 36 ? '霧: タブ開きすぎ' : '集中光: 15分だけ無敵',
    input.motivation < 35 ? 'MP節約モード' : '士気: ちょっと強い',
  ];
  const equipmentPool = ['ぬるいコーヒー', '昨日のやる気の欠片', '開きっぱなしのタブ', '片方だけ見つかった靴下', 'メモの形をした地図', '充電72%の端末', '謎の付箋', '透明なポーション'];
  const quests = [
    '水を一杯飲み、最初の小型モンスターを1体だけ倒す',
    '机の上を2マス取り戻して帰還する',
    'メール沼から未読を3匹だけ救出する',
    '先延ばしドラゴンのしっぽを一度つつく',
    '5分の休息魔法を唱えてから再出発する',
    '今日のラスボスを「名前だけ」書き出す',
  ];
  const familiars = ['丸い影のスライム', '寝ぐせフクロウ', '通知を食べる小竜', '湯気の精霊', 'カレンダーから逃げた猫'];
  const relics = [
    `「${(input.mood || '無言').slice(0, 12)}」の結晶`,
    '一度だけ会議を短く感じる砂時計',
    '未読を一匹眠らせる鈴',
    'やる気の残像を保存した小瓶',
    '布団王国の通行証',
  ];
  const weaknesses = signals.includes('空腹')
    ? ['パン屋の匂い', '昼前の長話', '空の冷蔵庫']
    : signals.includes('眠気')
      ? ['あたたかい部屋', '単調な資料', '午後の陽だまり']
      : signals.includes('予定過多')
        ? ['増えるカレンダー', '「ちょっとだけ」の依頼', '通知の群れ']
        : ['完璧主義の罠', '謎のタブ増殖', '急な空腹'];
  const combos = [
    `HP${hp}からの通常攻撃「まず水を飲む」`,
    `MP${mp}を消費して「5分だけ着手」`,
    `LUCK${luck}判定で「偶然いい順番」を引く`,
    `相棒と連携して「通知を一時封印」`,
  ];
  const auras = ['青緑の回復霧', '桃色の反撃火花', '群青の集中結界', '琥珀色の休憩灯', '紫の夢粒子'];
  const prophecies = [
    `「${input.mood || '無言の一日'}」は呪文として登録された。唱えるたび、少し現実が丸くなる。`,
    '完璧な一撃ではなく、弱い通常攻撃を3回。当たり判定は思ったより広い。',
    '今日はボス戦ではない。村人に話しかける日だ。',
    '休むコマンドは逃げではなく、防御力を上げる古代魔法だ。',
  ];
  const rarity = luck > 92 ? 'GLITCH' : luck > 76 ? 'EPIC' : luck > 54 ? 'RARE' : 'COMMON';

  return {
    seed,
    title: input.name || pick(['今日のあなた', '名もなき冒険者', '朝を越えた者'], rng),
    className: `${pick(adjectives, rng)}${pick(roles, rng)}`,
    level,
    hp,
    mp,
    atk,
    def,
    agi,
    luck,
    aura: pick(auras, rng),
    status: statusPool.sort(() => rng() - 0.5).slice(0, 3),
    equipment: equipmentPool.sort(() => rng() - 0.5).slice(0, 3),
    quest: pick(quests, rng),
    familiar: pick(familiars, rng),
    relic: pick(relics, rng),
    weakness: pick(weaknesses, rng),
    combo: pick(combos, rng),
    prophecy: pick(prophecies, rng),
    rarity,
  };
}

export function applyAction(input: Inputs, action: ActionKind): Inputs {
  const next = { ...normalizeInputs(input) };
  if (action === 'rest') {
    next.energy = clamp(next.energy + 14);
    next.sleepiness = clamp(next.sleepiness - 18);
    next.mood = '休憩魔法を挟んだ。少しだけ輪郭が戻った。';
  }
  if (action === 'venture') {
    next.motivation = clamp(next.motivation + 11);
    next.tasks = clamp(next.tasks + 7);
    next.focus = clamp(next.focus + 5);
    next.mood = '小さな冒険に出た。敵も増えたが、地図も明るくなった。';
  }
  if (action === 'snack') {
    next.hunger = clamp(next.hunger - 28);
    next.energy = clamp(next.energy + 6);
    next.mood = 'おやつ神殿で補給した。世界の解像度が上がった。';
  }
  if (action === 'spark') {
    next.focus = clamp(next.focus + 18);
    next.motivation = clamp(next.motivation + 7);
    next.sleepiness = clamp(next.sleepiness + 5);
    next.mood = '短い集中結界を張った。反動はあとで考える。';
  }
  return next;
}

export function encodeState(input: Inputs, salt: number): string {
  const normalized = normalizeInputs(input);
  const payload = JSON.stringify({ ...normalized, salt });
  return btoa(unescape(encodeURIComponent(payload))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeState(value: string | null): { input: Inputs; salt: number } | null {
  if (!value || value.length > 900) return null;
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const parsed = JSON.parse(decodeURIComponent(escape(atob(padded)))) as Partial<Inputs> & { salt?: number };
    return {
      input: normalizeInputs({ ...defaultInputs, ...parsed }),
      salt: clamp(parsed.salt ?? 0, 0, 9999),
    };
  } catch {
    return null;
  }
}

export function shareText(card: QuestCard): string {
  return `Quest Mirrorで今日の自分を鑑定: ${card.title} / ${card.className} Lv.${card.level} / ${card.status.join('・')} / 戦利品「${card.relic}」 / クエスト「${card.quest}」`;
}
