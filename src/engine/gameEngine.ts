import {
  GameState,
  PlayerState,
  RoomState,
  Direction,
  Position,
  Tile,
  InventoryItem,
} from '../types/game';
import { generateRoomTemplate, TUTORIAL_ROOM } from '../data/rooms';
import { getRandomRelic, RELICS } from '../data/relics';
import { TRAPS, getRandomTrapType } from '../data/traps';

export function createInitialPlayer(): PlayerState {
  return {
    position: { x: 1, y: 1 },
    stamina: 100,
    maxStamina: 100,
    weight: 0,
    maxWeight: 20,
    brightness: 3,
    maxBrightness: 5,
    curse: 0,
    maxCurse: 100,
    gold: 0,
    inventory: [],
    depth: 1,
    torchesRemaining: 5,
  };
}

function createRoomState(depth: number): RoomState {
  const template = depth === 1 ? TUTORIAL_ROOM : generateRoomTemplate(depth);

  const tiles: Tile[][] = template.tiles.map((row, y) =>
    row.map((type, x) => ({
      type,
      visible: false,
      lit: false,
      explored: false,
    }))
  );

  const mechanisms = template.mechanisms.map((m) => ({ ...m }));
  const doors = template.doors.map((d) => ({ ...d }));

  for (const door of doors) {
    if (tiles[door.position.y]?.[door.position.x]) {
      tiles[door.position.y][door.position.x].doorId = door.doorId;
    }
  }

  console.log(`[RoomInit] depth=${depth} 机关-门映射:`,
    mechanisms.map(m =>
      `机关[${m.id}](x=${m.position.x},y=${m.position.y}) -> 门[${m.linkedDoorId}]`
    ).join(' ; '),
    '门位置:',
    doors.map(d => `门[${d.doorId}](x=${d.position.x},y=${d.position.y})`).join(' ; ')
  );

  const traps = template.traps.map((t, i) => ({
    ...t,
    type: depth === 1 ? t.type : getRandomTrapType(depth),
    id: `trap_${i}_${Date.now()}`,
  }));

  const relics = template.relics.map((r, i) => {
    const relic = depth === 1 ? RELICS.find((rr) => rr.id === r.relicId)! : getRandomRelic(depth);
    return {
      ...r,
      relicId: relic.id,
      id: `relic_inst_${i}_${Date.now()}`,
    };
  });

  const torches = template.torches.map((pos) => ({
    position: { ...pos },
    fuel: 10 + Math.floor(Math.random() * 10),
  }));

  let entrance: Position = { x: 1, y: 1 };
  let exit: Position = { x: template.width - 2, y: template.height - 2 };

  for (let y = 0; y < template.height; y++) {
    for (let x = 0; x < template.width; x++) {
      if (template.tiles[y][x] === 'entrance') {
        entrance = { x, y };
      }
      if (template.tiles[y][x] === 'exit') {
        exit = { x, y };
      }
    }
  }

  return {
    templateId: template.id,
    width: template.width,
    height: template.height,
    tiles,
    mechanisms,
    doors,
    traps,
    relics,
    torches,
    entrance,
    exit,
  };
}

export function createInitialGame(): GameState {
  const player = createInitialPlayer();
  const room = createRoomState(1);

  player.position = { ...room.entrance };

  const game: GameState = {
    player,
    room,
    status: 'exploring',
    turn: 0,
    message: '欢迎来到遗迹！方向键/WASD移动，空格互动。提示：推石头🪨到机关🔘上开门🔒',
    escapeValue: 0,
  };

  updateVisibility(game);
  return game;
}

export function createGameFromSaved(saved: GameState): GameState {
  updateVisibility(saved);
  return saved;
}

function getDirectionOffset(direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { x: 0, y: -1 };
    case 'down':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
    case 'right':
      return { x: 1, y: 0 };
  }
}

export function movePlayer(game: GameState, direction: Direction): GameState {
  if (game.status !== 'exploring' && game.status !== 'escaping') return game;

  const newGame = deepClone(game);
  const offset = getDirectionOffset(direction);
  const newPos = {
    x: newGame.player.position.x + offset.x,
    y: newGame.player.position.y + offset.y,
  };

  if (
    newPos.x < 0 ||
    newPos.x >= newGame.room.width ||
    newPos.y < 0 ||
    newPos.y >= newGame.room.height
  ) {
    return newGame;
  }

  const targetTile = newGame.room.tiles[newPos.y][newPos.x];

  if (targetTile.type === 'wall') {
    return newGame;
  }

  if (targetTile.type === 'door') {
    const isOpen = targetTile.activated;
    if (!isOpen) {
      newGame.message = '门被锁住了，需要找到机关开启。';
      return newGame;
    }
  }

  if (targetTile.type === 'stone') {
    const stoneNewPos = {
      x: newPos.x + offset.x,
      y: newPos.y + offset.y,
    };

    if (
      stoneNewPos.x < 0 ||
      stoneNewPos.x >= newGame.room.width ||
      stoneNewPos.y < 0 ||
      stoneNewPos.y >= newGame.room.height
    ) {
      newGame.message = '石头推不动，后面是墙。';
      return newGame;
    }

    const stoneTargetTile = newGame.room.tiles[stoneNewPos.y][stoneNewPos.x];
    if (
      stoneTargetTile.type === 'wall' ||
      stoneTargetTile.type === 'stone' ||
      stoneTargetTile.type === 'door'
    ) {
      newGame.message = '石头推不动。';
      return newGame;
    }

    if (newGame.player.stamina < 5) {
      newGame.message = '体力不足，推不动石头。';
      return newGame;
    }

    newGame.player.stamina -= 5;

    if (stoneTargetTile.type === 'pressurePlate') {
      stoneTargetTile.activated = true;

      const plateMechanism = newGame.room.mechanisms.find(
        (m) =>
          m.position.x === stoneNewPos.x && m.position.y === stoneNewPos.y
      );
      if (plateMechanism) {
        plateMechanism.activated = true;
        const targetDoorId = plateMechanism.linkedDoorId;
        const targetDoor = newGame.room.doors.find(d => d.doorId === targetDoorId);
        openLinkedDoor(newGame, targetDoorId);
        if (targetDoor) {
          newGame.message = `🪨 石头压住了机关🔘，对应的门🚪(x=${targetDoor.position.x},y=${targetDoor.position.y})打开了！`;
        } else {
          newGame.message = '🪨 石头压住了机关🔘，对应的门打开了！';
        }
      }

      newGame.room.tiles[stoneNewPos.y][stoneNewPos.x] = {
        ...stoneTargetTile,
        type: 'pressurePlate',
      };
    } else {
      newGame.room.tiles[stoneNewPos.y][stoneNewPos.x] = {
        ...stoneTargetTile,
        type: 'stone',
      };
      newGame.message = '你推动了石头。';
    }

    newGame.room.tiles[newPos.y][newPos.x] = {
      ...targetTile,
      type: 'floor',
    };
  }

  newGame.player.position = newPos;
  newGame.player.stamina -= 1;
  newGame.turn += 1;

  checkTrap(newGame);
  checkRelic(newGame);
  checkEntranceExit(newGame);
  updateVisibility(newGame);

  if (newGame.player.stamina <= 0) {
    newGame.player.stamina = 0;
    newGame.status = 'defeat';
    newGame.message = '你精疲力竭，倒在了遗迹中...';
  }

  if (newGame.player.curse >= newGame.player.maxCurse) {
    newGame.status = 'defeat';
    newGame.message = '诅咒侵蚀了你的灵魂...';
  }

  return newGame;
}

function openLinkedDoor(game: GameState, doorId: string) {
  let openedCount = 0;
  for (const door of game.room.doors) {
    if (door.doorId === doorId) {
      const tile = game.room.tiles[door.position.y]?.[door.position.x];
      if (tile && tile.type === 'door' && !tile.activated) {
        tile.activated = true;
        openedCount++;
      }
    }
  }
  if (openedCount === 0) {
    console.warn(`[DoorDebug] 未找到可开启的门 doorId=${doorId}`, 
      game.room.doors.map(d => `(${d.position.x},${d.position.y}:${d.doorId})`).join(','));
  } else {
    console.log(`[DoorDebug] 机关 doorId=${doorId} 成功开启 ${openedCount} 扇门`);
  }
}

function checkTrap(game: GameState) {
  const { x, y } = game.player.position;
  const trap = game.room.traps.find(
    (t) => t.position.x === x && t.position.y === y && !t.triggered
  );

  if (trap) {
    trap.triggered = true;
    trap.visible = true;
    const trapData = TRAPS[trap.type];
    if (trapData) {
      if (trap.type === 'curse_mark') {
        game.player.curse += 15;
        game.message = `你触发了${trapData.name}！诅咒增加了15点。`;
      } else {
        game.player.stamina -= trapData.damage;
        game.message = `你触发了${trapData.name}！受到${trapData.damage}点伤害。`;
      }
    }
  }
}

function checkRelic(game: GameState) {
  const { x, y } = game.player.position;
  const relicInstance = game.room.relics.find(
    (r) => r.position.x === x && r.position.y === y && !r.collected
  );

  if (relicInstance) {
    const relicData = RELICS.find((r) => r.id === relicInstance.relicId);
    if (relicData) {
      if (game.player.weight + relicData.weight <= game.player.maxWeight) {
        relicInstance.collected = true;

        const item: InventoryItem = {
          id: `inv_${Date.now()}_${Math.random()}`,
          relicId: relicData.id,
          name: relicData.name,
          weight: relicData.weight,
          value: relicData.value,
          isGenuine: null,
          curseLevel: relicData.curseLevel,
          icon: relicData.icon,
          appraised: false,
        };

        game.player.inventory.push(item);
        game.player.weight += relicData.weight;
        game.player.curse += relicData.curseLevel;

        game.room.tiles[y][x] = {
          ...game.room.tiles[y][x],
          type: 'floor',
        };

        game.message = `你捡到了${relicData.name}！`;
      } else {
        game.message = `背包太满了，捡不起${relicData.name}。可按空格丢弃物品。`;
      }
    }
  }
}

function checkEntranceExit(game: GameState) {
  const { x, y } = game.player.position;
  const tile = game.room.tiles[y][x];

  if (tile.type === 'exit') {
    if (game.status === 'escaping') {
      game.status = 'victory';
      game.escapeValue = calculateEscapeValue(game);
      game.message = `🎉 成功从出口⬆️撤离！共获得 ${game.escapeValue} 金币！`;
      console.log('[Escape] 从出口撤离成功');
    } else {
      game.message = '这是通往下一层的出口⬆️。按空格进入下一层，或带着战利品从入口撤离。';
    }
  }

  if (tile.type === 'entrance') {
    if (game.status === 'escaping') {
      game.status = 'victory';
      game.escapeValue = calculateEscapeValue(game);
      game.message = `🎉 成功从入口🚪撤离！共获得 ${game.escapeValue} 金币！`;
      console.log('[Escape] 从入口撤离成功');
    } else if (game.turn > 0) {
      game.message = '这里是入口🚪。按空格可带着战利品选择撤离（推荐见好就收！）';
    }
  }
}

export function calculateEscapeValue(game: GameState): number {
  let total = 0;
  for (const item of game.player.inventory) {
    if (item.appraised && item.isGenuine === false) {
      total += Math.floor(item.value * 0.2);
    } else {
      total += item.value;
    }
  }
  return total;
}

export function updateVisibility(game: GameState) {
  const { x: px, y: py } = game.player.position;
  const brightness = game.player.brightness;

  for (let y = 0; y < game.room.height; y++) {
    for (let x = 0; x < game.room.width; x++) {
      const distance = Math.sqrt(Math.pow(x - px, 2) + Math.pow(y - py, 2));
      const tile = game.room.tiles[y][x];

      if (distance <= brightness) {
        tile.visible = true;
        tile.lit = true;
        tile.explored = true;
      } else if (distance <= brightness + 1) {
        tile.visible = true;
        tile.lit = false;
        tile.explored = true;
      } else {
        tile.visible = false;
        tile.lit = false;
      }
    }
  }

  for (const torch of game.room.torches) {
    if (torch.fuel > 0) {
      const torchX = torch.position.x;
      const torchY = torch.position.y;
      const torchRadius = 2;

      for (let y = 0; y < game.room.height; y++) {
        for (let x = 0; x < game.room.width; x++) {
          const dist = Math.sqrt(
            Math.pow(x - torchX, 2) + Math.pow(y - torchY, 2)
          );
          if (dist <= torchRadius) {
            const tile = game.room.tiles[y][x];
            tile.lit = true;
            tile.explored = true;

            const playerDist = Math.sqrt(
              Math.pow(x - px, 2) + Math.pow(y - py, 2)
            );
            if (playerDist <= brightness + 2) {
              tile.visible = true;
            }
          }
        }
      }
    }
  }
}

export function nextFloor(game: GameState): GameState {
  if (game.status !== 'exploring') return game;

  const { x, y } = game.player.position;
  if (game.room.tiles[y][x].type !== 'exit') {
    const newGame = deepClone(game);
    newGame.message = '需要站在出口⬆️才能进入下一层。';
    return newGame;
  }

  const newGame = deepClone(game);
  newGame.player.depth += 1;

  const newRoom = createRoomState(newGame.player.depth);
  newGame.room = newRoom;
  newGame.player.position = { ...newRoom.entrance };

  newGame.player.stamina = Math.min(
    newGame.player.maxStamina,
    newGame.player.stamina + 20
  );

  newGame.message = `进入第 ${newGame.player.depth} 层！体力恢复了一些。`;
  newGame.turn += 1;

  updateVisibility(newGame);
  return newGame;
}

export function startEscape(game: GameState): GameState {
  if (game.status !== 'exploring') return game;

  const newGame = deepClone(game);
  newGame.status = 'escaping';

  const { x, y } = newGame.player.position;
  const tile = newGame.room.tiles[y][x];

  if (tile.type === 'entrance' || tile.type === 'exit') {
    newGame.status = 'victory';
    newGame.escapeValue = calculateEscapeValue(newGame);
    newGame.message = `成功撤离！收益：${newGame.escapeValue} 金币`;
  } else {
    newGame.message = '开始撤离！回到入口🚪或出口⬆️即可离开遗迹结算收益。';
  }

  return newGame;
}

export function interact(game: GameState): GameState {
  if (game.status === 'victory' || game.status === 'defeat') return game;

  const newGame = deepClone(game);
  const { x, y } = newGame.player.position;
  const tile = newGame.room.tiles[y][x];

  console.log('[Interact] 位置:', x, y, '类型:', tile.type, '状态:', newGame.status);

  if (newGame.status === 'escaping') {
    if (tile.type === 'entrance' || tile.type === 'exit') {
      newGame.status = 'victory';
      newGame.escapeValue = calculateEscapeValue(newGame);
      newGame.message = `✅ 成功撤离！共获得 ${newGame.escapeValue} 金币！`;
      return newGame;
    }
    const entranceDir = findDirectionTo(newGame, newGame.room.entrance);
    const exitDir = findDirectionTo(newGame, newGame.room.exit);
    newGame.message = `🏃 撤离中！请走到入口🚪${entranceDir}或出口⬆️${exitDir}处，按空格或直接走过即可完成撤离。`;
    return newGame;
  }

  if (tile.type === 'exit') {
    console.log('[Interact] 在出口处，进入下一层');
    return nextFloor(newGame);
  }

  if (tile.type === 'entrance' && newGame.turn > 0) {
    console.log('[Interact] 在入口处（非开局），启动撤离');
    return startEscape(newGame);
  }

  if (tile.type === 'pressurePlate' && !tile.activated) {
    tile.activated = true;
    const plateMechanism = newGame.room.mechanisms.find(
      (m) => m.position.x === x && m.position.y === y
    );
    if (plateMechanism) {
      plateMechanism.activated = true;
      openLinkedDoor(newGame, plateMechanism.linkedDoorId);
      newGame.message = '🔘 你踩下了机关，对应的门打开了！';
      updateVisibility(newGame);
      return newGame;
    }
  }

  const relicInstance = newGame.room.relics.find(
    (r) => r.position.x === x && r.position.y === y && !r.collected
  );
  if (relicInstance) {
    console.log('[Interact] 尝试拾取遗物');
    checkRelic(newGame);
    return newGame;
  }

  const directions = [
    { dx: 0, dy: -1, name: '上' },
    { dx: 0, dy: 1, name: '下' },
    { dx: -1, dy: 0, name: '左' },
    { dx: 1, dy: 0, name: '右' },
  ];

  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;
    if (nx < 0 || nx >= newGame.room.width || ny < 0 || ny >= newGame.room.height) continue;
    const nearTile = newGame.room.tiles[ny][nx];
    if (nearTile.type === 'relic' || nearTile.type === 'pressurePlate' || nearTile.type === 'exit' || (nearTile.type === 'entrance' && newGame.turn > 0)) {
      newGame.message = `💡 提示：${dir.name}边有可互动对象，先移动过去再按空格吧！`;
      return newGame;
    }
  }

  if (newGame.player.inventory.length > 0) {
    const unappraised = newGame.player.inventory.filter(i => !i.appraised).length;
    newGame.message = unappraised > 0
      ? `💡 空格提示：站在入口🚪（非开局）或出口⬆️可撤离；站在机关🔘上可激活。背包有 ${unappraised} 件未鉴定文物，点击背包物品鉴定。`
      : '💡 空格提示：站在入口🚪或出口⬆️可撤离；去深处搜集更多宝物吧！';
  } else {
    newGame.message = '💡 空格提示：推石头🪨到机关🔘上开门；站在入口🚪（离开后再回来）或出口⬆️可撤离；站在遗物💎上可拾取。';
  }
  return newGame;
}

function findDirectionTo(game: GameState, target: Position): string {
  const dx = target.x - game.player.position.x;
  const dy = target.y - game.player.position.y;
  const parts: string[] = [];
  if (dy < 0) parts.push(`上${Math.abs(dy)}格`);
  if (dy > 0) parts.push(`下${dy}格`);
  if (dx < 0) parts.push(`左${Math.abs(dx)}格`);
  if (dx > 0) parts.push(`右${dx}格`);
  if (parts.length === 0) return '(就在这里)';
  return `(${parts.join('')})`;
}

export function useTorch(game: GameState): GameState {
  const newGame = deepClone(game);
  if (newGame.player.torchesRemaining <= 0) {
    newGame.message = '没有火把了！';
    return newGame;
  }

  if (newGame.player.brightness >= newGame.player.maxBrightness) {
    newGame.message = '亮度已经最大了。';
    return newGame;
  }

  newGame.player.torchesRemaining -= 1;
  newGame.player.brightness = Math.min(
    newGame.player.maxBrightness,
    newGame.player.brightness + 1
  );
  newGame.message = '点燃了火把，视野更亮了！';

  updateVisibility(newGame);
  return newGame;
}

export function appraiseItem(game: GameState, itemId: string): GameState {
  const newGame = deepClone(game);
  const item = newGame.player.inventory.find((i) => i.id === itemId);

  if (!item) return newGame;
  if (item.appraised) {
    newGame.message = '这件文物已经鉴定过了。';
    return newGame;
  }

  if (newGame.player.stamina < 10) {
    newGame.message = '体力不足，无法鉴定。';
    return newGame;
  }

  newGame.player.stamina -= 10;

  const relicData = RELICS.find((r) => r.id === item.relicId);
  const difficulty = relicData?.appraisalDifficulty || 50;
  const success = Math.random() * 100 > difficulty;

  if (success) {
    item.appraised = true;
    item.isGenuine = relicData?.isGenuine ?? false;
    if (item.isGenuine) {
      newGame.message = `鉴定成功！${item.name} 是真品！价值 ${item.value} 金币。`;
    } else {
      newGame.message = `鉴定成功！很遗憾，${item.name} 是赝品，只值 ${Math.floor(item.value * 0.2)} 金币。`;
    }
  } else {
    newGame.message = '鉴定失败，无法判断真伪。再试试？';
  }

  return newGame;
}

export function dropItem(game: GameState, itemId: string): GameState {
  const newGame = deepClone(game);
  const itemIndex = newGame.player.inventory.findIndex((i) => i.id === itemId);

  if (itemIndex === -1) return newGame;

  const item = newGame.player.inventory[itemIndex];
  newGame.player.inventory.splice(itemIndex, 1);
  newGame.player.weight -= item.weight;
  newGame.player.curse = Math.max(0, newGame.player.curse - item.curseLevel);
  newGame.message = `丢弃了 ${item.name}。负重减轻，诅咒降低。`;

  return newGame;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function rest(game: GameState): GameState {
  const newGame = deepClone(game);
  if (newGame.player.stamina >= newGame.player.maxStamina) {
    newGame.message = '体力已满。';
    return newGame;
  }

  newGame.player.stamina = Math.min(
    newGame.player.maxStamina,
    newGame.player.stamina + 20
  );
  newGame.turn += 3;

  if (Math.random() < 0.1) {
    newGame.player.curse += 5;
    newGame.message = '休息时感到一股寒意...诅咒增加了5点。';
  } else {
    newGame.message = '休息片刻，恢复了20点体力。';
  }

  return newGame;
}
