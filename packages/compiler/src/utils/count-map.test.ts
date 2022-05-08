import { CountMap } from './count-map';

describe('CountMap', () => {
  describe('.has', () => {
    it('returns false for an unknown key', () => {
      const map = new CountMap<string>();
      expect(map.has('unknown')).toBe(false);
    });

    it('returns true for a known key', () => {
      const map = new CountMap<string>();
      map.increment('known');
      expect(map.has('known')).toBe(true);
    });

    it('returns false for a decremented key', () => {
      const map = new CountMap<string>();
      map.increment('known');
      map.decrement('known');
      expect(map.has('known')).toBe(false);
    });

    it('returns false for a negatively decremented key', () => {
      const map = new CountMap<string>();
      map.increment('known');
      map.decrement('known');
      map.decrement('known');
      map.decrement('known');
      expect(map.has('known')).toBe(false);
    });

    it('returns true for a re-added key', () => {
      const map = new CountMap<string>();
      map.increment('known');
      map.decrement('known');
      map.decrement('known');
      map.decrement('known');
      map.increment('known');
      expect(map.has('known')).toBe(true);
    });
  });
});
