import { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  vx?: number;
  vy?: number;
  health?: number;
  type?: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  owner: 'player' | 'enemy';
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

interface GameCanvasProps {
  onGameOver?: () => void;
  onMoneyChange?: (money: number) => void;
}

export default function GameCanvas({ onGameOver, onMoneyChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    player: { x: 100, y: 500, width: 40, height: 40, color: '#4A7C59', health: 100, speed: 3 },
    enemies: [] as GameObject[],
    bullets: [] as Bullet[],
    explosions: [] as Explosion[],
    keys: {} as Record<string, boolean>,
    money: 100000,
    kills: 0,
    lastEnemySpawn: 0,
    lastShot: 0,
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const state = gameStateRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      state.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      state.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.mouseX = e.clientX - rect.left;
      state.mouseY = e.clientY - rect.top;
    };

    const handleClick = () => {
      const now = Date.now();
      if (now - state.lastShot < 200) return;
      state.lastShot = now;

      const dx = state.mouseX - (state.player.x + state.player.width / 2);
      const dy = state.mouseY - (state.player.y + state.player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      state.bullets.push({
        x: state.player.x + state.player.width / 2,
        y: state.player.y + state.player.height / 2,
        vx: (dx / distance) * 8,
        vy: (dy / distance) * 8,
        damage: 25,
        owner: 'player',
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const spawnEnemy = () => {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      state.enemies.push({
        x: side === 'left' ? -50 : canvas.width + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        width: 35,
        height: 35,
        color: '#EA384C',
        health: 50,
        type: 'tank',
      });
    };

    const updateGame = () => {
      if (state.keys['w'] || state.keys['arrowup']) {
        state.player.y = Math.max(0, state.player.y - state.player.speed);
      }
      if (state.keys['s'] || state.keys['arrowdown']) {
        state.player.y = Math.min(canvas.height - state.player.height, state.player.y + state.player.speed);
      }
      if (state.keys['a'] || state.keys['arrowleft']) {
        state.player.x = Math.max(0, state.player.x - state.player.speed);
      }
      if (state.keys['d'] || state.keys['arrowright']) {
        state.player.x = Math.min(canvas.width - state.player.width, state.player.x + state.player.speed);
      }

      const now = Date.now();
      if (now - state.lastEnemySpawn > 2000 && state.enemies.length < 8) {
        spawnEnemy();
        state.lastEnemySpawn = now;
      }

      state.enemies.forEach((enemy) => {
        const dx = state.player.x - enemy.x;
        const dy = state.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
          enemy.x += (dx / distance) * 1.5;
          enemy.y += (dy / distance) * 1.5;
        }

        if (Math.random() < 0.01 && distance < 400) {
          const bulletDx = state.player.x - enemy.x;
          const bulletDy = state.player.y - enemy.y;
          const bulletDist = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
          
          state.bullets.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height / 2,
            vx: (bulletDx / bulletDist) * 6,
            vy: (bulletDy / bulletDist) * 6,
            damage: 15,
            owner: 'enemy',
          });
        }
      });

      state.bullets = state.bullets.filter((bullet) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
          return false;
        }

        if (bullet.owner === 'player') {
          for (let i = state.enemies.length - 1; i >= 0; i--) {
            const enemy = state.enemies[i];
            if (
              bullet.x > enemy.x &&
              bullet.x < enemy.x + enemy.width &&
              bullet.y > enemy.y &&
              bullet.y < enemy.y + enemy.height
            ) {
              enemy.health! -= bullet.damage;
              
              if (enemy.health! <= 0) {
                state.explosions.push({
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height / 2,
                  radius: 30,
                  alpha: 1,
                });
                state.enemies.splice(i, 1);
                state.money += 15;
                state.kills++;
                onMoneyChange?.(state.money);
              }
              
              return false;
            }
          }
        } else {
          if (
            bullet.x > state.player.x &&
            bullet.x < state.player.x + state.player.width &&
            bullet.y > state.player.y &&
            bullet.y < state.player.y + state.player.height
          ) {
            state.player.health -= bullet.damage;
            
            if (state.player.health <= 0) {
              onGameOver?.();
            }
            
            return false;
          }
        }

        return true;
      });

      state.explosions = state.explosions.filter((exp) => {
        exp.radius += 2;
        exp.alpha -= 0.05;
        return exp.alpha > 0;
      });
    };

    const renderGame = () => {
      ctx.fillStyle = '#1A1F2C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#2A3F3C';
      for (let i = 0; i < 50; i++) {
        const x = (i * 100 + Date.now() / 20) % canvas.width;
        ctx.fillRect(x, 0, 2, canvas.height);
      }

      ctx.fillStyle = state.player.color;
      ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);
      
      ctx.fillStyle = '#FEC6A1';
      ctx.fillRect(state.player.x + 10, state.player.y + 10, 8, 8);
      ctx.fillRect(state.player.x + 22, state.player.y + 10, 8, 8);
      
      ctx.fillStyle = '#2A4A2A';
      ctx.fillRect(state.player.x + 30, state.player.y + 15, 15, 10);

      state.enemies.forEach((enemy) => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 8, 8);
        ctx.fillRect(enemy.x + 19, enemy.y + 8, 8, 8);
        
        ctx.fillStyle = '#A52A2A';
        ctx.fillRect(enemy.x, enemy.y + 15, 15, 10);
        
        const healthPercent = (enemy.health || 50) / 50;
        ctx.fillStyle = '#333';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
        ctx.fillStyle = healthPercent > 0.5 ? '#4A7C59' : healthPercent > 0.25 ? '#FEC6A1' : '#EA384C';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
      });

      state.bullets.forEach((bullet) => {
        ctx.fillStyle = bullet.owner === 'player' ? '#FEC6A1' : '#FF6B6B';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      state.explosions.forEach((exp) => {
        ctx.globalAlpha = exp.alpha;
        const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        gradient.addColorStop(0, '#FEC6A1');
        gradient.addColorStop(0.5, '#EA384C');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      ctx.fillStyle = '#FEC6A1';
      ctx.font = 'bold 20px Orbitron';
      ctx.fillText(`HP: ${state.player.health}`, 20, 40);
      ctx.fillText(`💰 $${state.money.toLocaleString()}`, 20, 70);
      ctx.fillText(`☠️ ${state.kills}`, 20, 100);

      const playerHealthPercent = state.player.health / 100;
      ctx.fillStyle = '#333';
      ctx.fillRect(20, canvas.height - 40, 200, 20);
      ctx.fillStyle = playerHealthPercent > 0.5 ? '#4A7C59' : playerHealthPercent > 0.25 ? '#FEC6A1' : '#EA384C';
      ctx.fillRect(20, canvas.height - 40, 200 * playerHealthPercent, 20);
    };

    let animationId: number;

    const gameLoop = () => {
      updateGame();
      renderGame();
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameStarted, onGameOver, onMoneyChange]);

  if (!gameStarted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1A1F2C]">
        <button
          onClick={() => setGameStarted(true)}
          className="px-12 py-6 bg-primary text-white text-2xl font-bold rounded hover:bg-primary/90 transition-all transform hover:scale-105"
        >
          НАЧАТЬ БОЙ
        </button>
      </div>
    );
  }

  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
