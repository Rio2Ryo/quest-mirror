import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type ActionKind,
  type Inputs,
  applyAction,
  decodeState,
  defaultInputs,
  encodeState,
  generateQuestCard,
  shareText,
} from './lib/quest';

const sliders: Array<{ key: keyof Inputs; label: string; low: string; high: string }> = [
  { key: 'energy', label: '体力', low: '幽霊', high: '不死鳥' },
  { key: 'motivation', label: 'やる気', low: '明日へ外注', high: '火花' },
  { key: 'focus', label: '集中', low: '霧の中', high: '狙撃手' },
  { key: 'hunger', label: '空腹', low: '満腹', high: '胃袋ドラゴン' },
  { key: 'sleepiness', label: '眠気', low: '覚醒', high: '布団磁石' },
  { key: 'tasks', label: '予定量', low: '草原', high: '迷宮' },
];

const actionLabels: Array<{ action: ActionKind; label: string; help: string }> = [
  { action: 'rest', label: '休む', help: 'HPを戻し、眠気を少しほどく' },
  { action: 'venture', label: '冒険する', help: '敵は増えるが士気も上がる' },
  { action: 'snack', label: '補給する', help: '胃袋ドラゴンをなだめる' },
  { action: 'spark', label: '集中結界', help: '短く鋭く進む' },
];

function safeLoad(): { input: Inputs; salt: number } {
  const fromUrl = decodeState(new URLSearchParams(window.location.search).get('q'));
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem('quest-mirror-state');
    const parsed = saved ? decodeState(saved) : null;
    return parsed ?? { input: defaultInputs, salt: 0 };
  } catch {
    return { input: defaultInputs, salt: 0 };
  }
}

function meterStyle(value: number) {
  return { '--value': `${value}%` } as React.CSSProperties;
}

export default function App() {
  const initial = useMemo(safeLoad, []);
  const [input, setInput] = useState<Inputs>(initial.input);
  const [salt, setSalt] = useState(initial.salt);
  const [notice, setNotice] = useState('スライダーを触ると、鏡の中の冒険者が少しずつ変わります。');
  const resultRef = useRef<HTMLElement>(null);
  const card = useMemo(() => generateQuestCard(input, salt), [input, salt]);
  const encoded = useMemo(() => encodeState(input, salt), [input, salt]);
  const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encoded}`;

  useEffect(() => {
    try {
      localStorage.setItem('quest-mirror-state', encoded);
    } catch {
      // Storage can fail in private modes; the app remains usable.
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('q', encoded);
      window.history.replaceState(null, '', url);
    } catch {
      // URL updates are a convenience; generation and sharing still work.
    }
  }, [encoded]);

  function updateNumber(key: keyof Inputs, value: string) {
    setInput((current) => ({ ...current, [key]: Number(value) }));
    setNotice('鏡の霧が揺れました。ステータスが再計算されています。');
  }

  function updateText(key: 'name' | 'mood', value: string) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function cast(action: ActionKind) {
    setInput((current) => applyAction(current, action));
    setSalt((current) => current + 1);
    setNotice(action === 'rest' ? '休むコマンドを実行。防御力がやさしく上がりました。' : '行動で世界線が少しずれました。');
    setTimeout(() => resultRef.current?.focus(), 40);
  }

  async function copyResult() {
    const text = `${shareText(card)}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice('共有文をコピーしました。今日の冒険ログを誰かに見せられます。');
    } catch {
      setNotice('コピーに失敗しました。URL欄から直接共有できます。');
    }
  }

  async function shareResult() {
    const text = shareText(card);
    try {
      if ('share' in navigator) {
        await navigator.share({ title: 'Quest Mirror', text, url: shareUrl });
        setNotice('共有の門を開きました。');
      } else {
        await copyResult();
      }
    } catch {
      setNotice('共有はキャンセルされました。カードはここに残っています。');
    }
  }

  return (
    <main className={`app rarity-${card.rarity.toLowerCase()}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <section className="hero panel">
        <p className="eyebrow">Quest Mirror</p>
        <h1>今日の自分を、RPGの冒険者カードに変換する鏡。</h1>
        <p className="lead">
          気分とコンディションを入れると、職業・状態異常・装備・今日のクエストが生成されます。
          休む/冒険する/補給するで世界線が変わります。
        </p>
      </section>

      <section className="control panel" aria-label="今日のコンディション入力">
        <label className="field">
          <span>冒険者名（任意）</span>
          <input value={input.name} maxLength={24} placeholder="例: リョウ" onChange={(event) => updateText('name', event.target.value)} />
        </label>
        <label className="field">
          <span>今日の呪文メモ</span>
          <textarea value={input.mood} maxLength={90} onChange={(event) => updateText('mood', event.target.value)} />
        </label>

        <div className="sliders">
          {sliders.map((slider) => (
            <label className="slider" key={slider.key}>
              <span className="slider-top">
                <strong>{slider.label}</strong>
                <output>{input[slider.key]}</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={input[slider.key]}
                onChange={(event) => updateNumber(slider.key, event.target.value)}
                aria-label={slider.label}
              />
              <span className="scale"><small>{slider.low}</small><small>{slider.high}</small></span>
            </label>
          ))}
        </div>
      </section>

      <section className="result-card panel" ref={resultRef} tabIndex={-1} aria-live="polite" aria-label="生成されたRPGステータスカード">
        <div className="card-top">
          <div>
            <p className="badge">{card.rarity}</p>
            <h2>{card.title}</h2>
            <p className="class-name">{card.className}</p>
          </div>
          <div className="level">Lv.{card.level}</div>
        </div>

        <div className="bars" aria-label="HPとMP">
          <div><span>HP {card.hp}</span><i style={meterStyle(card.hp)} /></div>
          <div><span>MP {card.mp}</span><i style={meterStyle(card.mp)} /></div>
        </div>

        <dl className="stats">
          <div><dt>ATK</dt><dd>{card.atk}</dd></div>
          <div><dt>DEF</dt><dd>{card.def}</dd></div>
          <div><dt>AGI</dt><dd>{card.agi}</dd></div>
          <div><dt>LUCK</dt><dd>{card.luck}</dd></div>
        </dl>

        <div className="lore-grid">
          <article><h3>状態異常</h3>{card.status.map((item) => <span className="chip" key={item}>{item}</span>)}</article>
          <article><h3>装備</h3>{card.equipment.map((item) => <span className="chip" key={item}>{item}</span>)}</article>
        </div>
        <p className="quest"><strong>今日のクエスト:</strong> {card.quest}</p>
        <div className="twist-grid">
          <p><strong>戦利品:</strong> {card.relic}</p>
          <p><strong>弱点:</strong> {card.weakness}</p>
          <p><strong>連携技:</strong> {card.combo}</p>
        </div>
        <p className="familiar"><strong>相棒:</strong> {card.familiar} / <strong>オーラ:</strong> {card.aura}</p>
        <blockquote>{card.prophecy}</blockquote>
      </section>

      <section className="actions panel" aria-label="世界線を動かす操作">
        <div className="action-grid">
          {actionLabels.map((item) => (
            <button key={item.action} onClick={() => cast(item.action)}>
              <strong>{item.label}</strong>
              <span>{item.help}</span>
            </button>
          ))}
        </div>
        <div className="share-row">
          <button className="primary" onClick={() => setSalt((current) => current + 1)}>運命を振り直す</button>
          <button onClick={copyResult}>コピー</button>
          <button onClick={shareResult}>共有</button>
        </div>
        <p className="notice" role="status">{notice}</p>
        <p className="url-hint">URL状態つき: <code>{shareUrl}</code></p>
      </section>
    </main>
  );
}
