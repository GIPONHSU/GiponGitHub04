import * as GameUtils from "../systems/GameUtils";
import type { GameEngine } from "../GameEngine";
import { drawCapsulePath } from "./Utils";
import { CANVAS_W, CANVAS_H, MAX_SPIN } from "../constants";
import picTopuse2Src from "../../PIC/PIC_TOPUSE_02.png";
import picTopuse3Src from "../../PIC/PIC_TOPUSE_03.png";
import { Top, PlayerStats } from "../types";
import { PLAYER_PROFILES } from "../GameRenderer";
import { createTopSprite } from "../sprites/tops";

const modelCache: { [key: string]: HTMLCanvasElement } = {};
function getSelectionSprite(
  color: string,
  pilotColor: string,
  modelType: number,
): HTMLCanvasElement {
  const key = `${color}_${pilotColor}_${modelType}`;
  if (!modelCache[key]) {
    modelCache[key] = createTopSprite(color, pilotColor, modelType);
  }
  return modelCache[key];
}

const picTopuse2Image = new Image();
picTopuse2Image.src = picTopuse2Src;
const picTopuse3Image = new Image();
picTopuse3Image.src = picTopuse3Src;

export function drawTutorialBubble(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  targetY: number,
  targetRadius: number,
  activeArenaCenterY: number,
  text: string,
  img: HTMLImageElement,
  isUpsideDown: boolean,
) {
  const isYUpperHalf = targetY < activeArenaCenterY;
  const dir = isYUpperHalf ? 1 : -1;
  // Push the UI so its bounding box does not overlap the top.
  // UI total height is about 300px.
  // Center of UI should be ~160px away from the edge of the top.
  const offsetY = dir * (targetRadius + 170);

  ctx.save();
  ctx.translate(targetX, targetY + offsetY);
  if (isUpsideDown) {
    ctx.rotate(Math.PI);
  }

  // Draw Image
  const imgW = 270;
  const imgH = 270;
  if (img && img.complete && img.width > 0) {
    ctx.drawImage(img, -imgW / 2, -150, imgW, imgH);
  }

  // Draw Text Bottom
  ctx.font =
    'bold 36px "Space Grotesk", "Inter", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = "#fbbf24";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(text, 0, 140);
  ctx.fillText(text, 0, 140);

  ctx.restore();
}

export function drawTutorialBubbleAtUI(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  idx: number,
  text: string,
  img: HTMLImageElement,
  alpha: number = 1.0,
) {
  const padding = 8;
  const barW = 460;
  const positions = [
    { x: padding, y: CANVAS_H - 130 - padding },
    { x: CANVAS_W - barW - padding, y: CANVAS_H - 130 - padding },
    { x: padding, y: padding + 10 },
    { x: CANVAS_W - barW - padding, y: padding + 10 },
  ];

  const pos = positions[idx];
  if (!pos) return;

  const top = engine.tops.find((t) => t.id === `top_${idx}`);
  let drawX = pos.x;
  let drawY = pos.y;
  if (
    top &&
    top.damageShockTimer !== undefined &&
    top.damageShockTimer > 0 &&
    top.hp > 0
  ) {
    const shakeIntensity = 8 * (top.damageShockTimer / 0.45);
    drawX += (Math.random() - 0.5) * shakeIntensity;
    drawY += (Math.random() - 0.5) * shakeIntensity;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0.0, Math.min(1.0, alpha));

  const centerX = drawX + barW / 2;
  const centerY = drawY + 37.5;

  if (idx === 2 || idx === 3) {
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI);
    ctx.translate(0, -260);
  } else {
    ctx.translate(centerX, centerY - 260);
  }

  // Draw Image
  const imgW = 270;
  const imgH = 270;
  if (img && img.complete && img.width > 0) {
    ctx.drawImage(img, -imgW / 2, -150, imgW, imgH);
  }

  // Draw Text Bottom
  ctx.font =
    'bold 36px "Space Grotesk", "Inter", "Microsoft JhengHei", sans-serif';
  ctx.fillStyle = "#fbbf24";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(text, 0, 140);
  ctx.fillText(text, 0, 140);

  ctx.restore();
}

export function drawUIWorld(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  // Draw Coop/Deadlock Battle Standoff UI in world space
  engine.tops.forEach((top) => {
    // 僅由 Lead 陀螺主導繪製一組對決 UI
    if (top.coopState && top.coopState.isLeader) {
      const state = top.coopState;
      const partner = engine.tops.find((t) => t.id === state.partnerId);
      if (!partner || !partner.coopState) return;

      const midX = state.centerX;
      const midY = state.centerY;

      // 取得目前兩顆陀螺拉開的半徑
      const currentR = Math.hypot(top.x - midX, top.y - midY);
      if (currentR < 10) return;

      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // 1. 底層大氣漫射發光 (Purple & Pink glow)
      const gradRadius = currentR * 1.4;
      const radialGrad = ctx.createRadialGradient(
        midX,
        midY,
        currentR * 0.4,
        midX,
        midY,
        gradRadius,
      );
      radialGrad.addColorStop(0, "rgba(168, 85, 247, 0.25)"); // 紫光核心
      radialGrad.addColorStop(0.5, "rgba(236, 72, 153, 0.12)"); // 粉紅擴散
      radialGrad.addColorStop(1, "rgba(59, 130, 246, 0.0)");
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(midX, midY, gradRadius, 0, Math.PI * 2);
      ctx.fill();

      // 呼吸震盪係數
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 150);

      // 2. 外圍厚實衝擊主能環
      ctx.beginPath();
      ctx.arc(midX, midY, currentR, 0, Math.PI * 2);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 14 * pulse;
      ctx.globalAlpha = 0.35;
      ctx.stroke();

      // 3. 極細高溫科技核心線
      ctx.beginPath();
      ctx.arc(midX, midY, currentR, 0, Math.PI * 2);
      ctx.strokeStyle = "#22d3ee"; // 青空電鍍藍
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.85;
      ctx.stroke();

      // 4. 熱力最內層白灼絲
      ctx.beginPath();
      ctx.arc(midX, midY, currentR, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.95;
      ctx.stroke();

      // 5. 旋轉能量刻度線 (Dash Gap Ring)
      ctx.save();
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7 * pulse;
      ctx.setLineDash([20, 15, 6, 15]);
      ctx.lineDashOffset = (Date.now() / 45) % 360; // 高速旋轉刻度
      ctx.beginPath();
      ctx.arc(midX, midY, currentR + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 6. 星軌亮點點綴軌跡 (Energy Nodes)
      const numNodes = 8;
      // Removed shadowBlur for perf
      // Removed shadowColor for perf
      for (let i = 0; i < numNodes; i++) {
        const angleOffset = (Date.now() / 1200) % (Math.PI * 2);
        const angle = (i * (Math.PI * 2)) / numNodes + angleOffset;
        const nodeX = midX + Math.cos(angle) * currentR;
        const nodeY = midY + Math.sin(angle) * currentR;

        ctx.beginPath();
        ctx.arc(
          nodeX,
          nodeY,
          6 + Math.sin(Date.now() / 100 + i) * 2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.restore();

      // ==========================================
      // 7. 對決力量拉鋸計量表 (Tug-of-War Bar)
      // ==========================================
      const mySpins = state.coopSpinCount || 0;
      const theirSpins = partner.coopState.coopSpinCount || 0;
      const totalSpins = mySpins + theirSpins + 1;

      // 分割比例計算
      const targetRatio = Math.max(
        0,
        Math.min(1, (mySpins + 0.5) / totalSpins),
      );
      if (state.uiFillRatio === undefined) {
        state.uiFillRatio = 0.5;
      }
      // 指數緩動，使計量條拉鋸滑動流暢，展現兩股力量推擠的黏滯感
      state.uiFillRatio += (targetRatio - state.uiFillRatio) * 0.15;
      const fillRatio = state.uiFillRatio;

      const barW = 240;
      const barH = 14;
      const barX = midX - barW / 2;
      const barY = midY + 180; // 繪製於角力中心下方 180 像素處

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      // 黑色外框與發光陰影
      // Removed shadowBlur for perf
      // Removed shadowColor for perf
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
      // Removed shadowBlur for perf

      // 右側血量條填充 (對手顏色)
      ctx.fillStyle = partner.color;
      ctx.fillRect(barX, barY, barW, barH);

      // 左側血量條填充 (我方顏色，覆蓋左半邊)
      const myFillW = barW * fillRatio;
      ctx.fillStyle = top.color;
      ctx.fillRect(barX, barY, myFillW, barH);

      // 核心對峙點高亮閃爍白線指標
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(barX + myFillW - 3, barY - 6, 6, barH + 12);

      // 白亮外金屬邊框
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.restore();
    }
  });

  // Draw the glowing horizontal capsule boundaries and mask anything drawn outside
  // drawCapsuleBorder(ctx, engine); // MOVED to GameRenderer.ts to control rendering order!

  // 1. Launch Pad Preparation Speed Launch HUD
  engine.tops.forEach((top) => {
    if (!top.isExploding && top.launchPadState === "prep_spinning") {
      // Rotating halo can remain for satisfying visual effect, but prompt text is removed
      ctx.save();
      ctx.translate(top.x, top.y);
      const spinHaloAngle = -(Date.now() / 250) % (Math.PI * 2);
      ctx.rotate(spinHaloAngle);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 12]);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#f59e0b";
      ctx.beginPath();
      ctx.arc(0, 0, top.radius + 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });

  // Draw world-space clash ring and Clash Bar for Boss Struggle (before camera restore)
  const bossStruggle = engine.zombies.find(
    (z) =>
      (z.type === "zombie_boss" || z.type === "zombie_black") &&
      (z as any).bossAttackState === "struggle_clash",
  );
  if (bossStruggle) {
    const player = engine.tops.find(
      (t) => t.id === (bossStruggle as any).bossWarningTargetId,
    );
    if (player) {
      const midX = (bossStruggle.x + player.x) / 2;
      const midY = (bossStruggle.y + player.y) / 2;
      const currentR = bossStruggle.radius + player.radius - 8;

      // Draw collision clash ring effect exactly like versus mode
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // 1. 底層大氣漫射發光 (Purple & Pink glow)
      const gradRadius = currentR * 1.4;
      const radialGrad = ctx.createRadialGradient(
        midX,
        midY,
        currentR * 0.4,
        midX,
        midY,
        gradRadius,
      );
      radialGrad.addColorStop(0, "rgba(168, 85, 247, 0.35)"); // 紫光核心
      radialGrad.addColorStop(0.5, "rgba(236, 72, 153, 0.2)"); // 粉紅擴散
      radialGrad.addColorStop(1, "rgba(59, 130, 246, 0.0)");
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(midX, midY, gradRadius, 0, Math.PI * 2);
      ctx.fill();

      // 呼吸震盪係數
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 150);

      // 2. 外圍厚實衝擊主能環
      ctx.beginPath();
      ctx.arc(midX, midY, currentR, 0, Math.PI * 2);
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 14 * pulse;
      ctx.globalAlpha = 0.45;
      ctx.stroke();

      // 3. 極細高溫科技核心線
      ctx.beginPath();
      ctx.arc(midX, midY, currentR, 0, Math.PI * 2);
      ctx.strokeStyle = "#22d3ee"; // 青空電鍍藍
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.95;
      ctx.stroke();

      // 4. 熱力最內層白灼絲
      ctx.beginPath();
      ctx.arc(midX, midY, currentR, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.95;
      ctx.stroke();

      // 5. 旋轉能量刻度線 (Dash Gap Ring)
      ctx.save();
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8 * pulse;
      ctx.setLineDash([20, 15, 6, 15]);
      ctx.lineDashOffset = (Date.now() / 45) % 360; // 高速旋轉刻度
      ctx.beginPath();
      ctx.arc(midX, midY, currentR + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 6. 星軌亮點點綴軌跡 (Energy Nodes)
      const numNodes = 8;
      for (let i = 0; i < numNodes; i++) {
        const angleOffset = (Date.now() / 1200) % (Math.PI * 2);
        const angle = (i * (Math.PI * 2)) / numNodes + angleOffset;
        const nodeX = midX + Math.cos(angle) * currentR;
        const nodeY = midY + Math.sin(angle) * currentR;

        ctx.beginPath();
        ctx.arc(
          nodeX,
          nodeY,
          6 + Math.sin(Date.now() / 100 + i) * 2,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
      ctx.restore();

      // ==========================================
      // 7. 對決力量拉鋸計量表 (Tug-of-War Bar)
      // ==========================================
      const mySpins = player.struggleMashCount ?? 0;
      const totalSpins = player.struggleMashRequired ?? 8;

      // Let's model a smooth push/pull transition from the center
      const remainTimer = (bossStruggle as any).bossAttackTimer ?? 3.0;
      const bossPush = Math.max(0, Math.min(1, (3.0 - remainTimer) / 3.0));
      const playerPush = Math.max(0, Math.min(1, mySpins / totalSpins));
      const targetRatio = Math.max(
        0,
        Math.min(1, 0.5 + playerPush * 0.5 - bossPush * 0.5),
      );

      if ((bossStruggle as any).uiFillRatio === undefined) {
        (bossStruggle as any).uiFillRatio = 0.5;
      }
      (bossStruggle as any).uiFillRatio +=
        (targetRatio - (bossStruggle as any).uiFillRatio) * 0.15;
      const fillRatio = (bossStruggle as any).uiFillRatio;

      const barW = 240;
      const barH = 14;
      const barX = midX - barW / 2;
      const barY = midY + 180; // 繪製於角力中心下方 180 像素處

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      const splitPixel = barW * fillRatio;

      // Left side is player (Blue color)
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(barX, barY, splitPixel, barH);

      // Right side is Boss (Orange color)
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(barX + splitPixel, barY, barW - splitPixel, barH);

      // Fixed middle visual divider to clearly show 50% mark (切分兩半的基準線)
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(barX + barW / 2 - 1, barY, 2, barH);

      // Clash midpoint indicator line pushing
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(barX + splitPixel - 3, barY - 6, 6, barH + 12);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.restore();
    }
  }

  // Restore camera zoom/pan matrix transformation prior to drawing HUD UI
}

export function drawUIScreen(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
) {
  ctx.restore(); // Restore camera transform
  ctx.restore(); // Restore screen shake transform

  // Draw Overlay UI (Corners for players)
  drawUI(ctx, engine);

  // --- Draw Items (Tickets & Keys) ON TOP OF UI ---
  ctx.save();
  const shakeX = (engine as any).lastShakeX || 0;
  const shakeY = (engine as any).lastShakeY || 0;
  ctx.translate(shakeX, shakeY);
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.scale(engine.camera.zoom, engine.camera.zoom);
  ctx.translate(-engine.camera.x, -engine.camera.y);

  engine.items.forEach((item) => {
    if (item.type === "item_ticket") {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.z) ctx.translate(0, -item.z);

      if (item.hoverTimer !== undefined && item.hoverTimer > 0) {
        ctx.rotate(Date.now() * 0.005);
      } else {
        let targetX = CANVAS_W / 2;
        let targetY = CANVAS_H / 2;
        const padding = 24;
        const barW = 210;
        if (item.targetPlayerId === "top_0") {
          targetX = padding + barW / 2;
          targetY = CANVAS_H - 130 + 50;
        } else if (item.targetPlayerId === "top_1") {
          targetX = CANVAS_W - barW - padding + barW / 2;
          targetY = CANVAS_H - 130 + 50;
        } else if (item.targetPlayerId === "top_2") {
          targetX = padding + barW / 2;
          targetY = padding + 50;
        } else if (item.targetPlayerId === "top_3") {
          targetX = CANVAS_W - barW - padding + barW / 2;
          targetY = padding + 50;
        }
        targetX = (targetX - CANVAS_W / 2) / engine.camera.zoom + engine.camera.x;
        targetY = (targetY - CANVAS_H / 2) / engine.camera.zoom + engine.camera.y;
        const dx = targetX - item.x;
        const dy = targetY - item.y;
        ctx.rotate(Math.atan2(dy, dx));
      }

      if (item.scale !== undefined) {
        ctx.scale(item.scale, item.scale);
      }

      const width = 72;
      const height = 40;
      const grad = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
      grad.addColorStop(0, "#ef4444");
      grad.addColorStop(0.2, "#f97316");
      grad.addColorStop(0.4, "#eab308");
      grad.addColorStop(0.6, "#22c55e");
      grad.addColorStop(0.8, "#3b82f6");
      grad.addColorStop(1, "#a855f7");

      ctx.fillStyle = grad;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-width / 2, -height / 2, width, height);
      ctx.fill();
      ctx.stroke();

      ctx.save();
      if (item.hoverTimer !== undefined && item.hoverTimer > 0) {
        ctx.rotate(-Date.now() * 0.005);
      } else {
        let targetX = CANVAS_W / 2;
        if (item.targetPlayerId === "top_0" || item.targetPlayerId === "top_2") {
          targetX = 24 + 210 / 2;
        } else if (item.targetPlayerId === "top_1" || item.targetPlayerId === "top_3") {
          targetX = CANVAS_W - 210 - 24 + 210 / 2;
        }
        targetX = (targetX - CANVAS_W / 2) / engine.camera.zoom + engine.camera.x;
        if (targetX < item.x) ctx.rotate(Math.PI);
      }
      ctx.font = 'bold 28px "Courier New"';
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 4;
      ctx.strokeText(item.amount?.toString() || "0", 0, 0);
      ctx.fillText(item.amount?.toString() || "0", 0, 0);
      ctx.restore();

      ctx.restore();
    } else if (item.type === "item_key") {
      ctx.save();
      ctx.translate(item.x, item.y);
      const bobOffset = Math.sin(Date.now() * 0.005) * 15;
      ctx.translate(0, bobOffset);
      ctx.shadowColor = `hsl(${(Date.now() * 0.1) % 360}, 100%, 50%)`;
      ctx.shadowBlur = 15;
      const grad = ctx.createLinearGradient(-15, -30, 15, 30);
      grad.addColorStop(0, "#ef4444");
      grad.addColorStop(0.2, "#f97316");
      grad.addColorStop(0.4, "#eab308");
      grad.addColorStop(0.6, "#22c55e");
      grad.addColorStop(0.8, "#3b82f6");
      grad.addColorStop(1, "#a855f7");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -15, 10, 0, Math.PI * 2);
      ctx.rect(-4, -5, 8, 30);
      ctx.rect(4, 15, 8, 4);
      ctx.rect(4, 22, 8, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();
  // ----------------------------------------------------

  // 1. Launch Pad Preparation Speed Launch HUD (drawn above the player's UI interface)
  engine.tops.forEach((top) => {
    if (!top.isExploding && top.launchPadState === "prep_spinning") {
      if (
        !top.isAI &&
        GameUtils.getLatestActiveTutorial(engine, top) === "launch_pad"
      ) {
        const idx = parseInt(top.id.replace("top_", ""));
        if (!isNaN(idx) && idx >= 0 && idx < 4) {
          drawTutorialBubbleAtUI(
            ctx,
            engine,
            idx,
            "快轉動陀螺!!",
            picTopuse2Image,
          );
        }
      }
    }
  });

  // 2. Zombie Siege QTE overlay (drawn above the player's UI interface)
  if (engine.zombieSiegeActive && engine.siegeStatus === "clinging") {
    const player = engine.tops.find((t) => t.id === engine.siegeTargetPlayerId);
    if (
      player &&
      GameUtils.getLatestActiveTutorial(engine, player) === "zombie_siege"
    ) {
      const idx = parseInt(player.id.replace("top_", ""));
      if (!isNaN(idx) && idx >= 0 && idx < 4) {
        drawTutorialBubbleAtUI(
          ctx,
          engine,
          idx,
          "快轉動陀螺!!",
          picTopuse2Image,
        );
      }
    }
  }

  // 3. Spin Tutorial overhead on game start (drawn above the player's UI interface)
  engine.tops.forEach((top) => {
    if (
      top.spinTutorialTimer !== undefined &&
      top.spinTutorialTimer > 0 &&
      GameUtils.getLatestActiveTutorial(engine, top) === "game_start_spin"
    ) {
      const idx = parseInt(top.id.replace("top_", ""));
      if (!isNaN(idx) && idx >= 0 && idx < 4) {
        let alpha = 1.0;
        if (top.spinTutorialTimer > 2.7) {
          alpha = (3.0 - top.spinTutorialTimer) / 0.3;
        } else if (top.spinTutorialTimer < 0.3) {
          alpha = top.spinTutorialTimer / 0.3;
        }
        drawTutorialBubbleAtUI(
          ctx,
          engine,
          idx,
          "快轉動陀螺",
          picTopuse2Image,
          alpha,
        );
      }
    }
  });

  // 3.5. Boss/Black Zombie struggle clash overlay (drawn above the player's UI interface)
  const activeStruggle = engine.zombies.find(
    (z) =>
      (z.type === "zombie_boss" || z.type === "zombie_black") &&
      (z as any).bossAttackState === "struggle_clash",
  );
  if (activeStruggle) {
    const player = engine.tops.find(
      (t) => t.id === (activeStruggle as any).bossWarningTargetId,
    );
    if (
      player &&
      GameUtils.getLatestActiveTutorial(engine, player) === "boss_struggle"
    ) {
      const idx = parseInt(player.id.replace("top_", ""));
      if (!isNaN(idx) && idx >= 0 && idx < 4) {
        drawTutorialBubbleAtUI(ctx, engine, idx, "快連打按鈕", picTopuse3Image);
      }
    }
  }

  // Draw screen overlay for active cooperations
  const activeCoop = engine.tops.find(
    (t) => t.coopState && t.coopState.isLeader,
  );
  if (
    activeCoop &&
    GameUtils.getLatestActiveTutorial(engine, activeCoop) ===
      "active_coop_overlay"
  ) {
    const state = activeCoop.coopState!;
    // 僅在對峙與後退準備發動二次蓄力的大衝撞之時，提醒連打按鍵
    if (state.phase === "standoff" || state.phase === "retreat_rotate") {
      const isUpper = activeCoop.label === "P3" || activeCoop.label === "P4";
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Static text scale to prevent jitter/shaking
      const textScale = 1;

      // Shift entirely to the left or right side of the screen to guarantee it NEVER covers the tops in the center
      const isLeft = activeCoop.x < 960;
      const drawX = isLeft ? 300 : CANVAS_W - 300;

      if (isUpper) {
        ctx.translate(drawX, CANVAS_H / 2 + 250);
        ctx.rotate(Math.PI);
      } else {
        ctx.translate(drawX, CANVAS_H / 2 - 250);
      }
      ctx.scale(textScale, textScale);

      ctx.font = 'bold 50px "Courier New"';
      ctx.fillStyle = "#fbbf24"; // 深邃金黃

      // 厚黑色文字描邊線
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#000000";

      const isVersus = engine.gameMode === "versus";
      const textToUse = isVersus ? "快連打按鈕!!" : "快轉動陀螺!!";
      const imgToUse = isVersus ? picTopuse3Image : picTopuse2Image;

      // Draw image above the text
      const imgW = isVersus ? 540 : 360;
      const imgH = isVersus ? 540 : 360;
      if (imgToUse.complete && imgToUse.width > 0) {
        ctx.drawImage(imgToUse, -imgW / 2, -imgH - 20, imgW, imgH);
      }

      ctx.strokeText(textToUse, 0, 0);
      ctx.fillText(textToUse, 0, 0);

      ctx.restore();
    }
  }

  // Draw screen overlay for active boss struggle clash
  const activeBossStruggle = engine.zombies.find(
    (z) =>
      (z.type === "zombie_boss" || z.type === "zombie_black") &&
      (z as any).bossAttackState === "struggle_clash",
  );
  if (false && activeBossStruggle) {
    const player = engine.tops.find(
      (t) => t.id === (activeBossStruggle as any).bossWarningTargetId,
    );
    if (player) {
      const isUpper = player.label === "P3" || player.label === "P4";
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Center text at same screen coordinates as activeCoop
      if (isUpper) {
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 + 250);
        ctx.rotate(Math.PI);
      } else {
        ctx.translate(CANVAS_W / 2, CANVAS_H / 2 - 250);
      }

      ctx.font = 'bold 50px "Courier New", "Space Grotesk", sans-serif';
      ctx.fillStyle = "#fbbf24"; // Deep gold

      // Thick black stroke outlines
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#000000";
      ctx.strokeText("快轉動陀螺!!", 0, 0);

      // Fill main text
      ctx.fillText("快轉動陀螺!!", 0, 0);

      // Draw PIC_TOPUSE_02 image above or below the text
      const imgW = 360;
      const imgH = 360;
      if (picTopuse2Image.complete && picTopuse2Image.width > 0) {
        ctx.drawImage(picTopuse2Image, -imgW / 2, 45, imgW, imgH);
      }

      ctx.restore();
    }
  }

  // --- Draw Custom Stage 2 Transition Screen Overlay ---
  if (engine.areaTransitionOverlayAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${engine.areaTransitionOverlayAlpha})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();
  }
}

function drawModelSelectionUI(
  ctx: CanvasRenderingContext2D,
  pStat: PlayerStats,
  drawX: number,
  drawY: number,
  barW: number,
  barH: number,
  prof: any,
) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.fillRect(drawX - 10, drawY - 10, barW + 20, barH);
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.strokeRect(drawX - 10, drawY - 10, barW + 20, barH);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f8fafc";
  ctx.font = 'bold 20px "Courier New"';
  ctx.fillText(
    `${prof.label} 請選擇陀螺型號 (按鈕確認)`,
    drawX + barW / 2,
    drawY + 12,
  );

  const numModels = 4;
  const optionWidth = 90;
  const spacing = 20;
  const totalW = numModels * optionWidth + (numModels - 1) * spacing;
  const startX = drawX + (barW - totalW) / 2;

  for (let i = 0; i < numModels; i++) {
    const optionX = startX + i * (optionWidth + spacing);
    const optionY = drawY + 30;
    const isSelected = pStat.selectedModelIndex === i;

    // Draw background
    ctx.fillStyle = isSelected
      ? "rgba(56, 189, 248, 0.2)"
      : "rgba(30, 41, 59, 0.5)";
    ctx.fillRect(optionX, optionY, optionWidth, optionWidth);

    ctx.strokeStyle = isSelected ? "#38bdf8" : "#475569";
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeRect(optionX, optionY, optionWidth, optionWidth);

    // Draw image
    const sprite = getSelectionSprite(prof.color, prof.pilot, i + 1);
    if (sprite) {
      ctx.drawImage(
        sprite,
        optionX + 5,
        optionY + 5,
        optionWidth - 10,
        optionWidth - 10,
      );
    }

    // Draw selection indicator
    if (isSelected) {
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(optionX + optionWidth / 2 - 8, optionY - 8);
      ctx.lineTo(optionX + optionWidth / 2 + 8, optionY - 8);
      ctx.lineTo(optionX + optionWidth / 2, optionY);
      ctx.fill();
    }
  }
}

export function drawUI(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  const padding = 8;
  const barW = 460;
  const barH = 140; // Increased from 95
  const positions = [
    { x: padding, y: CANVAS_H - 130 - padding, align: "left" },
    {
      x: CANVAS_W - barW - padding,
      y: CANVAS_H - 130 - padding,
      align: "right",
    },
    { x: padding, y: padding + 10, align: "left" },
    { x: CANVAS_W - barW - padding, y: padding + 10, align: "right" },
  ];

  PLAYER_PROFILES.forEach((prof, idx) => {
    const top = engine.tops.find((t) => t.id === `top_${idx}`);
    const score = engine.scores[idx];
    const isAlive = !!top;

    const pos = positions[idx];

    let drawX = pos.x;
    let drawY = pos.y;
    if (
      isAlive &&
      top &&
      top.damageShockTimer !== undefined &&
      top.damageShockTimer > 0 &&
      top.hp > 0
    ) {
      const shakeIntensity = 8 * (top.damageShockTimer / 0.45);
      drawX += (Math.random() - 0.5) * shakeIntensity;
      drawY += (Math.random() - 0.5) * shakeIntensity;
    }

    ctx.save();

    if (idx === 2 || idx === 3) {
      const centerX = drawX + barW / 2;
      const centerY = drawY + barH / 2 - 10;
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.PI);
      ctx.translate(-centerX, -centerY);
    }

    const pStat = engine.participants.find((part) => part.id === `top_${idx}`);
    if (pStat && pStat.isActive && pStat.selectionState === "selecting") {
      drawModelSelectionUI(ctx, pStat, drawX, drawY, barW, barH, prof);
      ctx.restore();
      return;
    }

    const isActiveSlot = engine.activeSlots[idx];
    if (!isActiveSlot) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.fillRect(drawX - 10, drawY - 10, barW + 20, barH);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.strokeRect(drawX - 10, drawY - 10, barW + 20, barH);

      ctx.strokeStyle = "rgba(71, 85, 105, 0.2)";
      ctx.lineWidth = 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(drawX - 10, drawY - 10, barW + 20, barH);
      ctx.clip();
      const spacing = 16;
      for (let offset = -barH; offset < barW + 40; offset += spacing) {
        ctx.beginPath();
        ctx.moveTo(drawX - 10 + offset, drawY - 10);
        ctx.lineTo(drawX - 10 + offset + barH, drawY - 10 + barH);
        ctx.stroke();
      }
      ctx.restore();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "rgba(148, 163, 184, 0.45)";
      ctx.font = 'bold 18px "Courier New"';
      ctx.fillText(`— ${prof.label} —`, drawX + barW / 2, drawY + 30);

      ctx.fillStyle = "#ef4444";
      ctx.font = 'bold 22px "Courier New"';
      ctx.fillText("未參戰", drawX + barW / 2, drawY + 65);

      ctx.fillStyle = "#f59e0b";
      ctx.font = 'bold 15px "Courier New"';
      ctx.fillText(`按 [${idx + 1}] 鍵投幣加入`, drawX + barW / 2, drawY + 100);

      ctx.restore();
      return;
    }

    if (!isAlive) {
      ctx.globalAlpha = 0.4;
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.fillRect(drawX - 10, drawY - 10, barW + 20, barH);

    if (
      isAlive &&
      top &&
      top.damageShockTimer !== undefined &&
      top.damageShockTimer > 0
    ) {
      const ratio = top.damageShockTimer / 0.45;
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * ratio})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(drawX - 10, drawY - 10, barW + 20, barH);
      ctx.restore();
    } else {
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(drawX - 10, drawY - 10, barW + 20, barH);
    }

    // Define text rendering helper for pristine drop-shadow text
    const drawTextWithShadow = (
      text: string,
      x: number,
      y: number,
      color: string,
      font: string,
    ) => {
      ctx.save();
      ctx.font = font;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillText(text, x + 1.5, y + 1.5);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    };

    const labelText = isAlive
      ? top && top.isAI
        ? `${prof.label} (電腦)`
        : prof.label
      : `${prof.label} (淘汰)`;

    // --- Column 1: Left Half (Text-based Info) ---
    // Line 1: Player ID / Status & Tickets/Score combined
    drawTextWithShadow(
      labelText,
      drawX + 10,
      drawY + 19,
      prof.color,
      'bold 24px "Courier New"',
    );

    ctx.save();
    ctx.font = 'bold 24px "Courier New"';
    const labelW = ctx.measureText(labelText).width;
    ctx.restore();

    drawTextWithShadow(
      ` | 彩票: ${score}`,
      drawX + 10 + labelW,
      drawY + 19,
      "#ffffff",
      'bold 20px "Courier New"',
    );

    // Line 2: Coin Prompt / Token Count (moved up from Line 3)
    const coinText = `按[${idx + 1}]投幣 | 代幣:${top ? (top.coins ?? 0) : 0}`;
    drawTextWithShadow(
      coinText,
      drawX + 10,
      drawY + 57,
      "#10b981",
      'bold 16px "Courier New"',
    );

    // --- Column 2: Right Half (Bar-based Info) ---
    const innerBarX = drawX + 265;
    const innerBarW = 185;

    // 1. HP Bar (Durability) (vertically aligned with Line 1 text at drawY + 19)
    const hpBarY = drawY + 10;
    const hpBarH = 18;

    // Draw deeper background slot
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(innerBarX, hpBarY, innerBarW, hpBarH);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(innerBarX, hpBarY, innerBarW, hpBarH);

    if (isAlive && top) {
      const hpRatio = Math.max(0, top.hp / top.maxHp);
      const visualRatio = Math.max(0, (top.visualHp ?? top.hp) / top.maxHp);

      // Draw Catch-up Segment (glowing orange-crimson backing damage representation)
      if (visualRatio > hpRatio) {
        const catchX = innerBarX + hpRatio * innerBarW;
        const catchW = (visualRatio - hpRatio) * innerBarW;

        const gradTrailing = ctx.createLinearGradient(
          catchX,
          hpBarY,
          catchX + catchW,
          hpBarY,
        );
        gradTrailing.addColorStop(0, "#ea580c"); // intense orange-red
        gradTrailing.addColorStop(0.5, "#f97316"); // glowing orange
        gradTrailing.addColorStop(1, "#ffedd5"); // white-hot tip

        ctx.fillStyle = gradTrailing;
        ctx.fillRect(catchX, hpBarY, catchW, hpBarH);
      }

      // Draw Active HP Segment
      if (hpRatio > 0) {
        const currentHpW = hpRatio * innerBarW;

        // Determine color based on ratio with severe flash at <30%
        let barColor = "#10b981"; // Emerald Green
        if (hpRatio < 0.3) {
          const flash = Math.floor(Date.now() / 150) % 2 === 0;
          barColor = flash ? "#ef4444" : "#7f1d1d"; // blinking high-contrast red
        } else if (hpRatio < 0.6) {
          barColor = "#f59e0b"; // Amber warning
        }

        ctx.fillStyle = barColor;
        ctx.fillRect(innerBarX, hpBarY, currentHpW, hpBarH);

        // Draw diagonal stripes
        ctx.save();
        ctx.beginPath();
        ctx.rect(innerBarX, hpBarY, currentHpW, hpBarH);
        ctx.clip();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 3;
        const stripeSpacing = 10;
        for (
          let offset = -20;
          offset < currentHpW + 20;
          offset += stripeSpacing
        ) {
          ctx.beginPath();
          ctx.moveTo(innerBarX + offset, hpBarY);
          ctx.lineTo(innerBarX + offset + 20, hpBarY + hpBarH);
          ctx.stroke();
        }
        ctx.restore();

        // Beautiful Glass Gloss Overlay (light top gloss & dark bottom shadow)
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fillRect(innerBarX, hpBarY, currentHpW, 6);
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.fillRect(innerBarX, hpBarY + 14, currentHpW, 4);

        // Flash Overlay on initial hard impact
        if (top.damageShockTimer !== undefined && top.damageShockTimer > 0) {
          const pulseAlpha = Math.min(
            0.8,
            (top.damageShockTimer / 0.45) * 0.85,
          );
          ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
          ctx.fillRect(innerBarX, hpBarY, currentHpW, hpBarH);
        }

        // Spark at Leading Edge
        if (currentHpW < innerBarW) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(innerBarX + currentHpW - 2, hpBarY - 2, 4, hpBarH + 4);
          ctx.restore();
        }
      }
    }

    // Durability Label (Left side of right column)
    ctx.save();
    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Black shadow/outline effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillText("能量", drawX + 225 + 1, hpBarY + hpBarH / 2 + 1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("能量", drawX + 225, hpBarY + hpBarH / 2);

    // Current Energy Value (Centered inside the HP Bar)
    if (top && isAlive) {
      const currentEnergyValue = Math.max(0, Math.ceil(top.hp)).toString();
      const textCenterX = innerBarX + innerBarW / 2;

      ctx.textAlign = "center";
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillText(
        currentEnergyValue,
        textCenterX + 1,
        hpBarY + hpBarH / 2 + 1,
      );
      ctx.fillStyle = "#ffffff";
      ctx.fillText(currentEnergyValue, textCenterX, hpBarY + hpBarH / 2);
    }
    ctx.restore();

    // 2. Spin Bar (轉速)
    const spinBarY = drawY + 48;
    const spinBarH = 18;
    const totalSegments = 10;
    const segmentGap = 3;
    const segmentW =
      (innerBarW - (totalSegments - 1) * segmentGap) / totalSegments;

    if (isAlive && top) {
      const isCastingSkill =
        (top.skillActiveTimer !== undefined && top.skillActiveTimer > 0) ||
        (top.model2SkillTimer !== undefined && top.model2SkillTimer > 0) ||
        (top.model3SkillTimer !== undefined && top.model3SkillTimer > 0);

      // When in Star (fever/invincible) state and casting its skill, keep the spin bar fully active and rainbow colored (don't decay)
      let activeCount = Math.max(
        1,
        Math.min(10, Math.floor((top.spin / top.maxSpin) * 10)),
      );
      if (
        ((top.superTimer !== undefined && top.superTimer > 0) ||
          (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)) &&
        isCastingSkill
      ) {
        activeCount = 10;
      }
      const isBarFullSpin =
        top.spin >= (top.maxSpin || 1000) ||
        (((top.superTimer !== undefined && top.superTimer > 0) ||
          (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)) &&
          isCastingSkill);

      for (let i = 0; i < totalSegments; i++) {
        const segX = innerBarX + i * (segmentW + segmentGap);

        // Background Slot Box
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(segX, spinBarY, segmentW, spinBarH);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.strokeRect(segX, spinBarY, segmentW, spinBarH);

        if (i < activeCount) {
          let fillerColor = "#38bdf8"; // Blue Spin
          if (
            (top.superTimer !== undefined && top.superTimer > 0) ||
            (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)
          ) {
            const hue = (Date.now() / 10 + i * 20) % 360;
            fillerColor = `hsl(${hue}, 90%, 60%)`;
          } else if (isBarFullSpin) {
            const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 120);
            const r = Math.floor(251 - 20 * pulse);
            const g = Math.floor(191 + 64 * pulse);
            const b = Math.floor(36 + 219 * pulse);
            fillerColor = `rgb(${r}, ${g}, ${b})`;
          } else if (activeCount === 1) {
            const flash = Math.floor(Date.now() / 200) % 2 === 0;
            fillerColor = flash ? "#ef4444" : "#450a0a"; // Vibrant red / dark red flashing
          } else if (activeCount >= 8) {
            fillerColor = "#22c55e"; // Green for high energy
          } else if (activeCount <= 3) {
            fillerColor = "#f97316"; // Orange warning
          }

          ctx.fillStyle = fillerColor;
          ctx.fillRect(segX + 1, spinBarY + 1, segmentW - 2, spinBarH - 2);

          // Glass Overlay Gloss
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(segX + 1, spinBarY + 1, segmentW - 2, 5);
          ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
          ctx.fillRect(segX + 1, spinBarY + spinBarH - 6, segmentW - 2, 5);
        }
      }

      // 轉速全滿時，整條轉速條要有持續閃爍漸變與外圍流光特效
      if (isBarFullSpin) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";

        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 120); // 快速閃爍

        // 繪製整條轉速條的外圍金色/白金色發光外框
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.6 * pulse})`;
        ctx.lineWidth = 1.5 + 2.0 * pulse;
        ctx.strokeRect(
          innerBarX - 1,
          spinBarY - 1,
          innerBarW + 2,
          spinBarH + 2,
        );

        // 在整條滿轉速條上覆蓋一層微亮金至白色的動態閃爍光暈漸層
        const grad = ctx.createLinearGradient(
          innerBarX,
          spinBarY,
          innerBarX + innerBarW,
          spinBarY,
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.1 + 0.35 * pulse})`);
        grad.addColorStop(0.5, `rgba(251, 191, 36, ${0.3 + 0.5 * pulse})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${0.1 + 0.35 * pulse})`);

        ctx.fillStyle = grad;
        ctx.fillRect(innerBarX, spinBarY, innerBarW, spinBarH);

        ctx.restore();
      }
    }

    // Spin Label inside Spin Bar (轉速)
    ctx.save();
    ctx.font = 'bold 16px "Courier New"';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    // Black shadow/outline effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillText("轉速", drawX + 225 + 1, spinBarY + spinBarH / 2 + 1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("轉速", drawX + 225, spinBarY + spinBarH / 2);
    ctx.restore();

    // 3. Collection Missions
    if (isAlive && top && top.missions) {
      const missionStartX = drawX + 10;
      const missionStartY = drawY + 80;
      const slotW = 140;
      const slotH = 45;
      const slotGap = 10; // (460 - 420) / 4 = 10 roughly

      top.missions.forEach((mission, mIdx) => {
        const sX = missionStartX + mIdx * (slotW + slotGap);
        const sY = missionStartY;

        ctx.save();

        if (mission.completed) {
          ctx.globalCompositeOperation = "screen";
          const hue = (Date.now() * 0.5) % 360;
          ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
          ctx.shadowBlur = 15;
          ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
          ctx.lineWidth = 3;
          ctx.strokeRect(sX, sY, slotW, slotH);
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.3 + 0.3 * Math.sin(Date.now() / 100)})`;
          ctx.fillRect(sX, sY, slotW, slotH);
          ctx.globalCompositeOperation = "source-over";
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
          ctx.fillRect(sX, sY, slotW, slotH);
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sX, sY, slotW, slotH);
        }

        let iconColor = "#ffffff";
        let iconText = "";
        if (mission.targetType === "zombie_small") {
          iconColor = "#22c55e";
          iconText = "小";
        } else if (mission.targetType === "zombie_big") {
          iconColor = "#9333ea";
          iconText = "紫";
        } else if (mission.targetType === "zombie_bomb") {
          iconColor = "#8b4513";
          iconText = "咖";
        } else if (mission.targetType === "zombie_bouncing") {
          iconColor = "#be185d";
          iconText = "粉";
        }

        ctx.beginPath();
        ctx.arc(sX + 22, sY + slotH / 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = iconColor;
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 13px "Microsoft JhengHei", "Courier New"';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(iconText, sX + 22, sY + slotH / 2 + 1);

        ctx.font = 'bold 18px "Courier New"';
        ctx.textAlign = "center";
        ctx.fillStyle = mission.completed ? "#facc15" : "#e2e8f0";
        ctx.fillText(
          `${mission.currentCount}/${mission.targetCount}`,
          sX + 85,
          sY + slotH / 2,
        );
        
        if (mission.textTimer !== undefined && mission.textTimer > 0) {
            ctx.save();
            ctx.font = 'bold 22px "Microsoft JhengHei", "Courier New"';
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            
            // Pop up animation effect (scale up and bobbing)
            const pulse = Math.sin(Date.now() * 0.01) * 2;
            const textY = sY - 10 + pulse;
            
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 4;
            ctx.fillStyle = "#fbbf24"; // Gold color
            
            const msg = "任務達成!";
            ctx.strokeText(msg, sX + slotW / 2, textY);
            ctx.fillText(msg, sX + slotW / 2, textY);
            ctx.restore();
        }

        ctx.restore();
      });
    }

    if (isAlive && top && top.hp <= 0) {
      ctx.save();
      ctx.font = 'bold 36px "Microsoft JhengHei"';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const blink = Math.floor(Date.now() / 300) % 2 === 0;
      ctx.fillStyle = blink ? "#fbbf24" : "#ef4444"; // blink gold/red
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 6;

      const timeSinceDeath = Date.now() - ((top as any).deathTimestamp || 0);
      const timeLeft = Math.max(0, 20 - Math.floor(timeSinceDeath / 1000));
      const msg =
        timeLeft > 0 ? `快投幣補充能量!! (${timeLeft})` : "快投幣補充能量!!";
      const textX = drawX + barW / 2;
      const textY = idx === 2 || idx === 3 ? drawY + 120 : drawY - 20;

      ctx.strokeText(msg, textX, textY);
      ctx.fillText(msg, textX, textY);

      ctx.restore();
    }

    ctx.restore();
  });

  // Draw connecting dashed lines from each active player's UI to their top
  engine.tops.forEach((top) => {
    // Find player index from top id (e.g., "top_0" -> 0)
    const idx = parseInt(top.id.replace("top_", ""));
    if (isNaN(idx) || idx < 0 || idx >= PLAYER_PROFILES.length) return;

    // Ensure player slot is active
    if (!engine.activeSlots[idx]) return;

    const prof = PLAYER_PROFILES[idx];
    const pos = positions[idx];

    // Define UI connect point in screen coordinates (center-facing edge of UI card)
    let uiX = 0;
    let uiY = 0;

    if (idx === 0) {
      // P1: Bottom-left. Connect from right edge center of the UI box
      uiX = pos.x + barW + 10;
      uiY = pos.y + 37.5;
    } else if (idx === 1) {
      // P2: Bottom-right. Connect from left edge center of the UI box
      uiX = pos.x - 10;
      uiY = pos.y + 37.5;
    } else if (idx === 2) {
      // P3: Top-left. Right-edge center visually
      uiX = pos.x + barW + 10;
      uiY = pos.y + 37.5;
    } else if (idx === 3) {
      // P4: Top-right. Left-edge center visually
      uiX = pos.x - 10;
      uiY = pos.y + 37.5;
    }

    // Calculate top's screen coordinates (transforming from world to screen)
    // We include screen shake using (engine as any).lastShakeX / lastShakeY
    const shakeX = (engine as any).lastShakeX || 0;
    const shakeY = (engine as any).lastShakeY || 0;
    const topScreenX =
      CANVAS_W / 2 + (top.x - engine.camera.x) * engine.camera.zoom + shakeX;
    const topScreenY =
      CANVAS_H / 2 + (top.y - engine.camera.y) * engine.camera.zoom + shakeY;

    ctx.save();

    // 1. Draw a soft outer glowing line
    ctx.strokeStyle = prof.color;
    ctx.lineWidth = 4.5;
    ctx.globalAlpha = 0.25;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(uiX, uiY);
    ctx.lineTo(topScreenX, topScreenY);
    ctx.stroke();

    // 2. Draw the core dashed line
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(uiX, uiY);
    ctx.lineTo(topScreenX, topScreenY);
    ctx.stroke();

    // 3. Draw an elegant small glowing anchor dot at the UI panel connection point
    ctx.fillStyle = prof.color;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(uiX, uiY, 5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Draw a tiny white inner core to the anchor dot to make it shine/glow
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(uiX, uiY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });

  // Restore global screen shake scale/translate
  ctx.restore();

  if (engine.introActive) {
    if (engine.introStage === "message") {
      drawIntroMessage(ctx, engine);
    } else if (engine.introStage === "boss_message") {
      drawBossIntroMessage(ctx, engine);
    }
  }

  if (engine.versusEndActive) {
    drawVersusEndMessage(ctx, engine);
  }

  // Time
  ctx.save();
  ctx.font = 'bold 32px "Courier New"';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const displayTime = Math.floor(engine.timeElapsed);
  const mins = Math.floor(displayTime / 60);
  const secs = Math.floor(displayTime % 60);
  const timerText = `${mins}:${secs.toString().padStart(2, "0")}`;

  const textWidth = ctx.measureText(timerText).width;
  const boxW = textWidth + 32;
  const boxH = 40;
  const boxX = (CANVAS_W - boxW) / 2;
  const boxY = 10;

  // Draw sleek tech-style pill container
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Text Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
  ctx.fillText(timerText, CANVAS_W / 2 + 1, boxY + boxH / 2 + 1);

  // Timer Text
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(timerText, CANVAS_W / 2, boxY + boxH / 2);

  // Key Area (Collective Keys)
  if (engine.gameMode === "campaign") {
    const keyText = `${engine.collectiveKeys || 0}/5`;
    ctx.font = 'bold 30px "Courier New"';
    const keyTextWidth = ctx.measureText(keyText).width;
    const keyBoxW = keyTextWidth + 50;
    const keyBoxX = boxX + boxW + 20; // 20px to the right of the timer

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(keyBoxX, boxY, keyBoxW, boxH);
    ctx.strokeStyle = "#eab308"; // yellow border
    ctx.lineWidth = 1.5;
    ctx.strokeRect(keyBoxX, boxY, keyBoxW, boxH);

    // Draw little key icon
    ctx.save();
    ctx.translate(keyBoxX + 22, boxY + boxH / 2);

    ctx.fillStyle = "#eab308";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-6, 0, 4, 0, Math.PI * 2); // Key head
    ctx.rect(-2, -2, 12, 4); // Key shaft
    ctx.rect(4, 2, 3, 3); // Key teeth 1
    ctx.rect(8, 2, 3, 3); // Key teeth 2
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Draw Text
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillText(keyText, keyBoxX + 38 + 1, boxY + boxH / 2 + 1);
    ctx.fillStyle = "#eab308";
    ctx.fillText(keyText, keyBoxX + 38, boxY + boxH / 2);
  }

  ctx.restore();
}

export function drawIntroMessage(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
) {
  const elapsed = 2.4 - engine.messageTimer;
  let alpha = 1.0;
  let scale = 1.0;

  if (elapsed < 0.2) {
    // Pop in
    const t = elapsed / 0.2;
    alpha = t;
    scale = 2.5 - 1.5 * t;
  } else if (engine.messageTimer < 0.25) {
    // Fade out/scale up
    const t = engine.messageTimer / 0.25;
    alpha = t;
    scale = 1.5 - 0.5 * t;
  } else {
    // Pulse slightly
    scale = 1.0 + Math.sin(Date.now() * 0.008) * 0.05;
  }

  ctx.save();
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Futuristic semi-transparent dark backing banner
  ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
  ctx.fillRect(-CANVAS_W / 2, -90, CANVAS_W, 180);

  // Neon warnings borders (glowing gold)
  ctx.strokeStyle = "rgba(234, 179, 8, 0.75)";
  ctx.lineWidth = 4;
  // Removed shadowColor for perf
  // Removed shadowBlur for perf
  ctx.beginPath();
  ctx.moveTo(-CANVAS_W / 2, -90);
  ctx.lineTo(CANVAS_W / 2, -90);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-CANVAS_W / 2, 90);
  ctx.lineTo(CANVAS_W / 2, 90);
  ctx.stroke();
  // Removed shadowBlur for perf // reset shadow

  const text = "戰 鬥 開 始 !";
  ctx.font = 'black italic 92px "Courier New", sans-serif';
  if (ctx.font.includes("10px")) {
    ctx.font = "bold italic 92px sans-serif";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Chromatic split offset highlights
  ctx.fillStyle = "#ef4444";
  ctx.fillText(text, -4, 4);

  ctx.fillStyle = "#06b6d4";
  ctx.fillText(text, 4, -4);

  // Metallic core gradient with high backglow
  ctx.save();
  // Removed shadowColor for perf
  // Removed shadowBlur for perf

  const grad = ctx.createLinearGradient(0, -40, 0, 40);
  grad.addColorStop(0, "#fef08a");
  grad.addColorStop(0.5, "#f59e0b");
  grad.addColorStop(1, "#ea580c");
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();

  ctx.restore();
}

export function drawBossIntroMessage(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
) {
  const elapsed = 1.6 - engine.messageTimer;
  let alpha = 1.0;
  let scale = 1.0;

  if (elapsed < 0.2) {
    const t = elapsed / 0.2;
    alpha = t;
    scale = 2.5 - 1.5 * t;
  } else if (engine.messageTimer < 0.25) {
    const t = engine.messageTimer / 0.25;
    alpha = t;
    scale = 1.5 - 0.5 * t;
  } else {
    scale = 1.0 + Math.sin(Date.now() * 0.015) * 0.04;
  }

  ctx.save();
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Dark crimson overlay backing banner
  ctx.fillStyle = "rgba(28, 0, 0, 0.88)";
  ctx.fillRect(-CANVAS_W / 2, -90, CANVAS_W, 180);

  // Neon borders (glowing red)
  ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-CANVAS_W / 2, -90);
  ctx.lineTo(CANVAS_W / 2, -90);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-CANVAS_W / 2, 90);
  ctx.lineTo(CANVAS_W / 2, 90);
  ctx.stroke();

  const text = "魔 王 降 臨 !";
  ctx.font = 'black italic 92px "Courier New", sans-serif';
  if (ctx.font.includes("10px")) {
    ctx.font = "bold italic 92px sans-serif";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Chromatic split offset highlights
  ctx.fillStyle = "#dc2626";
  ctx.fillText(text, -4, 4);

  ctx.fillStyle = "#f97316";
  ctx.fillText(text, 4, -4);

  ctx.save();

  const grad = ctx.createLinearGradient(0, -40, 0, 40);
  grad.addColorStop(0, "#fecaca");
  grad.addColorStop(0.5, "#ef4444");
  grad.addColorStop(1, "#991b1b");
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();

  ctx.restore();
}

export function drawVersusEndMessage(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
) {
  const elapsed = 1.6 - engine.versusEndTimer;
  let alpha = 1.0;
  let scale = 1.0;

  if (elapsed < 0.2) {
    // Pop in
    const t = elapsed / 0.2;
    alpha = t;
    scale = 2.5 - 1.5 * t;
  } else if (engine.versusEndTimer < 0.25) {
    // Fade out/scale up
    const t = engine.versusEndTimer / 0.25;
    alpha = t;
    scale = 1.5 - 0.5 * t;
  } else {
    // Pulse slightly
    scale = 1.0 + Math.sin(Date.now() * 0.008) * 0.05;
  }

  ctx.save();
  ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Futuristic semi-transparent dark backing banner
  ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
  ctx.fillRect(-CANVAS_W / 2, -90, CANVAS_W, 180);

  // Neon warnings borders (glowing cyan / light blue)
  ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
  ctx.lineWidth = 4;
  // Removed shadowColor for perf
  // Removed shadowBlur for perf
  ctx.beginPath();
  ctx.moveTo(-CANVAS_W / 2, -90);
  ctx.lineTo(CANVAS_W / 2, -90);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-CANVAS_W / 2, 90);
  ctx.lineTo(CANVAS_W / 2, 90);
  ctx.stroke();
  // Removed shadowBlur for perf // reset shadow

  const text = "勝 負 分 曉 !";
  ctx.font = 'black italic 92px "Courier New", sans-serif';
  if (ctx.font.includes("10px")) {
    ctx.font = "bold italic 92px sans-serif";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Chromatic split offset highlights
  ctx.fillStyle = "#ef4444";
  ctx.fillText(text, -4, 4);

  ctx.fillStyle = "#06b6d4";
  ctx.fillText(text, 4, -4);

  // Metallic core gradient with high backglow
  ctx.save();
  // Removed shadowColor for perf
  // Removed shadowBlur for perf

  const grad = ctx.createLinearGradient(0, -40, 0, 40);
  grad.addColorStop(0, "#e0f2fe");
  grad.addColorStop(0.5, "#0ea5e9");
  grad.addColorStop(1, "#0369a1");
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();

  ctx.restore();
}

export function drawCapsuleBorder(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
) {
  return;
  ctx.save();

  // 2. Draw high-fidelity glowing border walls
  const centerY = 540;
  const leftCenterX = 540;
  const rightCenterX = 1380;
  const R = 480;

  // Outer neon shadow glow
  ctx.save();
  // Removed shadowColor for perf
  // Removed shadowBlur for perf
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 14;
  ctx.beginPath();
  drawCapsulePath(ctx, R);
  ctx.stroke();
  ctx.restore();

  // Neon core border
  ctx.strokeStyle = "#60a5fa";
  ctx.lineWidth = 6;
  ctx.beginPath();
  drawCapsulePath(ctx, R);
  ctx.stroke();

  // Hot center highlight
  ctx.strokeStyle = "#f1f5f9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawCapsulePath(ctx, R);
  ctx.stroke();

  ctx.restore();
}
