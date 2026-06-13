import { RoomTemplate, TileType, Position, DoorInstance } from '../types/game';

function createEmptyRoom(width: number, height: number): TileType[][] {
  const tiles: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push('wall');
      } else {
        row.push('floor');
      }
    }
    tiles.push(row);
  }
  return tiles;
}

function addEntranceExit(
  tiles: TileType[][],
  entrance: Position,
  exit: Position
): TileType[][] {
  const newTiles = tiles.map((row) => [...row]);
  newTiles[entrance.y][entrance.x] = 'entrance';
  newTiles[exit.y][exit.x] = 'exit';
  return newTiles;
}

export function generateRoomTemplate(depth: number): RoomTemplate {
  const width = 10 + Math.floor(Math.random() * 5);
  const height = 8 + Math.floor(Math.random() * 4);

  let tiles = createEmptyRoom(width, height);

  const entrance: Position = { x: 1, y: Math.floor(height / 2) };
  const exit: Position = { x: width - 2, y: Math.floor(height / 2) };

  const wallCount = Math.floor(width * height * 0.1) + depth;
  for (let i = 0; i < wallCount; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    if (
      !(x === entrance.x && y === entrance.y) &&
      !(x === exit.x && y === exit.y)
    ) {
      tiles[y][x] = 'wall';
    }
  }

  const stoneCount = 2 + Math.floor(Math.random() * 3) + Math.floor(depth / 2);
  for (let i = 0; i < stoneCount; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    if (
      tiles[y][x] === 'floor' &&
      !(x === entrance.x && y === entrance.y) &&
      !(x === exit.x && y === exit.y)
    ) {
      tiles[y][x] = 'stone';
    }
  }

  const plateCount = 1 + Math.floor(Math.random() * 2);
  const mechanisms = [];
  const doors: DoorInstance[] = [];
  for (let i = 0; i < plateCount; i++) {
    const doorId = `door_${i}`;
    let platePlaced = false;
    for (let attempt = 0; attempt < 50 && !platePlaced; attempt++) {
      const x = 2 + Math.floor(Math.random() * (width - 4));
      const y = 1 + Math.floor(Math.random() * (height - 2));
      if (tiles[y][x] === 'floor') {
        tiles[y][x] = 'pressurePlate';
        mechanisms.push({
          id: `plate_${i}`,
          type: 'pressurePlate' as const,
          position: { x, y },
          linkedDoorId: doorId,
          activated: false,
        });
        platePlaced = true;
      }
    }

    let doorPlaced = false;
    for (let attempt = 0; attempt < 50 && !doorPlaced; attempt++) {
      const doorX = Math.floor(width / 2) + Math.floor(Math.random() * 3) - 1;
      const doorY = 1 + Math.floor(Math.random() * (height - 2));
      if (
        (tiles[doorY]?.[doorX] === 'floor' || tiles[doorY]?.[doorX] === 'wall') &&
        !(doorX === entrance.x && doorY === entrance.y) &&
        !(doorX === exit.x && doorY === exit.y)
      ) {
        tiles[doorY][doorX] = 'door';
        doors.push({ position: { x: doorX, y: doorY }, doorId });
        doorPlaced = true;
      }
    }
  }

  tiles = addEntranceExit(tiles, entrance, exit);

  const trapCount = Math.floor(depth / 2) + Math.floor(Math.random() * 3);
  const traps = [];
  for (let i = 0; i < trapCount; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    if (tiles[y][x] === 'floor') {
      traps.push({
        id: `trap_${i}`,
        type: 'spike',
        position: { x, y },
        triggered: false,
        visible: false,
      });
    }
  }

  const relicCount = 1 + Math.floor(Math.random() * 3);
  const relics = [];
  for (let i = 0; i < relicCount; i++) {
    const x = 2 + Math.floor(Math.random() * (width - 4));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    if (tiles[y][x] === 'floor') {
      tiles[y][x] = 'relic';
      relics.push({
        id: `relic_instance_${i}`,
        relicId: '',
        position: { x, y },
        collected: false,
      });
    }
  }

  const torchCount = 2 + Math.floor(Math.random() * 2);
  const torches: Position[] = [];
  for (let i = 0; i < torchCount; i++) {
    const x = 1 + Math.floor(Math.random() * (width - 2));
    const y = 1 + Math.floor(Math.random() * (height - 2));
    if (tiles[y][x] === 'wall') {
      torches.push({ x, y });
    }
  }

  return {
    id: `room_depth_${depth}_${Date.now()}`,
    name: `第 ${depth} 层遗迹`,
    width,
    height,
    tiles,
    mechanisms,
    doors,
    traps,
    relics,
    torches,
  };
}

export const TUTORIAL_ROOM: RoomTemplate = {
  id: 'tutorial_room',
  name: '入口大厅',
  width: 12,
  height: 9,
  tiles: [
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'entrance', 'floor', 'floor', 'floor', 'wall', 'wall', 'floor', 'floor', 'floor', 'exit', 'wall'],
    ['wall', 'floor', 'floor', 'stone', 'floor', 'wall', 'wall', 'floor', 'relic', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'door', 'door', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'wall', 'wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'pressurePlate', 'floor', 'floor', 'wall', 'wall', 'floor', 'pressurePlate', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'wall', 'wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'floor', 'floor', 'floor', 'floor', 'wall', 'wall', 'floor', 'trap', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
  ],
  mechanisms: [
    {
      id: 'plate_1',
      type: 'pressurePlate',
      position: { x: 2, y: 5 },
      linkedDoorId: 'door_1',
      activated: false,
    },
    {
      id: 'plate_2',
      type: 'pressurePlate',
      position: { x: 8, y: 5 },
      linkedDoorId: 'door_2',
      activated: false,
    },
  ],
  doors: [
    {
      position: { x: 5, y: 3 },
      doorId: 'door_1',
    },
    {
      position: { x: 6, y: 3 },
      doorId: 'door_2',
    },
  ],
  traps: [
    {
      id: 'trap_1',
      type: 'spike',
      position: { x: 8, y: 7 },
      triggered: false,
      visible: false,
    },
  ],
  relics: [
    {
      id: 'relic_1',
      relicId: 'bronze_mirror',
      position: { x: 8, y: 2 },
      collected: false,
    },
  ],
  torches: [
    { x: 0, y: 1 },
    { x: 11, y: 1 },
  ],
};
