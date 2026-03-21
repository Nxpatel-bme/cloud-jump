<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no"
  />
  <title>Cloud Jump</title>
  <style>
    :root {
      --bg1: #86d4fb;
      --bg2: #dff7ff;
      --panel: rgba(255, 255, 255, 0.72);
      --panel-border: rgba(255, 255, 255, 0.55);
      --text: #213547;
      --shadow: rgba(0, 0, 0, 0.08);
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html,
    body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: linear-gradient(180deg, var(--bg1), var(--bg2));
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
    }

    body {
      touch-action: none;
    }

    .app {
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.18);
      border-bottom: 1px solid rgba(255, 255, 255, 0.28);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 900;
      font-size: clamp(20px, 2.2vw, 30px);
      letter-spacing: 0.2px;
    }

    .brand .emoji {
      font-size: 22px;
    }

    .stats {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
      font-weight: 800;
      font-size: clamp(16px, 1.4vw, 22px);
    }

    .main {
      min-height: 0;
      padding: 10px 14px 14px;
      display: flex;
      justify-content: center;
      align-items: stretch;
    }

    .game-shell {
      position: relative;
      width: min(96vw, 1200px);
      height: min(88vh, 900px);
      border-radius: 28px;
      overflow: hidden;
      box-shadow:
        0 24px 70px rgba(0, 0, 0, 0.14),
        inset 0 0 0 1px rgba(255, 255, 255, 0.45);
      background: rgba(255, 255, 255, 0.2);
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }

    .overlayHud {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .coinsPill {
      position: absolute;
      top: 16px;
      left: 16px;
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 999px;
      padding: 8px 14px;
      font-weight: 800;
      font-size: 15px;
      box-shadow: 0 8px 20px var(--shadow);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    .controlsHint {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 999px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 800;
      color: #2a4a61;
      box-shadow: 0 8px 20px var(--shadow);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      white-space: nowrap;
    }

    .sideZones {
      position: absolute;
      inset: 0;
      display: none;
      pointer-events: none;
    }

    .sideZones .zone {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 50%;
      opacity: 0;
    }

    .sideZones .left {
      left: 0;
    }

    .sideZones .right {
      right: 0;
    }

    @media (max-width: 820px) {
      .topbar {
        padding: 10px 12px;
      }

      .brand {
        font-size: 18px;
      }

      .brand .emoji {
        font-size: 18px;
      }

      .stats {
        gap: 12px;
        font-size: 15px;
      }

      .main {
        padding: 0;
      }

      .game-shell {
        width: 100vw;
        height: calc(100vh - 54px);
        border-radius: 0;
        box-shadow: none;
      }

      .controlsHint {
        display: block;
      }

      .sideZones {
        display: block;
      }
    }

    @media (hover: hover) and (pointer: fine) {
      .controlsHint {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="app">
    <div class="topbar">
      <div class="brand"><span class="emoji">☁️</span><span>Cloud Jump</span></div>
      <div class="stats">
        <span>Score: <span id="score">0</span></span>
        <span>Best: <span id="best">0</span></span>
      </div>
    </div>

    <div class="main">
      <div class="game-shell" id="gameShell">
        <canvas id="game"></canvas>

        <div class="overlayHud">
          <div class="coinsPill">Coins: <span id="coins">0</span></div>
          <div class="controlsHint">Laptop: A/D or ←/→ &nbsp; • &nbsp; Phone: touch left/right side</div>
          <div class="sideZones" aria-hidden="true">
            <div class="zone left"></div>
            <div class="zone right"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    const shell = document.getElementById("gameShell");
    const scoreEl = document.getElementById("score");
    const bestEl = document.getElementById("best");
    const coinsEl = document.getElementById("coins");

    const BEST_KEY = "cloudJumpBestWide";

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a, b) => a + Math.random() * (b - a);

    let W = 1000;
    let H = 700;
    let DPR = 1;
    let CAMERA_DEADZONE = H * 0.45;

    const GRAVITY = 0.4;
    const JUMP_VELOCITY = -10.1;
    const MOVE_ACCEL = 0.55;
    const MOVE_FRICTION = 0.9;
    const MAX_HSPEED = 6.3;

    const PLAYER_W = 28;
    const PLAYER_H = 34;

    const PLATFORM_MIN_W = 72;
    const PLATFORM_MAX_W = 130;
    const PLATFORM_H = 16;

    const PLATFORM_GAP_MIN = 62;
    const PLATFORM_GAP_MAX = 108;

    const FALL_MARGIN = 120;

    const COIN_R = 10;
    const COIN_SCORE = 10;
    const COIN_CHANCE = 0.28;

    const MOVING_PLATFORM_CHANCE = 0.18;
    const BREAKING_PLATFORM_CHANCE = 0.16;

    const keys = new Set();
    let touchLeft = false;
    let touchRight = false;

    let best = 0;
    try {
      best = Number(localStorage.getItem(BEST_KEY) || 0);
    } catch (e) {
      best = 0;
    }
    bestEl.textContent = String(best);

    let state = null;

    function resizeGame() {
      const rect = shell.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);

      W = Math.max(320, Math.floor(rect.width));
      H = Math.max(500, Math.floor(rect.height));

      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      CAMERA_DEADZONE = H * 0.45;
    }

    function updateTouch(clientX) {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      touchLeft = x < rect.width / 2;
      touchRight = x >= rect.width / 2;
    }

    function clearTouch() {
      touchLeft = false;
      touchRight = false;
    }

    window.addEventListener("keydown", (e) => {
      const key = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " "].includes(key)) {
        e.preventDefault();
      }
      keys.add(key);
      if (key === "r" && state && state.gameOver) reset();
    });

    window.addEventListener("keyup", (e) => {
      keys.delete(e.key.toLowerCase());
    });

    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (state && state.gameOver) {
        reset();
        return;
      }
      if (e.touches.length > 0) updateTouch(e.touches[0].clientX);
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (e.touches.length > 0) updateTouch(e.touches[0].clientX);
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      clearTouch();
    }, { passive: false });

    canvas.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      clearTouch();
    }, { passive: false });

    canvas.addEventListener("mousedown", (e) => {
      if (state && state.gameOver) reset();
    });

    function makeCoinForPlatform(platform, force = false) {
      if (!force && Math.random() > COIN_CHANCE) return null;

      return {
        x: platform.x + platform.w / 2,
        y: platform.y - 24,
        r: COIN_R,
        taken: false,
        bob: rand(0, Math.PI * 2),
      };
    }

    function assignPlatformBehavior(platform, forceNormal = false) {
      if (forceNormal) {
        platform.type = "normal";
        platform.moveSpeed = 0;
        platform.moveDir = 1;
        platform.breakState = "idle";
        return;
      }

      const roll = Math.random();

      if (roll < BREAKING_PLATFORM_CHANCE) {
        platform.type = "breaking";
        platform.moveSpeed = 0;
        platform.moveDir = 1;
        platform.breakState = "idle";
      } else if (roll < BREAKING_PLATFORM_CHANCE + MOVING_PLATFORM_CHANCE) {
        platform.type = "moving";
        platform.moveSpeed = rand(1.0, 2.1);
        platform.moveDir = Math.random() < 0.5 ? -1 : 1;
        platform.breakState = "idle";
      } else {
        platform.type = Math.random() < 0.12 ? "bouncy" : "normal";
        platform.moveSpeed = 0;
        platform.moveDir = 1;
        platform.breakState = "idle";
      }
    }

    function makePlatform(y, nearX = null, forceNormal = false) {
      const w = rand(PLATFORM_MIN_W, PLATFORM_MAX_W);

      let x;
      if (nearX === null) {
        x = rand(10, W - w - 10);
      } else {
        x = clamp(nearX + rand(-130, 130), 10, W - w - 10);
      }

      const platform = {
        x,
        y,
        w,
        type: "normal",
        coin: null,
        moveSpeed: 0,
        moveDir: 1,
        breakState: "idle",
      };

      assignPlatformBehavior(platform, forceNormal);
      platform.coin = makeCoinForPlatform(platform, false);
      return platform;
    }

    function reset() {
      resizeGame();

      const startWidth = Math.min(320, W * 0.42);
      const startPlatform = {
        x: W * 0.5 - startWidth / 2,
        y: H - 60,
        w: startWidth,
        type: "normal",
        coin: null,
        moveSpeed: 0,
        moveDir: 1,
        breakState: "idle",
      };

      const playerStartY = startPlatform.y - PLAYER_H;

      const firstPlat = {
        x: clamp(W * 0.5 + rand(-80, 40), 10, W - 120),
        y: startPlatform.y - rand(56, 66),
        w: rand(92, 108),
        type: "normal",
        coin: null,
        moveSpeed: 0,
        moveDir: 1,
        breakState: "idle",
      };
      firstPlat.coin = makeCoinForPlatform(firstPlat, true);

      const secondPlat = {
        x: clamp(firstPlat.x + rand(-100, 100), 10, W - 120),
        y: firstPlat.y - rand(58, 72),
        w: rand(88, 106),
        type: "normal",
        coin: null,
        moveSpeed: 0,
        moveDir: 1,
        breakState: "idle",
      };
      secondPlat.coin = makeCoinForPlatform(secondPlat, true);

      state = {
        time: 0,
        cameraY: 0,
        startY: playerStartY,
        highestY: playerStartY,
        score: 0,
        coinScore: 0,
        coinsCollected: 0,
        gameOver: false,
        player: {
          x: W * 0.5 - PLAYER_W * 0.5,
          y: playerStartY,
          vx: 0,
          vy: JUMP_VELOCITY * 1.03,
        },
        platforms: [startPlatform, firstPlat, secondPlat],
        clouds: [],
      };

      let topY = secondPlat.y;
      let prevX = secondPlat.x;

      const desiredPlatforms = W > 800 ? 18 : 13;

      while (state.platforms.length < desiredPlatforms) {
        topY -= rand(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX);
        const plat = makePlatform(topY, prevX);
        prevX = plat.x;
        state.platforms.push(plat);
      }

      const cloudCount = W > 800 ? 16 : 10;
      for (let i = 0; i < cloudCount; i++) {
        state.clouds.push({
          x: rand(0, W),
          y: rand(-H, H),
          r: rand(18, 42),
          s: rand(0.15, 0.35),
        });
      }

      scoreEl.textContent = "0";
      coinsEl.textContent = "0";
      clearTouch();
    }

    function update(dt) {
      if (!state || state.gameOver) return;

      const step = dt / 16.6667;
      const p = state.player;

      const left = keys.has("arrowleft") || keys.has("a") || touchLeft;
      const right = keys.has("arrowright") || keys.has("d") || touchRight;

      if (left) p.vx -= MOVE_ACCEL * step;
      if (right) p.vx += MOVE_ACCEL * step;

      p.vx *= Math.pow(MOVE_FRICTION, step);
      p.vx = clamp(p.vx, -MAX_HSPEED, MAX_HSPEED);
      p.vy += GRAVITY * step;

      const prevY = p.y;

      for (const plat of state.platforms) {
        if (plat.type === "moving") {
          plat.x += plat.moveSpeed * plat.moveDir * step;

          if (plat.x < 10) {
            plat.x = 10;
            plat.moveDir = 1;
          }
          if (plat.x + plat.w > W - 10) {
            plat.x = W - 10 - plat.w;
            plat.moveDir = -1;
          }

          if (plat.coin && !plat.coin.taken) {
            plat.coin.x = plat.x + plat.w / 2;
            plat.coin.y = plat.y - 24;
          }
        }

        if (plat.type === "breaking" && plat.breakState === "breaking") {
          plat.y += 5.5 * step;
          if (plat.coin && !plat.coin.taken) {
            plat.coin.y = plat.y - 24;
          }
        }
      }

      p.x += p.vx * step;
      p.y += p.vy * step;

      if (p.x < -PLAYER_W) p.x = W;
      if (p.x > W) p.x = -PLAYER_W;

      if (p.vy > 0) {
        for (const plat of state.platforms) {
          if (plat.type === "breaking" && plat.breakState === "gone") continue;

          const px1 = p.x;
          const px2 = p.x + PLAYER_W;
          const pyBottomPrev = prevY + PLAYER_H;
          const pyBottom = p.y + PLAYER_H;

          const crossedTop = pyBottomPrev <= plat.y && pyBottom >= plat.y;
          const withinX = px2 > plat.x && px1 < plat.x + plat.w;

          if (crossedTop && withinX) {
            if (plat.type === "breaking") {
              p.y = plat.y - PLAYER_H;
              p.vy = JUMP_VELOCITY;
              plat.breakState = "breaking";
              break;
            }

            p.y = plat.y - PLAYER_H;
            p.vy = plat.type === "bouncy" ? JUMP_VELOCITY * 1.25 : JUMP_VELOCITY;

            if (plat.type === "moving") {
              p.x += plat.moveSpeed * plat.moveDir * step * 1.2;
            }

            break;
          }
        }
      }

      for (const plat of state.platforms) {
        if (
          plat.type === "breaking" &&
          plat.breakState === "breaking" &&
          plat.y - state.cameraY > H + 80
        ) {
          plat.breakState = "gone";
        }
      }

      const screenY = p.y - state.cameraY;
      if (screenY < CAMERA_DEADZONE) {
        state.cameraY -= CAMERA_DEADZONE - screenY;
      }

      for (const plat of state.platforms) {
        if (!plat.coin || plat.coin.taken) continue;

        plat.coin.bob += 0.08 * step;
        const coinY = plat.coin.y + Math.sin(plat.coin.bob) * 3;

        const dx = p.x + PLAYER_W / 2 - plat.coin.x;
        const dy = p.y + PLAYER_H / 2 - coinY;

        if (dx * dx + dy * dy < 16 * 16) {
          plat.coin.taken = true;
          state.coinsCollected++;
          state.coinScore += COIN_SCORE;
        }
      }

      state.highestY = Math.min(state.highestY, p.y);
      const climbed = state.startY - state.highestY;
      const heightScore = Math.max(0, Math.floor(climbed / 10));

      state.score = heightScore + state.coinScore;
      scoreEl.textContent = String(state.score);
      coinsEl.textContent = String(state.coinsCollected);

      if (state.score > best) {
        best = state.score;
        bestEl.textContent = String(best);
        try {
          localStorage.setItem(BEST_KEY, String(best));
        } catch (e) {}
      }

      let topMostY = Infinity;
      let topMostX = W * 0.5;

      for (const plat of state.platforms) {
        if (plat.y < topMostY) {
          topMostY = plat.y;
          topMostX = plat.x;
        }
      }

      const camBottom = state.cameraY + H;

      for (const plat of state.platforms) {
        if (plat.y > camBottom + 100 || (plat.type === "breaking" && plat.breakState === "gone")) {
          topMostY -= rand(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX);
          const np = makePlatform(topMostY, topMostX);

          plat.x = np.x;
          plat.y = np.y;
          plat.w = np.w;
          plat.type = np.type;
          plat.coin = np.coin;
          plat.moveSpeed = np.moveSpeed;
          plat.moveDir = np.moveDir;
          plat.breakState = np.breakState;

          topMostX = np.x;
        }
      }

      for (const c of state.clouds) {
        c.y += c.s * step;

        const cyScreen = c.y - state.cameraY;
        if (cyScreen > H + 80) {
          c.y = state.cameraY - rand(60, 300);
          c.x = rand(0, W);
          c.r = rand(18, 42);
          c.s = rand(0.15, 0.35);
        }
      }

      const playerScreenY = p.y - state.cameraY;
      if (playerScreenY > H + FALL_MARGIN) {
        state.gameOver = true;
      }

      state.time += dt;
    }

    function roundRect(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawPuff(x, y, r) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(255,255,255,0.92)";

      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
      ctx.arc(x + r * 0.45, y + r * 0.1, r * 0.5, 0, Math.PI * 2);
      ctx.arc(x - r * 0.45, y + r * 0.1, r * 0.48, 0, Math.PI * 2);
      ctx.arc(x + r * 0.15, y - r * 0.25, r * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function cloudRect(x, y, w, h) {
      ctx.save();

      roundRect(x, y, w, h, 10);
      ctx.fill();

      ctx.globalAlpha = 0.95;
      ctx.beginPath();

      const left1 = x + Math.min(18, w * 0.18);
      const left2 = x + Math.min(38, w * 0.34);
      const center = x + w * 0.5;
      const right2 = x + w - Math.min(44, w * 0.34);
      const right1 = x + w - Math.min(22, w * 0.18);

      ctx.arc(left1, y + 8, 12, 0, Math.PI * 2);
      ctx.arc(left2, y + 6, 14, 0, Math.PI * 2);
      ctx.arc(center, y + 7, 12, 0, Math.PI * 2);
      ctx.arc(right2, y + 6, 14, 0, Math.PI * 2);
      ctx.arc(right1, y + 8, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.32;
      ctx.fillStyle = "#ffffff";
      roundRect(x + 10, y + 3, Math.max(20, w - 20), 6, 6);
      ctx.fill();

      ctx.restore();
    }

    function drawCoin(x, y, r) {
      ctx.save();

      ctx.fillStyle = "#ffd54a";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#f4b400";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.beginPath();
      ctx.arc(x - 3, y - 3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#86d4fb");
      sky.addColorStop(1, "#dff7ff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#fff4ae";
      ctx.beginPath();
      ctx.arc(Math.min(150, W * 0.18), 135, Math.min(96, W * 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw() {
      if (!state) return;

      ctx.clearRect(0, 0, W, H);
      drawBackground();

      for (const c of state.clouds) {
        drawPuff(c.x, c.y - state.cameraY, c.r);
      }

      for (const plat of state.platforms) {
        const y = plat.y - state.cameraY;
        if (y < -50 || y > H + 60) continue;

        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = "#000";
        roundRect(plat.x + 4, y + 6, plat.w, PLATFORM_H, 10);
        ctx.fill();
        ctx.restore();

        if (plat.type === "bouncy") {
          ctx.fillStyle = "#E9F7FF";
        } else if (plat.type === "moving") {
          ctx.fillStyle = "#FFF4D6";
        } else if (plat.type === "breaking") {
          ctx.fillStyle = "#FFE0E0";
        } else {
          ctx.fillStyle = "#FFFFFF";
        }

        cloudRect(plat.x, y, plat.w, PLATFORM_H);

        if (plat.type === "bouncy") {
          ctx.save();
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = "#BEEBFF";
          roundRect(plat.x + 10, y + 5, Math.max(18, plat.w - 20), 5, 6);
          ctx.fill();
          ctx.restore();
        }

        if (plat.type === "moving") {
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = "#E7C66A";
          roundRect(plat.x + 12, y + 5, Math.max(16, plat.w - 24), 4, 6);
          ctx.fill();
          ctx.restore();
        }

        if (plat.type === "breaking") {
          ctx.save();
          ctx.strokeStyle = "#D98C8C";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(plat.x + 18, y + 3);
          ctx.lineTo(plat.x + plat.w / 2, y + PLATFORM_H - 2);
          ctx.lineTo(plat.x + plat.w - 18, y + 4);
          ctx.stroke();
          ctx.restore();
        }
      }

      for (const plat of state.platforms) {
        if (!plat.coin || plat.coin.taken) continue;

        const drawY = plat.coin.y + Math.sin(plat.coin.bob) * 3 - state.cameraY;
        if (drawY < -30 || drawY > H + 30) continue;

        drawCoin(plat.coin.x, drawY, plat.coin.r);
      }

      const p = state.player;
      const px = p.x;
      const py = p.y - state.cameraY;

      ctx.save();
      ctx.fillStyle = "#1f2a44";
      roundRect(px, py, PLAYER_W, PLAYER_H, 8);
      ctx.fill();

      ctx.fillStyle = "#ffd2b3";
      roundRect(px + 5, py + 6, PLAYER_W - 10, 14, 7);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(px + 10, py + 13, 2, 0, Math.PI * 2);
      ctx.arc(px + PLAYER_W - 10, py + 13, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff4d6d";
      roundRect(px + 4, py + 20, PLAYER_W - 8, 6, 3);
      ctx.fill();
      ctx.restore();

      if (state.gameOver) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.30)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";

        ctx.font = "700 46px system-ui";
        ctx.fillText("Game Over", W / 2, H / 2 - 34);

        ctx.font = "600 20px system-ui";
        ctx.fillText(`Score: ${state.score}   •   Best: ${best}`, W / 2, H / 2 + 8);
        ctx.fillText(`Coins: ${state.coinsCollected}`, W / 2, H / 2 + 40);

        const mobile = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
        ctx.fillText(mobile ? "Tap to restart" : "Press R to restart", W / 2, H / 2 + 76);

        ctx.restore();
      }
    }

    resizeGame();
    reset();

    let last = performance.now();

    function loop(now) {
      const dt = Math.min(32, now - last);
      last = now;

      update(dt);
      draw();

      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", () => {
      const oldW = W;
      resizeGame();

      if (state && oldW > 0) {
        const scaleX = W / oldW;
        state.player.x *= scaleX;

        for (const plat of state.platforms) {
          plat.x *= scaleX;
          plat.x = clamp(plat.x, 10, W - plat.w - 10);
          if (plat.coin && !plat.coin.taken) {
            plat.coin.x = plat.x + plat.w / 2;
          }
        }

        for (const c of state.clouds) {
          c.x *= scaleX;
        }
      }
    });

    requestAnimationFrame(loop);
  </script>
</body>
</html>
