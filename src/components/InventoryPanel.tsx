import React, { useState } from 'react';
import { InventoryItem, BACKPACK_ROWS, BACKPACK_COLS } from '../types/game';

interface InventoryPanelProps {
  inventory: InventoryItem[];
  gravityOffset: number;
  gravityPenalty: number;
  onAppraise: (itemId: string) => void;
  onDrop: (itemId: string) => void;
  onMoveItem: (itemId: string, targetRow: number, targetCol: number) => void;
  canAppraise: boolean;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  inventory,
  gravityOffset,
  gravityPenalty,
  onAppraise,
  onDrop,
  onMoveItem,
  canAppraise,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItemData = inventory.find((i) => i.id === selectedItemId);

  const getItemAt = (row: number, col: number): InventoryItem | undefined => {
    return inventory.find((i) => i.gridRow === row && i.gridCol === col);
  };

  const handleCellClick = (row: number, col: number) => {
    const clickedItem = getItemAt(row, col);

    if (selectedItemId) {
      if (clickedItem && clickedItem.id === selectedItemId) {
        setSelectedItemId(null);
        return;
      }
      onMoveItem(selectedItemId, row, col);
      setSelectedItemId(null);
      return;
    }

    if (clickedItem) {
      setSelectedItemId(clickedItem.id);
    }
  };

  const gravityDirection = gravityOffset > 0.01 ? '→右' : gravityOffset < -0.01 ? '←左' : '平衡';
  const gravityColor =
    gravityPenalty < 0.1 ? '#4ade80' : gravityPenalty < 0.4 ? '#fbbf24' : '#f87171';

  const leftWeight = inventory
    .filter((i) => i.gridCol === 0)
    .reduce((s, i) => s + i.weight, 0);
  const centerWeight = inventory
    .filter((i) => i.gridCol === 1)
    .reduce((s, i) => s + i.weight, 0);
  const rightWeight = inventory
    .filter((i) => i.gridCol === 2)
    .reduce((s, i) => s + i.weight, 0);

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
      <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#c0c0ff' }}>
        🎒 格子背包 ({inventory.length}/{BACKPACK_ROWS * BACKPACK_COLS})
      </h3>

      <div
        style={{
          backgroundColor: '#1a1a2e',
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span>⚖️ 重心:</span>
          <span style={{ color: gravityColor, fontWeight: 'bold' }}>{gravityDirection}</span>
          {gravityPenalty > 0.01 && (
            <span style={{ color: gravityColor, fontSize: '11px' }}>
              (推石失败+{Math.round(gravityPenalty * 50)}% | 体力消耗+{Math.round(gravityPenalty * 200)}%)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#aaa' }}>
          <span>左列: {leftWeight}kg</span>
          <span>中列: {centerWeight}kg</span>
          <span>右列: {rightWeight}kg</span>
        </div>
        <div
          style={{
            marginTop: '6px',
            height: '6px',
            backgroundColor: '#2d2d44',
            borderRadius: '3px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '2px',
              height: '100%',
              backgroundColor: '#666',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              height: '100%',
              width: '8px',
              borderRadius: '3px',
              backgroundColor: gravityColor,
              left: `${50 + gravityOffset * 50}%`,
              transform: 'translateX(-50%)',
              transition: 'left 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BACKPACK_COLS}, 1fr)`,
          gap: '4px',
          marginBottom: '12px',
        }}
      >
        {Array.from({ length: BACKPACK_ROWS * BACKPACK_COLS }).map((_, idx) => {
          const row = Math.floor(idx / BACKPACK_COLS);
          const col = idx % BACKPACK_COLS;
          const item = getItemAt(row, col);
          const isSelected = selectedItemId === item?.id;
          const isTarget = selectedItemId && !item;

          return (
            <div
              key={`${row}-${col}`}
              onClick={() => handleCellClick(row, col)}
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: item
                  ? isSelected
                    ? '#4a4a7a'
                    : '#2a2a4e'
                  : isTarget
                  ? '#3a3a5a'
                  : '#1a1a2e',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: isSelected
                  ? '2px solid #8888ff'
                  : isTarget
                  ? '2px dashed #6666aa'
                  : '1px solid #3d3d5c',
                position: 'relative',
                transition: 'all 0.15s ease',
                userSelect: 'none',
              }}
              title={
                item
                  ? `${item.name} (重量:${item.weight} 价值:${item.value})\n点击选中，再点空格/其他物品交换位置`
                  : selectedItemId
                  ? '点击放入此位置'
                  : '空格'
              }
            >
              {item ? (
                <>
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#aaa',
                      marginTop: '2px',
                    }}
                  >
                    {item.weight}kg
                  </span>
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
                </>
              ) : (
                <span style={{ fontSize: '12px', color: '#444' }}>
                  {row},{col}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {selectedItemId && (
        <div
          style={{
            padding: '6px 10px',
            backgroundColor: '#3d3d5c',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#bbb',
            marginBottom: '10px',
            textAlign: 'center',
          }}
        >
          💡 点击空格或另一物品来交换位置
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
          <div style={{ color: '#aaa', marginBottom: '4px' }}>
            重量: {selectedItemData.weight} | 价值: {selectedItemData.value}金
          </div>
          <div style={{ color: '#aaa', marginBottom: '4px' }}>
            位置: 第{selectedItemData.gridRow + 1}行 第{selectedItemData.gridCol + 1}列 | 诅咒: {selectedItemData.curseLevel}
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
                setSelectedItemId(null);
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
