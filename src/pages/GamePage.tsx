import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GameState, Direction, ExpeditionRecord } from '../types/game';
import {
  createInitialGame,
  createGameFromSaved,
  movePlayer,
  useTorch,
  rest,
  nextFloor,
  startEscape,
  appraiseItem,
  dropItem,
  calculateEscapeValue,
  interact,
  moveItemInBackpack,
  migrateSavedGame,
} from '../engine/gameEngine';
import { GameBoard } from '../components/GameBoard';
import { StatusPanel } from '../components/StatusPanel';
import { InventoryPanel } from '../components/InventoryPanel';
import { ControlPanel } from '../components/ControlPanel';
import {
  saveExpeditionRecord,
  getTotalGold,
  getBestDepth,
  getExpeditionRecords,
  saveGame,
  loadSavedGame,
  hasSavedGame,
  clearSavedGame,
} from '../utils/storage';

function loadInitialState(): GameState {
  try {
    const saved = loadSavedGame();
    if (saved && saved.status !== 'victory' && saved.status !== 'defeat') {
      console.log('[Init] 从存档恢复游戏进度');
      return createGameFromSaved(saved);
    }
    if (saved) {
      console.log('[Init] 存档已是终局状态，清除并新建游戏');
      try { clearSavedGame(); } catch(e) {}
    }
  } catch (e) {
    console.error('[Init] 加载存档失败，新建游戏:', e);
  }
  return createInitialGame();
}

export const GamePage: React.FC = () => {
  const [game, setGame] = useState<GameState>(() => loadInitialState());
  const [showRecords, setShowRecords] = useState(false);
  const [restoredFromSave, setRestoredFromSave] = useState(() => {
    try {
      const saved = loadSavedGame();
      return !!(saved && saved.status !== 'victory' && saved.status !== 'defeat');
    } catch (e) { return false; }
  });
  const saveTimeoutRef = useRef<number | null>(null);

  const handleMove = useCallback((direction: Direction) => {
    setGame((prev) => movePlayer(prev, direction));
  }, []);

  const handleUseTorch = useCallback(() => {
    setGame((prev) => useTorch(prev));
  }, []);

  const handleRest = useCallback(() => {
    setGame((prev) => rest(prev));
  }, []);

  const handleNextFloor = useCallback(() => {
    setGame((prev) => nextFloor(prev));
  }, []);

  const handleStartEscape = useCallback(() => {
    setGame((prev) => startEscape(prev));
  }, []);

  const handleAppraise = useCallback((itemId: string) => {
    setGame((prev) => appraiseItem(prev, itemId));
  }, []);

  const handleDrop = useCallback((itemId: string) => {
    setGame((prev) => dropItem(prev, itemId));
  }, []);

  const handleMoveItem = useCallback((itemId: string, targetRow: number, targetCol: number) => {
    setGame((prev) => moveItemInBackpack(prev, itemId, targetRow, targetCol));
  }, []);

  const handleInteract = useCallback(() => {
    setGame((prev) => interact(prev));
  }, []);

  const handleRestart = useCallback(() => {
    try {
      clearSavedGame();
    } catch (e) {
      console.error(e);
    }
    setRestoredFromSave(false);
    setGame(createInitialGame());
  }, []);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    if (game.status === 'exploring' || game.status === 'escaping') {
      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          saveGame(game);
        } catch (e) {
          console.error('自动保存失败:', e);
        }
      }, 100);
    } else {
      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          clearSavedGame();
        } catch (e) {
          console.error(e);
        }
      }, 100);
    }

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [game]);

  const recordSavedRef = useRef(false);
  useEffect(() => {
    if (
      (game.status === 'victory' || game.status === 'defeat') &&
      !recordSavedRef.current
    ) {
      recordSavedRef.current = true;
      const record: ExpeditionRecord = {
        id: `exp_${Date.now()}`,
        date: new Date().toLocaleString('zh-CN'),
        depth: game.player.depth,
        goldEarned: game.status === 'victory' ? calculateEscapeValue(game) : 0,
        relicsCollected: game.player.inventory.length,
        survived: game.status === 'victory',
        causeOfDeath: game.status === 'defeat' ? game.message : undefined,
      };
      try {
        saveExpeditionRecord(record);
      } catch (e) {
        console.error('保存探险记录失败:', e);
      }
    }
    if (game.status === 'exploring' || game.status === 'escaping') {
      recordSavedRef.current = false;
    }
  }, [game.status, game.player.depth, game.player.inventory.length, game.escapeValue, game.message]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (game.status === 'victory' || game.status === 'defeat') {
        if (e.key === 'r' || e.key === 'R') {
          handleRestart();
        }
        return;
      }

      const isSpace = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('right');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          handleUseTorch();
          break;
        case 'r':
        case 'R':
          if (!isSpace) {
            e.preventDefault();
            handleRest();
          }
          break;
      }

      if (isSpace) {
        e.preventDefault();
        console.log('[Key] 空格键触发互动');
        handleInteract();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    game.status,
    handleMove,
    handleUseTorch,
    handleRest,
    handleRestart,
    handleInteract,
  ]);

  const canAppraise = game.player.stamina >= 10;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f1a',
        color: '#e0e0e0',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: '#c0c0ff', fontSize: '28px' }}>
            🏛️ 遗迹搬砖者
          </h1>
          <p style={{ color: '#888', marginTop: '4px' }}>
            肉鸽网格探索 · 推石解谜 · 重心管理 · 文物鉴定
          </p>
          <div style={{ fontSize: '14px', color: '#aaa', marginTop: '8px' }}>
            累计金币: 💰 {getTotalGold()} | 最深层数: 🏛️ {getBestDepth()}
            {restoredFromSave && (
              <span style={{ color: '#4ade80', marginLeft: '12px' }}>
                ✅ 已从存档恢复进度
              </span>
            )}
            <button
              onClick={() => setShowRecords(!showRecords)}
              style={{
                marginLeft: '16px',
                padding: '4px 12px',
                backgroundColor: '#3d3d5c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📜 探险记录
            </button>
            {hasSavedGame() && (game.status === 'exploring' || game.status === 'escaping') && (
              <span style={{ color: '#fbbf24', marginLeft: '12px', fontSize: '12px' }}>
                💾 进度自动保存中
              </span>
            )}
          </div>
        </header>

        {showRecords && (
          <div
            style={{
              backgroundColor: '#252540',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>📜 探险记录</h3>
            {getExpeditionRecords().length === 0 ? (
              <p style={{ color: '#888' }}>还没有探险记录</p>
            ) : (
              <table style={{ width: '100%', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#aaa' }}>
                    <th style={{ textAlign: 'left' }}>日期</th>
                    <th style={{ textAlign: 'left' }}>层数</th>
                    <th style={{ textAlign: 'left' }}>结果</th>
                    <th style={{ textAlign: 'left' }}>金币</th>
                    <th style={{ textAlign: 'left' }}>文物</th>
                  </tr>
                </thead>
                <tbody>
                  {getExpeditionRecords().slice(0, 10).map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.depth}层</td>
                      <td style={{ color: record.survived ? '#4ade80' : '#f87171' }}>
                        {record.survived ? '✅ 成功撤离' : '💀 探险失败'}
                      </td>
                      <td>💰 {record.goldEarned}</td>
                      <td>{record.relicsCollected}件</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#1a1a2e',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '15px',
            color: '#f0f0f0',
            minHeight: '24px',
          }}
        >
          {game.message}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <StatusPanel
              player={game.player}
              turn={game.turn}
              status={game.status}
            />
            <ControlPanel
              game={game}
              onMove={handleMove}
              onUseTorch={handleUseTorch}
              onRest={handleRest}
              onNextFloor={handleNextFloor}
              onStartEscape={handleStartEscape}
              onRestart={handleRestart}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <GameBoard game={game} />
            <button
              onClick={handleInteract}
              style={{
                padding: '10px 24px',
                backgroundColor: '#a855f7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
              }}
            >
              ⌨️ 空格互动 (站在入口/出口/机关处)
            </button>
          </div>

          <InventoryPanel
            inventory={game.player.inventory}
            gravityOffset={game.player.gravityOffset}
            gravityPenalty={game.player.gravityPenalty}
            onAppraise={handleAppraise}
            onDrop={handleDrop}
            onMoveItem={handleMoveItem}
            canAppraise={canAppraise}
          />
        </div>

        {(game.status === 'victory' || game.status === 'defeat') && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <div
              style={{
                backgroundColor: '#252540',
                padding: '40px',
                borderRadius: '12px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>
                {game.status === 'victory' ? '🎉' : '💀'}
              </div>
              <h2
                style={{
                  color: game.status === 'victory' ? '#4ade80' : '#f87171',
                  marginTop: 0,
                }}
              >
                {game.status === 'victory' ? '探险成功！' : '探险失败...'}
              </h2>
              <p style={{ marginBottom: '20px' }}>{game.message}</p>
              {game.status === 'victory' && (
                <div
                  style={{
                    backgroundColor: '#1a1a2e',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ fontSize: '24px', color: '#fbbf24' }}>
                    💰 {game.escapeValue} 金币
                  </div>
                  <div style={{ fontSize: '14px', color: '#aaa', marginTop: '8px' }}>
                    探索了 {game.player.depth} 层遗迹
                  </div>
                </div>
              )}
              <button
                onClick={handleRestart}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#a855f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                🔄 再来一次
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
