import { useState } from 'react';
import GameCanvas from '@/components/GameCanvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

type GameMode = 'menu' | 'ground' | 'air' | 'tank';

export default function Index() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [playerName, setPlayerName] = useState(localStorage.getItem('tanksPlayerName') || 'Командир');
  const [money, setMoney] = useState(100000);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleNameChange = (newName: string) => {
    setPlayerName(newName);
    localStorage.setItem('tanksPlayerName', newName);
    setIsEditingName(false);
  };

  const handleGameOver = () => {
    setGameMode('menu');
  };

  const handleMoneyChange = (newMoney: number) => {
    setMoney(newMoney);
  };

  if (gameMode !== 'menu') {
    return (
      <div className="relative w-full h-screen">
        <GameCanvas onGameOver={handleGameOver} onMoneyChange={handleMoneyChange} money={money} />
        <Button
          onClick={() => setGameMode('menu')}
          className="absolute top-4 right-4 bg-destructive hover:bg-destructive/90 z-50"
        >
          <Icon name="X" size={20} className="mr-2" />
          ВЫХОД
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-[#0F1419] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-primary/20"
            style={{
              width: '2px',
              height: '100%',
              left: `${i * 5}%`,
              animation: `slide ${3 + i * 0.2}s linear infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes slide {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>

      <div className="relative z-10 max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-6xl md:text-8xl font-black text-accent tracking-wider animate-pulse">
            TANKS OF BLITZ
          </h1>
          <p className="text-xl text-muted-foreground flex items-center justify-center gap-2">
            <Icon name="Crosshair" size={24} className="text-destructive" />
            ТАКТИЧЕСКАЯ БОЕВАЯ ИГРА
            <Icon name="Crosshair" size={24} className="text-destructive" />
          </p>
        </div>

        <Card className="p-6 bg-card/80 backdrop-blur border-2 border-primary/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Icon name="User" size={32} className="text-accent" />
              {isEditingName ? (
                <input
                  type="text"
                  defaultValue={playerName}
                  onBlur={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameChange(e.currentTarget.value)}
                  className="bg-background border-2 border-accent px-3 py-1 rounded text-2xl font-bold focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2 className="text-2xl font-bold text-foreground">{playerName}</h2>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingName(!isEditingName)}
                className="ml-2"
              >
                <Icon name="Edit" size={16} />
              </Button>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">КАПИТАЛ</div>
              <div className="text-3xl font-black text-accent">${money.toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setGameMode('ground')}
              className="h-32 bg-primary hover:bg-primary/80 text-white text-xl font-bold flex flex-col gap-3 transition-all transform hover:scale-105"
            >
              <Icon name="Swords" size={40} />
              НАЧАТЬ БОЙ
              <span className="text-xs opacity-80">Наземная война</span>
            </Button>

            <Button
              onClick={() => setGameMode('air')}
              className="h-32 bg-secondary hover:bg-secondary/80 text-white text-xl font-bold flex flex-col gap-3 transition-all transform hover:scale-105"
            >
              <Icon name="Plane" size={40} />
              САМОЛЕТЫ
              <span className="text-xs opacity-80">Воздушные баталии</span>
            </Button>

            <Button
              onClick={() => setGameMode('tank')}
              className="h-32 bg-accent hover:bg-accent/80 text-background text-xl font-bold flex flex-col gap-3 transition-all transform hover:scale-105"
            >
              <Icon name="Shield" size={40} />
              ТАНКИ
              <span className="text-xs opacity-80">Танковые сражения</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card/80 backdrop-blur border-2 border-muted">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Icon name="Zap" size={28} className="text-accent" />
            АРСЕНАЛ СПОСОБНОСТЕЙ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'АРТИЛЛЕРИЯ', cost: 500, icon: 'Target' },
              { name: 'ТАНК ПВО', cost: 300, icon: 'Shield' },
              { name: 'АВИАЦИЯ', cost: 600, icon: 'Plane' },
              { name: 'РАКЕТА', cost: 100, icon: 'Rocket' },
              { name: 'ПВО СИСТЕМА', cost: 500, icon: 'Radio' },
              { name: 'ПОДМОГА', cost: 500, icon: 'Users' },
              { name: 'ТЕХНИКА', cost: 800, icon: 'Truck' },
              { name: 'РЕМОНТ', cost: 200, icon: 'Wrench' },
            ].map((ability) => (
              <div
                key={ability.name}
                className="bg-muted/50 p-3 rounded border border-border hover:border-accent transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={ability.icon as any} size={20} className="text-accent" />
                  <span className="text-xs font-bold">{ability.name}</span>
                </div>
                <div className="text-lg font-black text-accent">${ability.cost}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="text-center space-y-2 text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Icon name="Keyboard" size={20} />
            УПРАВЛЕНИЕ: WASD / Стрелки | Стрельба: ЛКМ
          </p>
          <p className="text-xs opacity-70">
            © 2025 TANKS OF BLITZ | Победи всех врагов и заработай славу!
          </p>
        </div>
      </div>
    </div>
  );
}