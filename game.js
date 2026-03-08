// Cloud Jump - improved platformer website version

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const BEST_KEY = "cloudJumpBest";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

const W = canvas.width;
const H = canvas.height;

const GRAVITY = 0.35;
const JUMP_VELOCITY = -10.5;
const MOVE_ACCEL = 0.55;
const MOVE_FRICTION = 0.9;
const MAX_HSPEED = 6.3;

const PLAYER_W = 28;
const PLAYER_H = 34;

const PLATFORM_MIN_W = 70;
const PLATFORM_MAX_W = 120;
const PLATFORM_H = 16;

const PLATFORM_GAP_MIN = 55;
const PLATFORM_GAP_MAX = 95;

const CAMERA_DEADZONE = H * 0.45;
const FALL_MARGIN = 120;

let best = 0;
try {
  best = Number(localStorage.getItem(BEST_KEY) || 0);
} catch (e) {
  best = 0;
}
bestEl.textContent = String(best);

const keys = new Set();

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (
    key === "arrowleft" ||
    key === "arrowright" ||
    key === "arrowup" ||
    key === "arrowdown" ||
    key === " "
  ) {
    e.preventDefault();
  }

  keys.add(key);

  if (key === "r" && state.gameOver) {
    reset();
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

let state;

function makePlatform(y, nearX = null, forceNormal = false) {
  const w = rand(PLATFORM_MIN_W, PLATFORM_MAX_W);

  let x;
  if (nearX === null) {
    x = rand(10, W - w - 10);
  } else {
    x = clamp(nearX + rand(-85, 85), 10, W - w - 10);
  }

  return {
    x,
    y,
    w,
    type: forceNormal ? "normal" : Math.random() < 0.12 ? "bouncy" : "normal",
  };
}

function reset() {
  const startY = H - 140;

  state = {
    time: 0,
    cameraY: 0,
    startY,
    highestY: startY,
    score: 0,
    gameOver: false,
    player: {
      x: W * 0.5 - PLAYER_W * 0.5,
      y: startY,
      vx: 0,
      vy: JUMP_VELOCITY * 1.08,
    },
    platforms: [],
    clouds: [],
  };

  // Starting platform
  state.platforms.push({
    x: W * 0.5 - 140,
    y: H - 60,
    w: 280,
    type: "normal",
  });

  // Easier first few platforms so the opening is fair
  let y = H - 60;
  let prevX = W * 0.5 - 60;

  for (let i = 0; i < 12; i++) {
    let gap;

    if (i === 0) {
      gap = rand(36, 48); // first cloud: very reachable
    } else if (i === 1) {
      gap = rand(40, 54); // second cloud: still easy
    } else if (i < 4) {
      gap = rand(48, 68); // early game: forgiving
    } else {
      gap = rand(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX); // normal difficulty
    }

    y -= gap;

    let plat;
    if (i < 4) {
      const w = rand(95, 135);
      const x = clamp(prevX + rand(-60, 60), 10, W - w - 10);
      plat = {
        x,
        y,
        w,
        type: "normal",
      };
      prevX = x;
    } else {
      plat = makePlatform(y, prevX);
      prevX = plat.x;
    }

    state.platforms.push(plat);
  }

  for (let i = 0; i < 10; i++) {
    state.clouds.push({
      x: rand(0, W),
      y: rand(-H, H),
      r: rand(18, 42),
      s: rand(0.15, 0.35),
    });
  }

  scoreEl.textContent = "0";
}

function update(dt) {
  if (state.gameOver) return;

  const step = dt / 16.6667;
  const p = state.player;

  const left = keys.has("arrowleft") || keys.has("a");
  const right = keys.has("arrowright") || keys.has("d");

  if (left) p.vx -= MOVE_ACCEL * step;
  if (right) p.vx += MOVE_ACCEL * step;

  p.vx *= Math.pow(MOVE_FRICTION, step);
  p.vx = clamp(p.vx, -MAX_HSPEED, MAX_HSPEED);

  p.vy += GRAVITY * step;

  const prevY = p.y;

  p.x += p.vx * step;
  p.y += p.vy * step;

  // Wrap horizontally
  if (p.x < -PLAYER_W) p.x = W;
  if (p.x > W) p.x = -PLAYER_W;

  // Platform landing
  if (p.vy > 0) {
    for (const plat of state.platforms) {
      const px1 = p.x;
      const px2 = p.x + PLAYER_W;
      const pyBottomPrev = prevY + PLAYER_H;
      const pyBottom = p.y + PLAYER_H;

      const platTop = plat.y;
      const platLeft = plat.x;
      const platRight = plat.x + plat.w;

      const crossedTop = pyBottomPrev <= platTop && pyBottom >= platTop;
      const withinX = px2 > platLeft && px1 < platRight;

      if (crossedTop && withinX) {
        p.y = platTop - PLAYER_H;
        p.vy = plat.type === "bouncy" ? JUMP_VELOCITY * 1.25 : JUMP_VELOCITY;
        break;
      }
    }
  }

  // Camera follows upward only
  const screenY = p.y - state.cameraY;
  if (screenY < CAMERA_DEADZONE) {
    const diff = CAMERA_DEADZONE - screenY;
    state.cameraY -= diff;
  }

  // Score based on upward progress from start
  state.highestY = Math.min(state.highestY, p.y);
  const climbed = state.startY - state.highestY;
  state.score = Math.max(0, Math.floor(climbed / 10));
  scoreEl.textContent = String(state.score);

   if (state.score > best) {
    best = state.score;
    bestEl.textContent = String(best);
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch (e) {
      // ignore storage issues
    }
  }

  // Recycle platforms that fall below the camera
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
    if (plat.y > camBottom + 100) {
      topMostY -= rand(PLATFORM_GAP_MIN, PLATFORM_GAP_MAX);
      const np = makePlatform(topMostY, topMostX);
      plat.x = np.x;
      plat.y = np.y;
      plat.w = np.w;
      plat.type = np.type;
      topMostX = np.x;
    }
  }

  // Background clouds
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

  // Game over if player falls too far below screen
  const playerScreenY = p.y - state.cameraY;
  if (playerScreenY > H + FALL_MARGIN) {
    state.gameOver = true;
  }

  state.time += dt;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Sun glow
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(70, 80, 55, 0, Math.PI * 2);
  ctx.fillStyle = "#fff8b0";
  ctx.fill();
  ctx.restore();

  // Background clouds
  for (const c of state.clouds) {
    drawPuff(c.x, c.y - state.cameraY, c.r);
  }

  // Platforms
  for (const plat of state.platforms) {
    const y = plat.y - state.cameraY;
    if (y < -40 || y > H + 40) continue;

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#000";
    roundRect(plat.x + 4, y + 6, plat.w, PLATFORM_H, 10);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = plat.type === "bouncy" ? "#E9F7FF" : "#FFFFFF";
    cloudRect(plat.x, y, plat.w, PLATFORM_H);

    if (plat.type === "bouncy") {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#BEEBFF";
      roundRect(plat.x + 10, y + 5, plat.w - 20, 5, 6);
      ctx.fill();
      ctx.restore();
    }
  }

  // Player
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
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 44px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText("Game Over", W / 2, H / 2 - 30);

    ctx.font = "600 18px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(`Score: ${state.score}  •  Best: ${best}`, W / 2, H / 2 + 12);
    ctx.fillText("Press R to restart", W / 2, H / 2 + 44);
    ctx.restore();
  }
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
  ctx.fillStyle = "rgba(255,255,255,0.9)";
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
  ctx.arc(x + 18, y + 8, 12, 0, Math.PI * 2);
  ctx.arc(x + 38, y + 6, 14, 0, Math.PI * 2);
  ctx.arc(x + 60, y + 8, 12, 0, Math.PI * 2);
  ctx.arc(x + w - 22, y + 8, 12, 0, Math.PI * 2);
  ctx.arc(x + w - 44, y + 6, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  roundRect(x + 10, y + 3, w - 20, 6, 6);
  ctx.fill();

  ctx.restore();
}

// Start loop
reset();

let last = performance.now();

function loop(now) {
  const dt = Math.min(32, now - last);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
