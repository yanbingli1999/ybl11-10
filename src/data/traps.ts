import { Trap } from '../types/game';

export const TRAPS: Record<string, Trap> = {
  spike: {
    id: 'spike',
    name: '尖刺陷阱',
    damage: 15,
    effect: '刺伤',
    visibleByDefault: false,
  },
  poison_gas: {
    id: 'poison_gas',
    name: '毒烟陷阱',
    damage: 10,
    effect: '中毒，持续掉血',
    visibleByDefault: false,
  },
  arrow: {
    id: 'arrow',
    name: '暗箭机关',
    damage: 20,
    effect: '箭矢射击',
    visibleByDefault: false,
  },
  collapsing_floor: {
    id: 'collapsing_floor',
    name: '塌陷地板',
    damage: 25,
    effect: '地板塌陷',
    visibleByDefault: false,
  },
  curse_mark: {
    id: 'curse_mark',
    name: '诅咒印记',
    damage: 0,
    effect: '增加诅咒值',
    visibleByDefault: false,
  },
};

export function getRandomTrapType(depth: number): string {
  const types = Object.keys(TRAPS);
  const maxIndex = Math.min(types.length, 2 + Math.floor(depth / 2));
  return types[Math.floor(Math.random() * maxIndex)];
}
