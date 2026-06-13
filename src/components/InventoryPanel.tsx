import React, { useState } from 'react';
import { InventoryItem } from '../types/game';

interface InventoryPanelProps {
  inventory: InventoryItem[];
  onAppraise: (itemId: string) => void;
  onDrop: (itemId: string) => void;
  canAppraise: boolean;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  inventory,
  onAppraise,
  onDrop,
  canAppraise,
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const selectedItemData = inventory.find((i) => i.id === selectedItem);

  return (
    <div
      style={{
        backgroundColor: '#252540',
        padding: '16px',
        borderRadius: '8px',
        color: '#e0e0e0',
        minWidth: '280px',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#c0c0ff' }}>
        🎒 背包 ({inventory.length}件)
      </h3>

      {inventory.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic' }}>背包是空的</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {inventory.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item.id)}
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: selectedItem === item.id ? '#4a4a7a' : '#1a1a2e',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                cursor: 'pointer',
                border: selectedItem === item.id ? '2px solid #8888ff' : '2px solid transparent',
                position: 'relative',
              }}
              title={item.name}
            >
              {item.icon}
              {item.appraised && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '4px',
                    fontSize: '10px',
                  }}
                >
                  {item.isGenuine ? '✓' : '✗'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedItemData && (
        <div
          style={{
            backgroundColor: '#1a1a2e',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>
            {selectedItemData.icon} <strong>{selectedItemData.name}</strong>
          </div>
          <div style={{ color: '#aaa', marginBottom: '6px' }}>
            重量: {selectedItemData.weight} | 价值: {selectedItemData.value}金
          </div>
          <div style={{ color: '#aaa', marginBottom: '8px' }}>
            诅咒等级: {selectedItemData.curseLevel}
          </div>
          {selectedItemData.appraised ? (
            <div
              style={{
                color: selectedItemData.isGenuine ? '#4ade80' : '#f87171',
                marginBottom: '8px',
              }}
            >
              {selectedItemData.isGenuine ? '✨ 真品' : '💔 赝品'}
            </div>
          ) : (
            <div style={{ color: '#fbbf24', marginBottom: '8px' }}>
              ❓ 未鉴定
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {!selectedItemData.appraised && (
              <button
                onClick={() => onAppraise(selectedItemData.id)}
                disabled={!canAppraise}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  backgroundColor: canAppraise ? '#4a6fa5' : '#3d3d5c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: canAppraise ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                }}
              >
                🔍 鉴定 (10体力)
              </button>
            )}
            <button
              onClick={() => {
                onDrop(selectedItemData.id);
                setSelectedItem(null);
              }}
              style={{
                flex: 1,
                padding: '6px 12px',
                backgroundColor: '#a54a4a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              🗑️ 丢弃
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
