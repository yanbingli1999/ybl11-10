import React from 'react';
import { GameState } from '../types/game';

interface ControlPanelProps {
  game: GameState;
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onUseTorch: () => void;
  onRest: () => void;
  onNextFloor: () => void;
  onStartEscape: () => void;
  onRestart: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  game,
  onMove,
  onUseTorch,
  onRest,
  onNextFloor,
  onStartEscape,
  onRestart,
}) => {
  const isGameOver = game.status === 'victory' || game.status === 'defeat';
  const currentTile = game.room.tiles[game.player.position.y]?.[game.player.position.x];
  const isAtExit = currentTile?.type === 'exit';
  const isAtEntrance = currentTile?.type === 'entrance';
  const canEscape = game.status === 'exploring' && game.turn > 0 && (isAtEntrance || isAtExit);

  return (
    <div
      style={{
        backgroundColor: '#252540',
        padding: '16px',
        borderRadius: '8px',
        color: '#e0e0e0',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#c0c0ff' }}>
        🎮 操作
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => onMove('up')}
          disabled={isGameOver}
          style={buttonStyle}
        >
          ⬆️
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onMove('left')}
            disabled={isGameOver}
            style={buttonStyle}
          >
            ⬅️
          </button>
          <div style={buttonStyle}>{/* spacer */}</div>
          <button
            onClick={() => onMove('right')}
            disabled={isGameOver}
            style={buttonStyle}
          >
            ➡️
          </button>
        </div>
        <button
          onClick={() => onMove('down')}
          disabled={isGameOver}
          style={buttonStyle}
        >
          ⬇️
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onUseTorch}
          disabled={isGameOver || game.player.torchesRemaining <= 0}
          style={actionButtonStyle('#fbbf24')}
        >
          🔥 使用火把 ({game.player.torchesRemaining})
        </button>

        <button
          onClick={onRest}
          disabled={isGameOver}
          style={actionButtonStyle('#4ade80')}
        >
          😴 休息 (+20体力)
        </button>

        {isAtExit && game.status === 'exploring' && (
          <button
            onClick={onNextFloor}
            style={actionButtonStyle('#60a5fa')}
          >
            ⬇️ 进入下一层
          </button>
        )}

        {canEscape && (
          <button
            onClick={onStartEscape}
            style={actionButtonStyle('#f87171')}
          >
            🏃 携带战利品撤离
          </button>
        )}

        {game.status === 'escaping' && (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#f8717133',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '13px',
            }}
          >
            🏃 撤离中！回到入口🚪或出口⬆️撤离结算
          </div>
        )}

        {game.status === 'exploring' && game.turn > 0 && !canEscape && (
          <div
            style={{
              padding: '8px',
              backgroundColor: '#3d3d5c',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '12px',
              color: '#aaa',
            }}
          >
            💡 走到入口🚪或出口⬆️可选择撤离
          </div>
        )}

        {isGameOver && (
          <button onClick={onRestart} style={actionButtonStyle('#a855f7')}>
            🔄 重新开始
          </button>
        )}
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '8px',
          backgroundColor: '#1a1a2e',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#aaa',
        }}
      >
        <div>💡 提示:</div>
        <div>• 方向键/WASD 移动</div>
        <div>• 推石头到机关上开门</div>
        <div>• 小心陷阱和诅咒</div>
        <div>• 见好就收，及时撤离</div>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  fontSize: '18px',
  backgroundColor: '#3d3d5c',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const actionButtonStyle = (color: string): React.CSSProperties => ({
  padding: '10px 16px',
  backgroundColor: color,
  color: '#1a1a2e',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
});
