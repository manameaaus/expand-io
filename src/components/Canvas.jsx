import { useRef, useEffect, useState } from "react";
import StartScreen from "./StartScreen";
import EndScreen from "./EndScreen";
import "./GameStyling.css";

export default function Canvas() {
  const playerRadius = 10;
  const canvasDiameter = 1600;
  const centerX = canvasDiameter / 2;
  const centerY = canvasDiameter / 2;
  const radius = canvasDiameter / 2;
  const speed = 2;
  const visiblePixels = Math.floor(Math.PI * radius * radius);
  const botCount = 5;

  const canvasRef = useRef(null);
  const territoryRef = useRef(new Set());
  const keys = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
  });
  const botRefs = useRef([]);

  const [player, setPlayer] = useState({ x: centerX, y: centerY });
  const [trail, setTrail] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [bots, setBots] = useState([]);
  const [botTrails, setBotTrails] = useState({});
  const [botTerritories, setBotTerritories] = useState({});

  const initializeTerritory = () => {
    const initialTerritory = new Set();
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      for (let r = 0; r <= 30; r += 0.7) {
        const x = Math.floor(centerX + Math.cos(angle) * r);
        const y = Math.floor(centerY + Math.sin(angle) * r);
        initialTerritory.add(`${x},${y}`);
      }
    }
    territoryRef.current = initialTerritory;
  };

  const initializeBots = () => {
    const newBots = [];
    const newTerritories = {};

    for (let i = 0; i < botCount; i++) {
      const angle = (i / botCount) * Math.PI * 2;
      const distance = 300;
      newBots.push({
        id: i,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        speed: speed * (0.5 + Math.random() * 0.4),
        aggression: 0.1 + Math.random() * 0.3,
        trail: [],
        state: "exploring",
        targetAngle: Math.random() * Math.PI * 2,
        changeDirectionCounter: 0,
        directionChangeFrequency: 100 + Math.random() * 100,
      });

      newTerritories[i] = new Set();
      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        for (let r = 0; r <= 20; r += 2) {
          const x = Math.floor(newBots[i].x + Math.cos(a) * r);
          const y = Math.floor(newBots[i].y + Math.sin(a) * r);
          newTerritories[i].add(`${x},${y}`);
        }
      }
    }

    setBots(newBots);
    setBotTerritories(newTerritories);
    botRefs.current = [...newBots];
  };

  const updateBots = () => {
    const updatedBots = bots.map((bot) => {
      let {
        x,
        y,
        dx,
        dy,
        trail,
        state,
        targetAngle,
        changeDirectionCounter,
        speed,
        aggression,
        directionChangeFrequency,
      } = bot;

      const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distFromCenter + playerRadius > radius * 0.95) {
        targetAngle = Math.atan2(centerY - y, centerX - x);
      }

      if (changeDirectionCounter <= 0) {
        if (Math.random() < aggression * 0.05) {
          targetAngle = Math.atan2(player.y - y, player.x - x);
        } else {
          targetAngle += ((Math.random() - 0.5) * Math.PI) / 2;
        }
        changeDirectionCounter = directionChangeFrequency;
      }
      changeDirectionCounter--;

      if (state === "exploring" && trail.length > 50 + Math.random() * 100) {
        state = "returning";
      }

      if (state === "returning") {
        const territoryPoints = Array.from(botTerritories[bot.id] || []);
        if (territoryPoints.length > 0) {
          const randomPoint = territoryPoints[
            Math.floor(Math.random() * territoryPoints.length)
          ]
            .split(",")
            .map(Number);
          targetAngle = Math.atan2(randomPoint[1] - y, randomPoint[0] - x);
        }

        if (botTerritories[bot.id]?.has(`${Math.floor(x)},${Math.floor(y)}`)) {
          claimBotTerritory(bot.id, trail);
          trail = [];
          state = "exploring";
        }
      }

      dx = Math.cos(targetAngle) * speed;
      dy = Math.sin(targetAngle) * speed;
      x += dx;
      y += dy;

      trail = [...trail, { x, y }].slice(-200);

      return {
        ...bot,
        x,
        y,
        dx,
        dy,
        trail,
        state,
        targetAngle,
        changeDirectionCounter,
      };
    });

    setBots(updatedBots);
    setBotTrails((prev) => {
      const newTrails = { ...prev };
      updatedBots.forEach((bot) => {
        newTrails[bot.id] = bot.trail;
      });
      return newTrails;
    });
    botRefs.current = updatedBots;
  };

  const claimBotTerritory = (id, trail) => {
    if (trail.length < 3) return;

    const newTerritory = new Set(botTerritories[id]);
    const loop = trail.slice(-50);

    loop.forEach((p) =>
      newTerritory.add(`${Math.floor(p.x)},${Math.floor(p.y)}`)
    );

    const [minX, maxX] = [
      Math.min(...loop.map((p) => p.x)),
      Math.max(...loop.map((p) => p.x)),
    ];
    const [minY, maxY] = [
      Math.min(...loop.map((p) => p.y)),
      Math.max(...loop.map((p) => p.y)),
    ];

    for (let x = minX; x <= maxX; x += 4) {
      for (let y = minY; y <= maxY; y += 4) {
        if (isPointInPolygon({ x, y }, loop)) {
          newTerritory.add(`${Math.floor(x)},${Math.floor(y)}`);
          territoryRef.current.delete(`${Math.floor(x)},${Math.floor(y)}`);
        }
      }
    }

    setBotTerritories((prev) => ({ ...prev, [id]: newTerritory }));
  };

  const isPointInPolygon = (point, polygon) => {
    if (polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;

      if (
        (point.x === xi && point.y === yi) ||
        (point.x === xj && point.y === yj)
      )
        return true;

      if (
        yi === point.y &&
        yj === point.y &&
        ((xi <= point.x && point.x <= xj) || (xj <= point.x && point.x <= xi))
      ) {
        return true;
      }

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const drawGame = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "lightblue";
    territoryRef.current.forEach((pixel) => {
      const [x, y] = pixel.split(",").map(Number);
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (dist <= radius) {
        ctx.fillRect(x - 3, y - 3, 6, 6);
      }
    });

    Object.entries(botTerritories).forEach(([id, territory]) => {
      const bot = bots.find((b) => b.id === parseInt(id));
      if (!bot) return;

      ctx.fillStyle = bot.color + "80";
      territory.forEach((pixel) => {
        const [x, y] = pixel.split(",").map(Number);
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist <= radius) {
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
      });
    });

    ctx.fillStyle = "blue";
    trail.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, playerRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    Object.entries(botTrails).forEach(([id, trail]) => {
      const bot = bots.find((b) => b.id === parseInt(id));
      if (!bot || !trail || trail.length < 2) return;

      ctx.strokeStyle = bot.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      trail.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    ctx.fillStyle = "darkblue";
    ctx.beginPath();
    ctx.arc(player.x, player.y, playerRadius, 0, Math.PI * 2);
    ctx.fill();

    bots.forEach((bot) => {
      ctx.fillStyle = bot.color;
      ctx.beginPath();
      ctx.arc(bot.x, bot.y, playerRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.strokeStyle = "gray";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
        ].includes(e.key)
      ) {
        keys.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (!gameStarted || gameOver) return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
        ].includes(e.key)
      ) {
        keys.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const update = () => {
      if (Math.random() < 0.7) {
        updateBots();
      }

      let dx = 0,
        dy = 0;
      if (keys.current.ArrowUp || keys.current.w) dy -= speed;
      if (keys.current.ArrowDown || keys.current.s) dy += speed;
      if (keys.current.ArrowLeft || keys.current.a) dx -= speed;
      if (keys.current.ArrowRight || keys.current.d) dx += speed;

      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / len) * speed;
        dy = (dy / len) * speed;
      }

      const newX = player.x + dx;
      const newY = player.y + dy;

      const distFromCenter = Math.sqrt(
        (newX - centerX) ** 2 + (newY - centerY) ** 2
      );
      if (distFromCenter + playerRadius > radius) {
        setGameOver(true);
        return;
      }

      Object.values(botTrails).forEach((trail) => {
        if (
          trail &&
          trail.some(
            (point) =>
              Math.sqrt((newX - point.x) ** 2 + (newY - point.y) ** 2) <
              playerRadius * 1.8
          )
        ) {
          setGameOver(true);
          return;
        }
      });

      bots.forEach((bot) => {
        if (
          Math.sqrt((newX - bot.x) ** 2 + (newY - bot.y) ** 2) <
          playerRadius * 1.5
        ) {
          setGameOver(true);
          return;
        }
      });

      setPlayer({ x: newX, y: newY });
      setTrail((prev) => {
        const newTrail = [...prev, { x: newX, y: newY }];
        if (
          territoryRef.current.has(`${Math.floor(newX)},${Math.floor(newY)}`)
        ) {
          const territoryPoints = [];
          for (let i = 0; i < newTrail.length; i++) {
            if (
              territoryRef.current.has(
                `${Math.floor(newTrail[i].x)},${Math.floor(newTrail[i].y)}`
              )
            ) {
              territoryPoints.push(i);
            }
          }

          if (territoryPoints.length >= 2) {
            const loop = newTrail.slice(
              territoryPoints[0],
              territoryPoints[territoryPoints.length - 1] + 1
            );

            const newTerritory = new Set(territoryRef.current);
            loop.forEach((p) =>
              newTerritory.add(`${Math.floor(p.x)},${Math.floor(p.y)}`)
            );

            const [minX, maxX] = [
              Math.min(...loop.map((p) => p.x)),
              Math.max(...loop.map((p) => p.x)),
            ];
            const [minY, maxY] = [
              Math.min(...loop.map((p) => p.y)),
              Math.max(...loop.map((p) => p.y)),
            ];

            for (let x = minX; x <= maxX; x += playerRadius) {
              for (let y = minY; y <= maxY; y += playerRadius) {
                if (isPointInPolygon({ x, y }, loop)) {
                  newTerritory.add(`${Math.floor(x)},${Math.floor(y)}`);
                  Object.keys(botTerritories).forEach((id) => {
                    if (
                      botTerritories[id].has(
                        `${Math.floor(x)},${Math.floor(y)}`
                      )
                    ) {
                      const updated = new Set(botTerritories[id]);
                      updated.delete(`${Math.floor(x)},${Math.floor(y)}`);
                      setBotTerritories((prev) => ({ ...prev, [id]: updated }));
                    }
                  });
                }
              }
            }

            territoryRef.current = newTerritory;
            return [];
          }
        }

        return newTrail;
      });

      drawGame(ctx);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    gameOver,
    gameStarted,
    trail,
    player.x,
    player.y,
    bots,
    botTrails,
    botTerritories,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvasDiameter;
    canvas.height = canvasDiameter;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    initializeTerritory();
    initializeBots();
  }, []);

  const restartGame = () => {
    keys.current = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
    };
    initializeTerritory();
    initializeBots();
    setGameOver(false);
    setGameStarted(true);
    setPlayer({ x: centerX, y: centerY });
    setTrail([]);
  };

  return (
    <div className="game-container">
      {!gameStarted && <StartScreen onStart={() => setGameStarted(true)} />}
      {gameOver && <EndScreen onRestart={restartGame} />}

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={canvasDiameter}
          height={canvasDiameter}
        />
      </div>
      <div>
        {gameOver && <span className="game-over-text">| Game Over!</span>}
      </div>
    </div>
  );
}
