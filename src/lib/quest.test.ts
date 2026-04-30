import { describe, expect, it } from 'vitest';
import {
  applyAction,
  decodeState,
  defaultInputs,
  encodeState,
  generateQuestCard,
  normalizeInputs,
  shareText,
} from './quest';

describe('quest generation', () => {
  it('normalizes unsafe or extreme inputs', () => {
    const input = normalizeInputs({
      ...defaultInputs,
      name: '  012345678901234567890123456789  ',
      mood: '<script>alert(1)</script>'.repeat(10),
      energy: -20,
      hunger: 180,
    });

    expect(input.name).toHaveLength(24);
    expect(input.mood.length).toBeLessThanOrEqual(90);
    expect(input.energy).toBe(0);
    expect(input.hunger).toBe(100);
  });

  it('generates deterministic cards for the same state and salt', () => {
    const first = generateQuestCard(defaultInputs, 3);
    const second = generateQuestCard(defaultInputs, 3);

    expect(first).toEqual(second);
    expect(first.status).toHaveLength(3);
    expect(first.equipment).toHaveLength(3);
    expect(first.relic).toBeTruthy();
    expect(first.combo).toContain('「');
    expect(first.hp).toBeGreaterThanOrEqual(0);
    expect(first.hp).toBeLessThanOrEqual(100);
  });

  it('changes the world line through actions', () => {
    const rested = applyAction(defaultInputs, 'rest');
    const ventured = applyAction(defaultInputs, 'venture');

    expect(rested.energy).toBeGreaterThan(defaultInputs.energy);
    expect(rested.sleepiness).toBeLessThan(defaultInputs.sleepiness);
    expect(ventured.tasks).toBeGreaterThan(defaultInputs.tasks);
  });

  it('round-trips compact url state safely', () => {
    const encoded = encodeState(defaultInputs, 12);
    const decoded = decodeState(encoded);

    expect(decoded?.input).toEqual(normalizeInputs(defaultInputs));
    expect(decoded?.salt).toBe(12);
    expect(decodeState('%E0%A4%A')).toBeNull();
  });

  it('creates a shareable summary with core card details', () => {
    const card = generateQuestCard({ ...defaultInputs, name: 'Ryo' }, 1);
    const text = shareText(card);

    expect(text).toContain('Quest Mirror');
    expect(text).toContain('Ryo');
    expect(text).toContain('クエスト');
  });
});
