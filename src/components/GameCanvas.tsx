import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Joystick from '@/components/Joystick';

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

interface Missile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
}

interface AirStrike {
  x: number;
  y: number;
  timer: number;
}

interface AntiAirSystem {
  x: number;
  y: number;
  radius: number;
  duration: number;
}

interface GameCanvasProps {
  onGameOver?: () => void;
  onMoneyChange?: (money: number) => void;
  money: number;
}

export default function GameCanvas({ onGameOver, onMoneyChange, money }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [joystickDirection, setJoystickDirection] = useState({ x: 0, y: 0 });
  const gameStateRef = useRef({
    player: { x: 100, y: 500, width: 40, height: 40, color: '#4A7C59', health: 100, speed: 3 },
    enemies: [] as GameObject[],
    bullets: [] as Bullet[],
    explosions: [] as Explosion[],
    missiles: [] as Missile[],
    airStrikes: [] as AirStrike[],
    antiAirSystems: [] as AntiAirSystem[],
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

    const handleClick = (e: MouseEvent) => {
      if (selectedAbility) return;

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
      if (state.keys['w'] || state.keys['arrowup'] || joystickDirection.y < -0.2) {
        state.player.y = Math.max(0, state.player.y - state.player.speed * Math.max(1, Math.abs(joystickDirection.y) * 2));
      }
      if (state.keys['s'] || state.keys['arrowdown'] || joystickDirection.y > 0.2) {
        state.player.y = Math.min(canvas.height - state.player.height, state.player.y + state.player.speed * Math.max(1, Math.abs(joystickDirection.y) * 2));
      }
      if (state.keys['a'] || state.keys['arrowleft'] || joystickDirection.x < -0.2) {
        state.player.x = Math.max(0, state.player.x - state.player.speed * Math.max(1, Math.abs(joystickDirection.x) * 2));
      }
      if (state.keys['d'] || state.keys['arrowright'] || joystickDirection.x > 0.2) {
        state.player.x = Math.min(canvas.width - state.player.width, state.player.x + state.player.speed * Math.max(1, Math.abs(joystickDirection.x) * 2));
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

      state.missiles = state.missiles.filter((missile) => {
        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          state.explosions.push({
            x: missile.x,
            y: missile.y,
            radius: 20,
            alpha: 1,
          });

          state.enemies = state.enemies.filter((enemy) => {
            const enemyDist = Math.sqrt(
              Math.pow(enemy.x + enemy.width / 2 - missile.x, 2) +
              Math.pow(enemy.y + enemy.height / 2 - missile.y, 2)
            );
            if (enemyDist < 60) {
              state.explosions.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                radius: 30,
                alpha: 1,
              });
              state.money += 15;
              state.kills++;
              onMoneyChange?.(state.money);
              return false;
            }
            return true;
          });

          return false;
        }

        missile.x += (dx / distance) * missile.speed;
        missile.y += (dy / distance) * missile.speed;
        return true;
      });

      state.airStrikes = state.airStrikes.filter((strike) => {
        strike.timer--;

        if (strike.timer <= 0) {
          state.explosions.push({
            x: strike.x,
            y: strike.y,
            radius: 30,
            alpha: 1,
          });

          state.enemies = state.enemies.filter((enemy) => {
            const dist = Math.sqrt(
              Math.pow(enemy.x + enemy.width / 2 - strike.x, 2) +
              Math.pow(enemy.y + enemy.height / 2 - strike.y, 2)
            );
            if (dist < 100) {
              state.explosions.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                radius: 30,
                alpha: 1,
              });
              state.money += 15;
              state.kills++;
              onMoneyChange?.(state.money);
              return false;
            }
            return true;
          });

          return false;
        }

        return true;
      });

      state.antiAirSystems = state.antiAirSystems.filter((system) => {
        system.duration--;

        state.enemies.forEach((enemy, i) => {
          const dist = Math.sqrt(
            Math.pow(enemy.x - system.x, 2) + Math.pow(enemy.y - system.y, 2)
          );

          if (dist < system.radius && enemy.type === 'plane') {
            state.explosions.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              radius: 30,
              alpha: 1,
            });
            state.enemies.splice(i, 1);
            state.money += 20;
            state.kills++;
            onMoneyChange?.(state.money);
          }
        });

        return system.duration > 0;
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

      state.missiles.forEach((missile) => {
        ctx.strokeStyle = '#FEC6A1';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y);
        ctx.lineTo(missile.targetX, missile.targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#EA384C';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FEC6A1';
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      state.airStrikes.forEach((strike) => {
        ctx.strokeStyle = '#EA384C';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(strike.x, strike.y, 100, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#EA384C';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(strike.x, strike.y, 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#FEC6A1';
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(strike.timer / 60).toString(), strike.x, strike.y + 8);
      });

      state.antiAirSystems.forEach((system) => {
        ctx.strokeStyle = '#4A7C59';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(system.x, system.y, system.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4A7C59';
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(system.x, system.y, system.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#4A7C59';
        ctx.fillRect(system.x - 15, system.y - 15, 30, 30);
        ctx.fillStyle = '#FEC6A1';
        ctx.fillRect(system.x - 5, system.y - 10, 10, 20);
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
  }, [gameStarted, onGameOver, onMoneyChange, joystickDirection]);

  const abilities = [
    { id: 'artillery', name: 'АРТИЛЛЕРИЯ', cost: 500, icon: 'Target' as const, color: 'bg-orange-600' },
    { id: 'missile', name: 'РАКЕТА', cost: 100, icon: 'Rocket' as const, color: 'bg-red-600' },
    { id: 'airstrike', name: 'АВИАЦИЯ', cost: 600, icon: 'Plane' as const, color: 'bg-blue-600' },
    { id: 'antiair', name: 'ПВО', cost: 500, icon: 'Radio' as const, color: 'bg-green-600' },
  ];

  const handleAbilityClick = (abilityId: string, cost: number) => {
    if (gameStateRef.current.money < cost) return;
    setSelectedAbility(abilityId);
  };

  const handleCanvasAbilityClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedAbility) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const state = gameStateRef.current;

    const ability = abilities.find((a) => a.id === selectedAbility);
    if (!ability || state.money < ability.cost) {
      setSelectedAbility(null);
      return;
    }

    state.money -= ability.cost;
    onMoneyChange?.(state.money);

    switch (selectedAbility) {
      case 'artillery':
        state.explosions.push({ x: clickX, y: clickY, radius: 20, alpha: 1 });
        state.enemies = state.enemies.filter((enemy) => {
          const dist = Math.sqrt(
            Math.pow(enemy.x + enemy.width / 2 - clickX, 2) +
              Math.pow(enemy.y + enemy.height / 2 - clickY, 2)
          );
          if (dist < 80) {
            state.explosions.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              radius: 30,
              alpha: 1,
            });
            state.money += 15;
            state.kills++;
            onMoneyChange?.(state.money);
            return false;
          }
          return true;
        });
        break;

      case 'missile':
        state.missiles.push({
          x: state.player.x + state.player.width / 2,
          y: state.player.y + state.player.height / 2,
          targetX: clickX,
          targetY: clickY,
          speed: 6,
          damage: 50,
        });
        break;

      case 'airstrike':
        state.airStrikes.push({
          x: clickX,
          y: clickY,
          timer: 90,
        });
        break;

      case 'antiair':
        state.antiAirSystems.push({
          x: clickX,
          y: clickY,
          radius: 500,
          duration: 600,
        });
        break;
    }

    setSelectedAbility(null);
  };

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

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        onClick={handleCanvasAbilityClick}
        style={{ cursor: selectedAbility ? 'crosshair' : 'default' }}
      />
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {abilities.map((ability) => (
          <Button
            key={ability.id}
            onClick={() => handleAbilityClick(ability.id, ability.cost)}
            disabled={money < ability.cost}
            className={`${ability.color} hover:opacity-80 text-white font-bold px-4 py-6 flex flex-col items-center gap-1 transition-all ${
              selectedAbility === ability.id ? 'ring-4 ring-accent scale-110' : ''
            }`}
          >
            <Icon name={ability.icon} size={24} />
            <span className="text-xs">{ability.name}</span>
            <span className="text-xs opacity-80">${ability.cost}</span>
          </Button>
        ))}
      </div>

      {selectedAbility && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent text-background px-6 py-3 rounded-lg font-bold text-xl pointer-events-none">
          ВЫБЕРИТЕ ЦЕЛЬ НА КАРТЕ
        </div>
      )}

      <Joystick onMove={(x, y) => setJoystickDirection({ x, y })} />
    </div>
  );
}