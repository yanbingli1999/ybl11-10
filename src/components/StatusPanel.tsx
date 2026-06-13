import React from 'react';
import { PlayerState } from '../types/game';

interface StatusPanelProps {
  player: PlayerState;
  turn: number;
  status: string;
}

const StatBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}> = ({ label, value, max, color, icon }) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '14px',
        }}
      >
        <span>
          {icon} {label}
        </span>
        <span>
          {Math.floor(value)}/{max}
        </span>
      </div>
      <div
        style={{
          height: '12px',
          backgroundColor: '#2d2d44',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: color,
            width: `${percentage}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

const GravityBar: React.FC<{
  offset: number;
  penalty: number;
}> = ({ offset, penalty }) => {
  const direction = offset > 0.01 ? '偏右 →' : offset < -0.01 ? '← 偏左' : '平衡';
  const color = penalty < 0.1 ? '#4ade80' : penalty < 0.4 ? '#fbbf24' : '#f87171';
  const penaltyPct = Math.round(penalty * 100);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
          fontSize: '14px',
        }}
      >
        <span>⚖️ 重心</span>
        <span style={{ color, fontSize: '12px' }}>{direction}</span>
      </div>
      <div
        style={{
          height: '12px',
          backgroundColor: '#2d2d44',
          borderRadius: '6px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '1px',
            height: '100%',
            backgroundColor: '#555',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '8px',
            borderRadius: '3px',
            backgroundColor: color,
            left: `${50 + offset * 50}%`,
            transform: 'translateX(-50%)',
            transition: 'left 0.3s ease',
          }}
        />
      </div>
      {penalty > 0.01 && (
        <div style={{ fontSize: '11px', color, marginTop: '2px' }}>
          惩罚: 推石失败+{Math.round(penalty * 50)}% | 移动消耗+{Math.round(penalty * 200)}%
        </div>
      )}
    </div>
  );
};

export const StatusPanel: React.FC<StatusPanelProps> = ({
  player,
  turn,
  status,
}) => {
  const statusText: Record<string, string> = {
    exploring: '🔍 探索中',
    escaping: '🏃 撤离中',
    victory: '🎉 胜利',
    defeat: '💀 失败',
  };

  return (
    <div
      style={{
        backgroundColor: '#252540',
        padding: '16px',
        borderRadius: '8px',
        color: '#e0e0e0',
        minWidth: '200px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#c0c0ff' }}>
        📊 状态
      </h3>

      <div
        style={{
          padding: '8px',
          backgroundColor: '#1a1a2e',
          borderRadius: '4px',
          marginBottom: '16px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        {statusText[status] || status}
      </div>

      <StatBar
        label="体力"
        value={player.stamina}
        max={player.maxStamina}
        color="#4ade80"
        icon="💚"
      />

      <StatBar
        label="负重"
        value={player.weight}
        max={player.maxWeight}
        color="#fbbf24"
        icon="🎒"
      />

      <GravityBar offset={player.gravityOffset} penalty={player.gravityPenalty} />

      <StatBar
        label="亮度"
        value={player.brightness}
        max={player.maxBrightness}
        color="#fde047"
        icon="💡"
      />

      <StatBar
        label="诅咒"
        value={player.curse}
        max={player.maxCurse}
        color="#a855f7"
        icon="☠️"
      />

      <div
        style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #3d3d5c',
          fontSize: '14px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>
          🏛️ 层数: <strong>{player.depth}</strong>
        </div>
        <div style={{ marginBottom: '8px' }}>
          🔥 火把: <strong>{player.torchesRemaining}</strong>
        </div>
        <div style={{ marginBottom: '8px' }}>
          ⏱️ 回合: <strong>{turn}</strong>
        </div>
        <div>
          💰 金币: <strong>{player.gold}</strong>
        </div>
      </div>
    </div>
  );
};
