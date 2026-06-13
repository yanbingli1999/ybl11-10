import React from 'react';
import { GameState } from '../types/game';

interface GameBoardProps {
  game: GameState;
}

const TILE_SIZE = 40;

const tileIcons: Record<string, string> = {
  wall: '🧱',
  floor: '',
  entrance: '🚪',
  exit: '⬆️',
  stone: '🪨',
  pressurePlate: '🔘',
  door: '🚪',
  trap: '⚠️',
  relic: '💎',
  torch: '🔥',
  chest: '📦',
};

export const GameBoard: React.FC<GameBoardProps> = ({ game }) => {
  const { room, player } = game;

  const getTileStyle = (tile: any, x: number, y: number): React.CSSProperties => {
    const isPlayer = player.position.x === x && player.position.y === y;
    const baseStyle: React.CSSProperties = {
      width: TILE_SIZE,
      height: TILE_SIZE,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      position: 'relative',
      transition: 'all 0.2s ease',
    };

    if (!tile.visible && !tile.explored) {
      return { ...baseStyle, backgroundColor: '#1a1a2e' };
    }

    if (!tile.visible && tile.explored) {
      return { ...baseStyle, backgroundColor: '#2d2d44', opacity: 0.5 };
    }

    let bgColor = '#3d3d5c';
    switch (tile.type) {
      case 'wall':
        bgColor = '#4a4a6a';
        break;
      case 'floor':
        bgColor = tile.lit ? '#5a5a7a' : '#3d3d5c';
        break;
      case 'entrance':
        bgColor = '#2d5a2d';
        break;
      case 'exit':
        bgColor = '#5a5a2d';
        break;
      case 'door':
        bgColor = tile.activated ? '#2d5a5a' : '#5a2d2d';
        break;
      case 'pressurePlate':
        bgColor = tile.activated ? '#4a7a4a' : '#5a5a5a';
        break;
      default:
        bgColor = tile.lit ? '#5a5a7a' : '#3d3d5c';
    }

    return { ...baseStyle, backgroundColor: bgColor };
  };

  const getTileContent = (tile: any, x: number, y: number) => {
    const isPlayer = player.position.x === x && player.position.y === y;
    
    if (isPlayer) {
      return <span style={{ zIndex: 10 }}>🧙</span>;
    }

    if (!tile.visible && !tile.explored) {
      return null;
    }

    const trap = room.traps.find(
      (t) => t.position.x === x && t.position.y === y && t.visible
    );
    if (trap && tile.visible) {
      return trap.triggered ? '💥' : '⚠️';
    }

    const relic = room.relics.find(
      (r) => r.position.x === x && r.position.y === y && !r.collected
    );
    if (relic && tile.visible) {
      return '💎';
    }

    const torch = room.torches.find(
      (t) => t.position.x === x && t.position.y === y && t.fuel > 0
    );
    if (torch && tile.visible) {
      return '🔥';
    }

    if (tile.type === 'door') {
      return tile.activated ? '🚪' : '🔒';
    }

    return tileIcons[tile.type] || '';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#1a1a2e',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${room.width}, ${TILE_SIZE}px)`,
          gap: '1px',
          backgroundColor: '#1a1a2e',
          border: '3px solid #4a4a6a',
          borderRadius: '4px',
          padding: '2px',
        }}
      >
        {room.tiles.map((row, y) =>
          row.map((tile, x) => (
            <div key={`${x}-${y}`} style={getTileStyle(tile, x, y)}>
              {getTileContent(tile, x, y)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
