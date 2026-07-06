import * as GameUtils from "../systems/GameUtils";
import type { GameEngine } from "../GameEngine";
import { zombie3D } from "./Zombie3DRenderer";
import { drawCapsulePath } from "./Utils";
import { CANVAS_W, CANVAS_H, MAX_SPIN } from "../constants";
import {
  Top,
  Zombie,
  Obstacle,
  Item,
  Particle,
  Entity,
  ConcreteBlock,
  Afterimage,
  PlayerStats,
  Projectile,
  PhantomClone,
} from "../types";
import picTopuse2Src from "../../PIC/PIC_TOPUSE_02.png";

const picTopuse2Image = new Image();
picTopuse2Image.src = picTopuse2Src;

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  sprites: Record<string, HTMLCanvasElement>,
) {
  // Draw Concrete Blocks
  engine.concreteBlocks.forEach((block) => {
    ctx.save();
    const left = block.x - block.w / 2;
    const top = block.y - block.h / 2;

    if (block.flashTimer !== undefined && block.flashTimer > 0) {
      ctx.filter = "brightness(0) invert(1)";
    }

    // Scaled detail dimensions (50% of original for perfect high-fidelity visual consistency)
    const shadowOff = 8;
    const borderOff = 8;
    const stripeOff = 4;
    const screwOffset = 12;
    const screwRadius = 3;
    const frameLineWidth = 3;

    // Drop heavy shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(left + shadowOff, top + shadowOff, block.w, block.h);

    // Concrete outer fill
    ctx.fillStyle = "#475569"; // slate-600
    ctx.fillRect(left, top, block.w, block.h);

    // Darker core plate
    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.fillRect(
      left + borderOff,
      top + borderOff,
      block.w - borderOff * 2,
      block.h - borderOff * 2,
    );

    // Outer highlighted steel framing
    ctx.strokeStyle = "#94a3b8"; // slate-400
    ctx.lineWidth = frameLineWidth;
    ctx.strokeRect(left, top, block.w, block.h);

    // Shading highlights for concrete texture feel (subtle X inside)
    ctx.strokeStyle = "#334155"; // slate-700
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left + borderOff, top + borderOff);
    ctx.lineTo(left + block.w - borderOff, top + block.h - borderOff);
    ctx.moveTo(left + block.w - borderOff, top + borderOff);
    ctx.lineTo(left + borderOff, top + block.h - borderOff);
    ctx.stroke();

    // Inner highlighted steel framing
    ctx.strokeStyle = "#64748b"; // slate-500
    ctx.lineWidth = 1;
    ctx.strokeRect(
      left + borderOff,
      top + borderOff,
      block.w - borderOff * 2,
      block.h - borderOff * 2,
    );

    // Yellow warning striped margins
    ctx.strokeStyle = "#eab308"; // Amber hazard indicator
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(
      left + stripeOff,
      top + stripeOff,
      block.w - stripeOff * 2,
      block.h - stripeOff * 2,
    );
    ctx.setLineDash([]);

    // Technical details: 4 metal screw points on corners
    ctx.fillStyle = "#e2e8f0";
    const screwPos = [
      { x: left + screwOffset, y: top + screwOffset },
      { x: left + block.w - screwOffset, y: top + screwOffset },
      { x: left + screwOffset, y: top + block.h - screwOffset },
      { x: left + block.w - screwOffset, y: top + block.h - screwOffset },
    ];
    screwPos.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, screwRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bolt slot line
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - 1.5, p.y - 1.5);
      ctx.lineTo(p.x + 1.5, p.y + 1.5);
      ctx.stroke();
    });

    // Draw cracks on the concrete block as durability drops
    const dur = block.durability ?? 5;
    if (dur < 5) {
      ctx.strokeStyle = "#0f172a"; // very dark shadow cracks
      ctx.lineWidth = 2.5;

      // Deterministic seed for cracks based on block.id
      let seed = 0;
      for (let c = 0; c < block.id.length; c++) {
        seed += block.id.charCodeAt(c);
      }

      const random = () => {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const crackCount = (5 - dur) * 2; // more cracks as it is damaged
      for (let i = 0; i < crackCount; i++) {
        const px = left + borderOff + random() * (block.w - borderOff * 2);
        const py = top + borderOff + random() * (block.h - borderOff * 2);
        const length = 12 + random() * 20;
        const angleRad = random() * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(
          px + Math.cos(angleRad) * length,
          py + Math.sin(angleRad) * length,
        );
        ctx.stroke();
      }
    }

    // Draw segmented durability indicator for concrete block (Hidden per user request)
    if (false && dur < 5) {
      const barWidth = Math.min(45, block.w - 16);
      const barHeight = 5;
      const startX = block.x - barWidth / 2;
      const startY = top - 12; // drawn neatly above the concrete block

      // Translucent background
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(startX - 2, startY - 2, barWidth + 4, barHeight + 4);

      // Tech cyan to orange to red
      const pct = Math.max(0, dur / 5);
      const color = pct > 0.6 ? "#38bdf8" : pct > 0.2 ? "#f97316" : "#ef4444";
      ctx.fillStyle = color;
      ctx.fillRect(startX, startY, barWidth * pct, barHeight);

      // Dark separators
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const tickX = startX + (barWidth / 5) * i;
        ctx.beginPath();
        ctx.moveTo(tickX, startY);
        ctx.lineTo(tickX, startY + barHeight);
        ctx.stroke();
      }
    }

    ctx.restore();
  });

  // Draw Obstacles
  engine.obstacles.forEach((o) => {
    if ((o.type as string) === "item_crate") {
      // Ground / floor shadow underneath the floating object
      const hoverAmp = 12;
      const hoverSpeed = 0.004;
      const bounceHeight =
        Math.abs(Math.sin(Date.now() * hoverSpeed + o.x * 0.05)) * hoverAmp;
      const offsetY = -bounceHeight;

      const shadowX = o.x;
      const shadowY = o.y + 14;
      const shadowT = bounceHeight / hoverAmp;
      const shadowDilation = 1.0 - shadowT * 0.3;
      const shadowAlpha = 0.45 - shadowT * 0.3;

      ctx.save();
      ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(
        shadowX,
        shadowY,
        20 * shadowDilation,
        7 * shadowDilation,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      // Dynamic 3D Star Coordinates (No auto-rotation, pointing straight up)
      const dx = o.x;
      const dy = o.y + offsetY - 8;
      const outerRadius = 26; // nice and visible
      const innerRadius = 12;
      const angle = -Math.PI / 2; // Fixed angle pointing straight up

      ctx.save();

      if (o.flashTimer !== undefined && o.flashTimer > 0) {
        ctx.filter = "brightness(0) invert(1)";
      }

      // Helper to path a 5-point star
      const pathStar = (
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        rot: number,
      ) => {
        ctx.beginPath();
        const spikes = 5;
        let step = Math.PI / spikes;
        let currentRot = rot;
        ctx.moveTo(
          cx + Math.cos(currentRot) * outerRadius,
          cy + Math.sin(currentRot) * outerRadius,
        );
        for (let i = 0; i < spikes * 2; i++) {
          let r = i % 2 === 0 ? outerRadius : innerRadius;
          let x = cx + Math.cos(currentRot) * r;
          let y = cy + Math.sin(currentRot) * r;
          ctx.lineTo(x, y);
          currentRot += step;
        }
        ctx.closePath();
      };

      // Draw the 3D extrusion side (shading depth layers)
      ctx.fillStyle = "#1e1b4b"; // solid deep dark purple/slate extrusion body
      for (let d = 5; d > 0; d--) {
        pathStar(ctx, dx, dy + d, angle);
        ctx.fill();
      }

      // Draw Top Star Face with Dynamic Cycling Rainbow Colors
      const timeSec = Date.now() / 1500;
      const topStarGrad = ctx.createLinearGradient(
        dx - outerRadius,
        dy - outerRadius,
        dx + outerRadius,
        dy + outerRadius,
      );
      for (let step = 0; step <= 5; step++) {
        const h = (timeSec * 360 + step * 45) % 360;
        topStarGrad.addColorStop(step / 5, `hsl(${h}, 95%, 62%)`);
      }

      // Add dynamic pulsating star glow
      // Removed shadowColor for perf
      // Removed shadowBlur for perf

      ctx.fillStyle = topStarGrad;
      pathStar(ctx, dx, dy, angle);
      ctx.fill();

      // Removed shadowBlur for perf // turn off glow for stroke & sweep details

      // Sharp polished white border stroke
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw high-fidelity moving specular light sweep overlay
      ctx.save();
      pathStar(ctx, dx, dy, angle);
      ctx.clip(); // restrict specular sweep strictly to inside top star face

      const sweepX = dx + Math.sin(Date.now() / 400) * 45;
      const glossGrad = ctx.createLinearGradient(
        sweepX - 20,
        dy - outerRadius,
        sweepX + 20,
        dy + outerRadius,
      );
      glossGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      glossGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.45)");
      glossGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glossGrad;
      ctx.fillRect(
        dx - outerRadius * 2,
        dy - outerRadius * 2,
        outerRadius * 4,
        outerRadius * 4,
      );
      ctx.restore();

      ctx.restore();
      return;
    }

    if (o.type === "obstacle_chest" && zombie3D.isLoaded) {
      const dom = zombie3D.getFrame(false, false, 0, 0, "box");
      if (dom) {
        const drawSize = 130 * (o.radius / 40) * 0.8;
        ctx.save();
        ctx.translate(o.x, o.y);

        // Calculate a shifting neon rainbow hue for the outer glow
        const time = Date.now() * 0.0035;
        const hue = (time * 60) % 360;

        // Apply a highly polished, glowing outer drop shadow that matches the exact shape of the box
        // Base glow is proportional to chest radius. Pulse/expansion amplitude is 50% of the base glow radius.
        const baseGlow = 31.2 * (o.radius / 40);
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 1)`;
        ctx.shadowBlur = baseGlow + Math.sin(time * 2) * (baseGlow * 0.5);

        if (o.flashTimer !== undefined && o.flashTimer > 0) {
          ctx.filter = "brightness(0) invert(1)";
        }
        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = true;

        // Draw the textured box. With shadow properties enabled, 
        // HTML5 Canvas creates a gorgeous contour-conforming glowing aura around the box!
        ctx.drawImage(dom, -drawSize / 2, -drawSize / 2, drawSize, drawSize);

        ctx.imageSmoothingEnabled = prevSmoothing;
        if (o.flashTimer !== undefined && o.flashTimer > 0) {
          ctx.filter = "none";
        }
        ctx.restore();
        return;
      }
    }

    ctx.save();
    let spr = sprites["barrel"];
    let sprW = spr.width;
    let sprH = spr.height;
    if (o.type === "obstacle_chest") {
      spr = sprites["chest"];
      const scale = o.radius / 40; // Scale up proportionally (e.g. 1.5 when radius is 60)
      sprW = spr.width * scale;
      sprH = spr.height * scale;
    }

    if (o.flashTimer !== undefined && o.flashTimer > 0) {
      ctx.filter = "brightness(0) invert(1)";
    }
    ctx.drawImage(spr, o.x - sprW / 2, o.y - sprH / 2, sprW, sprH);
    if (o.flashTimer !== undefined && o.flashTimer > 0) {
      ctx.filter = "none";
    }

    // Central red alarm light flashing continuously for the bomb barrel
    if (o.type === "obstacle_barrel") {
      const time = Date.now();
      const blinkT = (Math.sin(time * 0.007) + 1) / 2; // oscillates 0 to 1

      // Pulsing hot red glow centered inside the reactor chamber of the bomb barrel
      const glowRad = 5 + blinkT * 9; // expands smoothly
      const glowAlpha = 0.25 + blinkT * 0.75; // dynamic breathing alpha

      ctx.save();
      ctx.beginPath();
      ctx.arc(o.x, o.y, glowRad, 0, Math.PI * 2);

      const blinkGrad = ctx.createRadialGradient(
        o.x,
        o.y,
        0,
        o.x,
        o.y,
        glowRad,
      );
      blinkGrad.addColorStop(0, "#ffffff"); // blinding white warning core
      blinkGrad.addColorStop(0.35, `rgba(239, 68, 68, ${glowAlpha})`); // warning red
      blinkGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = blinkGrad;
      ctx.fill();
      ctx.restore();
    }

    // Draw segmented durability indicator for barrels (Hidden per user request)
    if (false && o.type === "obstacle_barrel") {
      const maxDur = 1;
      const dur = o.durability ?? maxDur;
      const barWidth = 40;
      const barHeight = 6;
      const startX = o.x - barWidth / 2;
      const startY = o.y - o.radius - 12;

      // Translucent background
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(startX - 2, startY - 2, barWidth + 4, barHeight + 4);

      // Colorful segments: red indicating threat/hazard
      const pct = Math.max(0, dur / maxDur);
      const color = "#ef4444"; // Red for explosive barrel
      ctx.fillStyle = color;
      ctx.fillRect(startX, startY, barWidth * pct, barHeight);
    }
    ctx.restore();
  });

  // Draw Zombies
  engine.zombies.forEach((z) => {
    // Draw pulsing warning range beneath the boss face
    if ((z.type === "zombie_boss" || z.type === "zombie_black") && (z as any).bossAttackState === "warning") {
      const boss = z as any;
      const pulse = 0.5 + 0.4 * Math.sin(Date.now() * 0.02);

      if (boss.bossSelectedAttack === "bomb") {
        // Draw 3 pulsing red warning circles at the bomb target positions
        if (boss.bossBombTargets) {
          boss.bossBombTargets.forEach((tg: { x: number; y: number }) => {
            ctx.save();
            ctx.translate(tg.x, tg.y);

            // 1. Semi-transparent pulsing red fill
            ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + pulse * 0.1})`;
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.fill();

            // 2. Dashed red outline
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.3})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.stroke();

            // 3. Central danger crosshair
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(-5, 0);
            ctx.moveTo(5, 0);
            ctx.lineTo(15, 0);
            ctx.moveTo(0, -15);
            ctx.lineTo(0, -5);
            ctx.moveTo(0, 5);
            ctx.lineTo(0, 15);
            ctx.stroke();

            // Exclamation mark
            ctx.fillStyle = `rgba(239, 68, 68, ${0.75 + pulse * 0.25})`;
            ctx.font = 'bold 20px "Courier New"';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("!", 0, -1);

            ctx.restore();
          });
        }
      } else if (boss.bossSelectedAttack === "earthquake") {
        // Draw pulsing red warning area centered on the boss with a radius of exactly 350px
        ctx.save();
        ctx.translate(z.x, z.y);

        // 1. Semi-transparent pulsing red fill with 350px radius
        ctx.fillStyle = `rgba(239, 68, 68, ${0.16 + pulse * 0.12})`;
        ctx.beginPath();
        ctx.arc(0, 0, 350, 0, Math.PI * 2);
        ctx.fill();

        // 2. Dashed red outline
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.65 + pulse * 0.25})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, 350, 0, Math.PI * 2);
        ctx.stroke();

        // 3. Central danger crosshair (larger size matching 350px range scale)
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(-50, 0);
        ctx.lineTo(-12, 0);
        ctx.moveTo(12, 0);
        ctx.lineTo(50, 0);
        ctx.moveTo(0, -50);
        ctx.lineTo(0, -12);
        ctx.moveTo(0, 12);
        ctx.lineTo(0, 50);
        ctx.stroke();

        // 4. Exclamation mark at center
        ctx.fillStyle = `rgba(239, 68, 68, ${0.75 + pulse * 0.25})`;
        ctx.font = 'bold 36px "Courier New"';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", 0, -2);

        ctx.restore();
      } else if (boss.bossSelectedAttack === "struggle" || z.type === "zombie_black") {
        // Draw Red Crosshair Target lock over the targeted player!
        const targetTop = engine.tops.find(
          (t) => t.id === boss.bossWarningTargetId,
        );
        if (targetTop) {
          // Draw flashing dashed line from the enemy to the targeted player
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(z.x, z.y);
          ctx.lineTo(targetTop.x, targetTop.y);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
          ctx.lineWidth = 6.0;
          ctx.setLineDash([20, 15]);
          ctx.lineDashOffset = -Date.now() / 30;
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.translate(targetTop.x, targetTop.y);

          // Animated spin angle for lock-on UI
          const rotAngle = (Date.now() / 330) % (Math.PI * 2);
          ctx.rotate(rotAngle);

          // Pulsing crosshair graphics: Brackets & Laser Crosshairs
          ctx.strokeStyle = "#ef4444"; // Red!
          ctx.lineWidth = 5.0; // Thicker brackets

          // Draw Brackets (4 corners)
          const size = 90 + 15 * Math.sin(Date.now() * 0.02); // Pulsing size, scaled up substantially
          const bracketLen = 24; // Larger brackets

          // Semi-transparent vibrant warning backdrop fill
          ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
          ctx.fill();

          // Top-Left Corner
          ctx.beginPath();
          ctx.moveTo(-size, -size + bracketLen);
          ctx.lineTo(-size, -size);
          ctx.lineTo(-size + bracketLen, -size);
          ctx.stroke();

          // Top-Right Corner
          ctx.beginPath();
          ctx.moveTo(size, -size + bracketLen);
          ctx.lineTo(size, -size);
          ctx.lineTo(size - bracketLen, -size);
          ctx.stroke();

          // Bottom-Left Corner
          ctx.beginPath();
          ctx.moveTo(-size, size - bracketLen);
          ctx.lineTo(-size, size);
          ctx.lineTo(-size + bracketLen, size);
          ctx.stroke();

          // Bottom-Right Corner
          ctx.beginPath();
          ctx.moveTo(size, size - bracketLen);
          ctx.lineTo(size, size);
          ctx.lineTo(size - bracketLen, size);
          ctx.stroke();

          // Draw spinning hazard outline dashed circle
          ctx.setLineDash([10, 8]);
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
          ctx.stroke();

          // Central crosshair lines
          ctx.setLineDash([]);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
          ctx.lineWidth = 4.0;
          ctx.beginPath();
          ctx.moveTo(-size * 0.5, 0);
          ctx.lineTo(-size * 0.2, 0);
          ctx.moveTo(size * 0.2, 0);
          ctx.lineTo(size * 0.5, 0);
          ctx.moveTo(0, -size * 0.5);
          ctx.lineTo(0, -size * 0.2);
          ctx.moveTo(0, size * 0.2);
          ctx.lineTo(0, size * 0.5);
          ctx.stroke();

          // Pulsing "! LOCK" Text in red monospace under target
          ctx.rotate(-rotAngle); // rotate back for text
          ctx.fillStyle = `rgba(239, 68, 68, ${0.85 + pulse * 0.15})`;
          ctx.font = 'bold 20px "JetBrains Mono", "Space Grotesk", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("WARN: TARGET LOCK", 0, -size - 22);

          ctx.restore();
        }
      } else {
        // Default Dash Attack warning channel
        ctx.save();
        ctx.translate(z.x, z.y);
        const angle = Math.atan2(
          z.bossDashDirectionY ?? 0,
          z.bossDashDirectionX ?? 1,
        );
        ctx.rotate(angle);

        // Pulsing red transparent hazard channel
        ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + pulse * 0.12})`;
        ctx.fillRect(0, -128, 2000, 256);

        // Warn borders
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + pulse * 0.35})`;
        ctx.lineWidth = 4;
        ctx.setLineDash([30, 20]);
        ctx.strokeRect(0, -128, 2000, 256);
        ctx.restore();
      }
    }

    // Draw bouncing zombie landing warnings
    if (
      z.type === "zombie_bouncing" &&
      ((z as any).bouncingAttackState === "warning" ||
        (z as any).bouncingAttackState === "bouncing" ||
        (z as any).bouncingAttackState === "death_warning" ||
        (z as any).bouncingAttackState === "death_bouncing")
    ) {
      const bz = z as any;
      const isDeath =
        bz.bouncingAttackState === "death_warning" ||
        bz.bouncingAttackState === "death_bouncing";
      const pulse = 0.5 + 0.4 * Math.sin(Date.now() * 0.02);
      if (bz.bouncingTargets) {
        bz.bouncingTargets.forEach(
          (tg: { x: number; y: number }, idx: number) => {
            // Highlight current target slightly more or hide completed ones
            if (idx < (bz.bouncingCurrentTargetIndex ?? 0)) return; // already landed

            ctx.save();
            ctx.translate(tg.x, tg.y);

            const isCurrent = idx === (bz.bouncingCurrentTargetIndex ?? 0);
            const curPulse = isCurrent
              ? pulse
              : 0.2 + 0.1 * Math.sin(Date.now() * 0.02);

            // 1. Semi-transparent pulsing fill (120px radius!)
            ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + curPulse * 0.1})`;
            ctx.beginPath();
            ctx.arc(0, 0, 120, 0, Math.PI * 2);
            ctx.fill();

            // 2. Dashed outline
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.6 + curPulse * 0.3})`;
            ctx.lineWidth = isCurrent ? 4 : 2;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, 120, 0, Math.PI * 2);
            ctx.stroke();

            // 3. Central danger crosshair
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + curPulse * 0.3})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(-25, 0);
            ctx.lineTo(-10, 0);
            ctx.moveTo(10, 0);
            ctx.lineTo(25, 0);
            ctx.moveTo(0, -25);
            ctx.lineTo(0, -10);
            ctx.moveTo(0, 10);
            ctx.lineTo(0, 25);
            ctx.stroke();

            // Exclamation mark
            ctx.fillStyle = `rgba(239, 68, 68, ${0.75 + curPulse * 0.25})`;
            ctx.font = 'bold 36px "Courier New"';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("!", 0, -2);

            ctx.restore();
          },
        );
      }
    }

    // Draw pulsing warning hazard channel beneath Big Zombies in warning state (Changed to Red per request)
    if (
      (z.type === "zombie_big" || z.type === "zombie_bomb") &&
      (z as any).bigAttackState === "warning"
    ) {
      const big = z as any;
      const pulse = 0.5 + 0.4 * Math.sin(Date.now() * 0.02);

      if (z.type === "zombie_bomb") {
        // Draw a giant circular warning for the upcoming earthquake
        ctx.save();
        ctx.translate(big.x, big.y);

        ctx.fillStyle = `rgba(239, 68, 68, ${0.14 + pulse * 0.12})`;
        ctx.beginPath();
        ctx.arc(0, 0, 350, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.35})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([25, 15]);
        ctx.beginPath();
        ctx.arc(0, 0, 350, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(big.x, big.y);
        const angle = Math.atan2(
          big.bigDashDirectionY ?? 0,
          big.bigDashDirectionX ?? 1,
        );
        ctx.rotate(angle);

        // Pulsing red transparent hazard channel (matching 128px body diameter)
        ctx.fillStyle = `rgba(239, 68, 68, ${0.14 + pulse * 0.12})`;
        ctx.fillRect(0, -64, 2000, 128);

        // Warn borders
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.35})`;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([25, 15]);
        ctx.strokeRect(0, -64, 2000, 128);
        ctx.restore();
      }
    }

    // Draw active red laser beams when Boss or Big Zombies are in 'dash' state
    if (z.type === "zombie_boss" && (z as any).bossAttackState === "dash") {
      const boss = z as any;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      const angle = Math.atan2(
        boss.bossDashDirectionY ?? 0,
        boss.bossDashDirectionX ?? 1,
      );
      ctx.rotate(angle);

      // Outer glow shadow
      // Removed shadowColor for perf
      // Removed shadowBlur for perf

      // Deep red outer beam (matching 256px width)
      ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
      ctx.fillRect(0, -128, 2000, 256);

      // Bright red neon inner beam
      ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
      ctx.fillRect(0, -60, 2000, 120);

      // Intense white-hot core
      ctx.fillStyle = "#ffffff";
      // Removed shadowColor for perf
      // Removed shadowBlur for perf
      ctx.fillRect(0, -15, 2000, 30);

      ctx.restore();
    }

    if (z.type === "zombie_big" && (z as any).bigAttackState === "dash") {
      const big = z as any;
      ctx.save();
      ctx.translate(big.x, big.y);
      const angle = Math.atan2(
        big.bigDashDirectionY ?? 0,
        big.bigDashDirectionX ?? 1,
      );
      ctx.rotate(angle);

      // Outer glow shadow
      // Removed shadowColor for perf
      // Removed shadowBlur for perf

      // Red outer beam (matching 128px width)
      ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
      ctx.fillRect(0, -64, 2000, 128);

      // Bright red neon inner beam
      ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
      ctx.fillRect(0, -30, 2000, 60);

      // White-hot core
      ctx.fillStyle = "#ffffff";
      // Removed shadowColor for perf
      // Removed shadowBlur for perf
      ctx.fillRect(0, -8, 2000, 16);

      ctx.restore();
    }

    const spr = sprites[z.type];
    ctx.save();
    let zDrawX = z.x;
    let zDrawY = z.y;
    if (
      engine.zombieSiegeActive &&
      engine.siegeStatus === "clinging" &&
      (z as any).isSiegeZombie
    ) {
      zDrawX += (Math.random() - 0.5) * 16;
      zDrawY += (Math.random() - 0.5) * 16;
    }
    if (z.type === "zombie_boss") {
      if ((z as any).struggleJitterX !== undefined) {
        zDrawX += (z as any).struggleJitterX;
        zDrawY += (z as any).struggleJitterY;
      }
    }
    if (z.type === "zombie_boss" && (z as any).isDying) {
      // Violent vibration during the final death process
      zDrawX += (Math.random() - 0.5) * 24;
      zDrawY += (Math.random() - 0.5) * 24;
    }
    ctx.translate(zDrawX, zDrawY);

    if (z.type === "zombie_boss" && (z as any).isDying) {
      // Boss swells dynamically based on remaining time (from 1.0 to 1.38 size)
      const elapsed = 3.0 - ((z as any).bossDyingTimer ?? 3.0);
      const swelling = 1.0 + 0.38 * (elapsed / 3.0);
      ctx.scale(swelling, swelling);
    }

    // Calculate vertical leap/jump offset during earthquake leap
    let yOffset = 0;
    let shadowScale = 1.0;
    if (
      (z.introState === "jumping" || (z as any).bossAttackState === "leave_jump") &&
      (z as any).introZ !== undefined &&
      (z as any).introZ > 0
    ) {
      yOffset = -(z as any).introZ;
      shadowScale = Math.max(0.2, 1.0 - (z as any).introZ / 120);
    } else if (
      z.type === "zombie_boss" &&
      (z as any).introZ !== undefined &&
      (z as any).introZ > 0
    ) {
      yOffset = -(z as any).introZ;
      shadowScale = Math.max(0.1, 1.0 - (z as any).introZ / 1500);
    } else if (
      z.type === "zombie_boss" &&
      (z as any).bossAttackState === "earthquake_leap"
    ) {
      const timer = (z as any).bossAttackTimer || 0;
      const duration = 0.8;
      const progress = timer / duration;
      // Parabolic trajectory: rise up, then fall down
      yOffset = -220 * 4 * progress * (1 - progress);
      shadowScale = 0.5 + 0.5 * (1.0 - progress * 4 * (1 - progress));
    } else if (
      z.type === "zombie_bomb" &&
      (z as any).bigAttackState === "earthquake_leap"
    ) {
      const timer = (z as any).bigAttackTimer || 0;
      const duration = 0.8;
      const progress = timer / duration;
      yOffset = -220 * 4 * progress * (1 - progress);
      shadowScale = 0.5 + 0.5 * (1.0 - progress * 4 * (1 - progress));
    } else if (
      z.type === "zombie_bouncing" &&
      (z as any).introZ !== undefined &&
      (z as any).introZ > 0
    ) {
      yOffset = -(z as any).introZ;
      shadowScale = Math.max(0.1, 1.0 - (z as any).introZ / 300);
    } else if (
      z.bounceTimer !== undefined &&
      z.bounceTimer > 0 &&
      z.maxBounceTimer !== undefined &&
      z.maxBounceTimer > 0
    ) {
      const ratio = Math.max(0, Math.min(1, z.bounceTimer / z.maxBounceTimer));
      let maxJumpH =
        z.type === "zombie_boss"
          ? 30
          : z.type === "zombie_big" || z.type === "zombie_bomb"
            ? 55
            : 80;
      if (z.type === "zombie_black" && z.hitByDash) {
        maxJumpH = 340; // Super high throw into the air with spinning!
      }
      const jumpH = 4 * ratio * (1 - ratio);
      yOffset -= jumpH * maxJumpH;
      shadowScale *= Math.max(0.1, 1.0 - jumpH * 0.85);
    }

    // Ground shadow under the zombie/monster (drawn before rotation)
    ctx.save();
    const zox = 8;
    const zoy = 15;
    const zShadowRadius = Math.max(z.radius * 1.5, 30) * shadowScale;
    const zGrad = ctx.createRadialGradient(
      zox,
      zoy,
      zShadowRadius * 0.1,
      zox,
      zoy,
      zShadowRadius,
    );
    zGrad.addColorStop(0, `rgba(0, 0, 0, ${0.85 * shadowScale})`);
    zGrad.addColorStop(0.5, `rgba(0, 0, 0, ${0.4 * shadowScale})`);
    zGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = zGrad;
    ctx.beginPath();
    ctx.arc(zox, zoy, zShadowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (yOffset !== 0) {
      ctx.translate(0, yOffset);
    }

    if (
      z.type === "zombie_boss" &&
      (z as any).introZ !== undefined &&
      (z as any).introZ > 0
    ) {
      const scaleUp = 1.0 + (z as any).introZ / 300;
      ctx.scale(scaleUp, scaleUp);
    }

    // Draw a glowing, flashing purple octagonal shield frame when Boss is in invincible or super armor (special poise) state
    if (z.type === "zombie_boss" && !(z as any).isDying) {
      const bossState = (z as any).bossAttackState;
      const isInvincibleOrSpecial =
        bossState === "warning" ||
        bossState === "dash" ||
        bossState === "earthquake_leap" ||
        ((z as any).introZ !== undefined && (z as any).introZ > 0);
      if (isInvincibleOrSpecial) {
        ctx.save();
        // Custom independent continuous fast rotation for the shield frame
        const shieldRot = (Date.now() / 250) % (Math.PI * 2);
        ctx.rotate(shieldRot);

        // Radius just outside the boss shoulder guard/claws (around 162px)
        // Increased radius by 25% (162 * 1.25 = 202.5, 6 * 1.25 = 7.5)
        const shieldRad = 202.5 + 7.5 * Math.sin(Date.now() / 90);
        // Flashing opacity (rapid but smooth energetic flashing/pulsing)
        const shieldAlpha = 0.45 + 0.5 * Math.abs(Math.sin(Date.now() / 150));

        // Draw 3 nested concentric hexagons (Outer is thick, inner is thin)
        const drawHexagonFrame = (
          radius: number,
          strokeStyle: string,
          lineWidth: number,
        ) => {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const theta = (i * Math.PI) / 3;
            const ox = radius * Math.cos(theta);
            const oy = radius * Math.sin(theta);
            if (i === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
          }
          ctx.closePath();
          ctx.stroke();
        };

        // ---- Honeycomb internal fill ----
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const theta = (i * Math.PI) / 3;
          const ox = shieldRad * Math.cos(theta);
          const oy = shieldRad * Math.sin(theta);
          if (i === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
        }
        ctx.closePath();
        ctx.clip(); // Clip honeycomb to inside the shield

        const hexSize = 25; // size of the small hexagons
        ctx.strokeStyle = `rgba(168, 85, 247, ${shieldAlpha * 0.35})`;
        ctx.lineWidth = 2.0;

        const hexWidth = Math.sqrt(3) * hexSize;
        const hexHeight = 2 * hexSize;
        const xOffset = hexWidth;
        const yOffset = 1.5 * hexSize;

        // Compute grid size based on shield boundaries to avoid excess drawing
        const bound = shieldRad + hexSize * 2;
        const startX = -Math.ceil(bound / xOffset);
        const endX = Math.ceil(bound / xOffset);
        const startY = -Math.ceil(bound / yOffset);
        const endY = Math.ceil(bound / yOffset);

        ctx.beginPath();
        for (let row = startY; row <= endY; row++) {
          for (let col = startX; col <= endX; col++) {
            const cx = col * xOffset + (row % 2 !== 0 ? xOffset / 2 : 0);
            const cy = row * yOffset;

            if (cx * cx + cy * cy <= bound * bound) {
              for (let i = 0; i < 6; i++) {
                const theta = (i * Math.PI) / 3 + Math.PI / 6; // rotated 30 degrees for pointy top
                const px = cx + hexSize * Math.cos(theta);
                const py = cy + hexSize * Math.sin(theta);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
            }
          }
        }
        ctx.stroke();
        ctx.restore();
        // ---------------------------------

        // 1. Outer frame: Thick and dark violet
        drawHexagonFrame(
          shieldRad + 14,
          `rgba(126, 34, 206, ${shieldAlpha * 0.7})`,
          7.5,
        );

        // 2. Middle frame: Medium and medium purple
        drawHexagonFrame(
          shieldRad,
          `rgba(168, 85, 247, ${shieldAlpha * 0.85})`,
          4.0,
        );

        // 3. Inner frame: Thinnest and bright lavender
        drawHexagonFrame(
          shieldRad - 14,
          `rgba(243, 232, 255, ${shieldAlpha * 0.95})`,
          1.8,
        );

        // 4. Draw small pulsing terminal nodes (circles) at the 6 corners of the middle hexagon
        for (let i = 0; i < 6; i++) {
          const theta = (i * Math.PI) / 3;
          const ox = shieldRad * Math.cos(theta);
          const oy = shieldRad * Math.sin(theta);

          // Outer node glow ring
          ctx.fillStyle = `rgba(216, 180, 254, ${shieldAlpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(ox, oy, 5, 0, Math.PI * 2);
          ctx.fill();

          // Inner white node core
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(ox, oy, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // 5. Draw 3x enlarged weakness mark fixed to one of the 8 facing directions of the boss
        if (
          (z as any).weakCornerIndex !== undefined &&
          bossState === "warning"
        ) {
          ctx.save();
          const currentShieldRad = 202.5 + 7.5 * Math.sin(Date.now() / 90);
          const headingAngle = z.angle - Math.PI / 2;
          const weakAngle =
            headingAngle + ((z as any).weakCornerIndex * Math.PI) / 4;
          const ox = currentShieldRad * Math.cos(weakAngle);
          const oy = currentShieldRad * Math.sin(weakAngle);

          ctx.translate(ox, oy);

          ctx.beginPath();
          ctx.moveTo(-54, -45);
          ctx.lineTo(54, -45);
          ctx.lineTo(0, 45);
          ctx.closePath();

          ctx.fillStyle = "#ef4444"; // Red
          ctx.fill();
          ctx.lineWidth = 10.5; // 3.5 * 3
          ctx.strokeStyle = "#facc15"; // Yellow
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    ctx.rotate(z.angle);

    // [NEW] White circular whirlwind effect for knockback spinning
    const anyZ = z as any;
    const isSkillPrep =
      anyZ.bigAttackState === "warning" ||
      anyZ.bouncingAttackState === "warning" ||
      anyZ.bossAttackState === "warning";

    if (!isSkillPrep && z.bounceTimer !== undefined && z.bounceTimer > 0) {
      ctx.save();

      // Add some extra independent fast rotation to the whirlwind
      const windRot = (Date.now() * 0.015) % (Math.PI * 2);
      ctx.rotate(windRot);

      const baseRad = Math.max(40, z.radius * 1.4);
      const alphaRatio = z.maxBounceTimer
        ? Math.max(0, Math.min(1, z.bounceTimer / z.maxBounceTimer))
        : 1;

      // Outer ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * alphaRatio})`;
      ctx.lineWidth = 2; // THINNER
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, baseRad, 0, Math.PI * 0.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, baseRad, Math.PI, Math.PI * 1.6);
      ctx.stroke();

      // Inner reverse-spinning ring
      ctx.rotate(-windRot * 1.8);
      ctx.strokeStyle = `rgba(241, 245, 249, ${0.9 * alphaRatio})`; // Slate-100 (near white)
      ctx.lineWidth = 1; // THINNER
      ctx.beginPath();
      ctx.arc(0, 0, baseRad * 0.75, 0, Math.PI * 0.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, baseRad * 0.75, Math.PI * 0.6, Math.PI * 1.0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, baseRad * 0.75, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

      ctx.restore();
    }

    if (z.type === "zombie_golden") {
      // Golden glow disabled per user request
      // ctx.shadowBlur = 25;
      // ctx.shadowColor = "#fde047";
    } else if (z.type === "zombie_black") {
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#a855f7";
    }

    // User explicitly requested enemies should not become transparent and flash when hit.
    // The hitCooldown transparency oscillation is removed to respect this request.
    if (z.flashTimer !== undefined && z.flashTimer > 0) {
      ctx.filter = "brightness(0) invert(1)";
    }
    if (
      (z.type === "zombie_small" ||
        z.type === "zombie_bomb" ||
        z.type === "zombie_bouncing" ||
        z.type === "zombie_golden" ||
        z.type === "zombie_boss" ||
        z.type === "zombie_black" ||
        z.type === "zombie_big") &&
      zombie3D.isLoaded
    ) {
      const isDead = (z as any).isDying === true;
      let seed = 0;
      for (let i = 0; i < z.id.length; i++) seed += z.id.charCodeAt(i);

      let animTime = Date.now() / 1000 + (seed % 10);
      if (isDead) {
        const initialTimer =
          z.type === "zombie_bomb"
            ? 1.33
            : z.type === "zombie_bouncing"
              ? 1.25
              : 0.6;
        animTime = initialTimer - ((z as any).dyingTimer || 0);
      }

      // Get the frame
      let isAttacking = false;
      let attackTime = 0;

      if (z.type === "zombie_bomb") {
        const zAny = z as any;
        const state = zAny.bigAttackState;
        if (state === "warning" || state === "earthquake_leap") {
          isAttacking = true;
          // Hurt01 animation duration is from frame 100 to 198 (approx 3.26s at 30fps)
          // warning is 1.5s, earthquake_leap is 0.8s (total 2.3s)
          const totalSkillTime = 2.3;
          let timeSpent = 0;
          if (state === "warning") {
            timeSpent = 1.5 - (zAny.bigAttackTimer || 0);
          } else if (state === "earthquake_leap") {
            timeSpent = 1.5 + (0.8 - (zAny.bigAttackTimer || 0));
          }
          attackTime = timeSpent;
        }
      } else if (z.type === "zombie_bouncing") {
        const zAny = z as any;
        const state = zAny.bouncingAttackState;
        if (state === "warning" || state === "bouncing") {
          isAttacking = true;
          if (state === "warning") {
            attackTime = 1.5 - (zAny.bouncingAttackTimer || 0);
          } else {
            // duration is 0.8s
            const prog = 1.0 - (zAny.bouncingAttackTimer || 0) / 0.8;
            // play Fly_s from 0 to 0.8 for each jump
            attackTime = prog * 0.8;
          }
        }
      } else if (z.type === "zombie_big") {
        const zAny = z as any;
        const state = zAny.bigAttackState;
        if (state === "warning" || state === "dash") {
          isAttacking = true;
          const totalSkillTime = 1.75; // 1.5s warning + 0.25s dash
          if (state === "warning") {
            attackTime = 1.5 - (zAny.bigAttackTimer || 0);
          } else if (state === "dash") {
            attackTime = 1.5 + (0.25 - (zAny.bigAttackTimer || 0));
          }
        } else if (z.attackTimer !== undefined && z.attackTimer > 0) {
          isAttacking = true;
          attackTime = 25 / 30 - Math.max(0, z.attackTimer!);
        }
      } else if (z.type === "zombie_boss" || z.type === "zombie_black") {
        const zAny = z as any;
        const state = zAny.bossAttackState;
        
        if (state && state !== 'idle' && state !== 'leaving' && state !== 'leave_jump') {
          isAttacking = true;
          // Determine attackTime from timer
          const maxTime = zAny.bossSelectedAttack === 'struggle' ? 1.5 : (z.type === 'zombie_black' ? 1.5 : 2.0);
          if (state === 'warning') {
            attackTime = maxTime - (zAny.bossAttackTimer || 0);
          } else if (state === 'dash') {
            attackTime = 2.0 + (0.25 - (zAny.bossAttackTimer || 0));
          } else if (state === 'struggle_charge' || state === 'struggle_clash') {
            attackTime = maxTime + (4.0 - (zAny.bossAttackTimer || 0));
          } else if (state === 'earthquake_leap') {
            attackTime = 2.0 + (0.8 - (zAny.bossAttackTimer || 0));
          }
        }
      } else {
        isAttacking = z.attackTimer !== undefined && z.attackTimer > 0;
        if (isAttacking) {
          if (z.fbxModel === "dog") {
            attackTime = 25 / 30 - Math.max(0, z.attackTimer!);
          } else if (z.fbxModel === "football") {
            attackTime = 25 / 30 - Math.max(0, z.attackTimer!);
          } else if (z.fbxModel === "bombman") {
            attackTime = 40 / 30 - Math.max(0, z.attackTimer!);
          } else {
            attackTime = 10 / 30 - Math.max(0, z.attackTimer!);
          }
        } else {
          attackTime = 0;
        }
      }

      let actionName: string | undefined = undefined;
      if (z.type === 'zombie_boss') {
          const state = (z as any).bossAttackState;
          const selected = (z as any).bossSelectedAttack;
          if (isDead) {
              actionName = 'idle';
          } else if (state && state !== 'idle') {
              if (selected === 'dash' || selected === 'struggle') {
                  actionName = 'middle_reward_failure';
              } else if (selected === 'earthquake' || selected === 'bomb') {
                  actionName = 'idle';
              }
          }
      } else if (z.type === 'zombie_black') {
          const state = (z as any).bossAttackState;
          if (state === 'struggle_clash' || state === 'warning') {
              actionName = 'intimidate';
          } else if (state === 'struggle_charge') {
              isAttacking = false;
          }
      }

      const modelType = z.fbxModel || (z.type === "zombie_black" ? "monkey" : "man");
      const dom = zombie3D.getFrame(
        isDead,
        isAttacking,
        animTime,
        attackTime,
        modelType as any,
        actionName
      );
      if (dom) {
        let drawSize = 160 * (z.radius / 24);
        if (z.type === "zombie_bouncing") {
          drawSize *= 0.5; // Adjust 2D drawing size for WebGL scale 0.3
        }
        const prevSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(dom, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
        ctx.imageSmoothingEnabled = prevSmoothing;
      } else {
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      }
    } else {
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    }
    
    if ((z.type === "zombie_big" || z.type === "zombie_bomb" || z.type === "zombie_bouncing" || z.type === "zombie_golden" || z.type === "zombie_black" || z.type === "zombie_boss") && z.hp > 0) {
      let ticketAmount = 15;
      if (z.type === "zombie_big") ticketAmount = 6;
      else if (z.type === "zombie_bomb") ticketAmount = 8;
      else if (z.type === "zombie_bouncing") ticketAmount = 10;
      else if (z.type === "zombie_golden" || z.type === "zombie_black") ticketAmount = 15;
      else if (z.type === "zombie_boss") ticketAmount = 100;

      ctx.save();
      
      // Ensure visibility is reset so flashTimer lighter/alpha doesn't hide it
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";

      ctx.font = 'bold 36px "Space Grotesk", "JetBrains Mono", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const grad = ctx.createLinearGradient(0, -20, 0, 20);
      grad.addColorStop(0, "red");
      grad.addColorStop(0.2, "orange");
      grad.addColorStop(0.4, "yellow");
      grad.addColorStop(0.6, "green");
      grad.addColorStop(0.8, "blue");
      grad.addColorStop(1, "purple");

      ctx.lineJoin = "round";
      ctx.miterLimit = 2;

      ctx.lineWidth = 8;
      ctx.strokeStyle = grad;
      ctx.strokeText(ticketAmount.toString(), 0, 0);

      ctx.lineWidth = 4;
      ctx.strokeStyle = "black";
      ctx.strokeText(ticketAmount.toString(), 0, 0);

      ctx.fillStyle = "white";
      ctx.fillText(ticketAmount.toString(), 0, 0);

      ctx.restore();
    }

    ctx.restore();


  });

  // Draw Tops
  engine.tops.forEach((top) => {
    // Draw Concentric Contracting Rings & Max Spin Expanding Halos first
    const targetCenterX =
      top.state === "standby" && top.standbyCenterX !== undefined
        ? top.standbyCenterX
        : top.x;
    const targetCenterY =
      top.state === "standby" && top.standbyCenterY !== undefined
        ? top.standbyCenterY
        : top.y;

    if (top.contractRings && top.contractRings.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      top.contractRings.forEach((ring: any) => {
        let alpha = 0.55;
        if (ring.radius > 175) {
          alpha = (0.55 * (200 - ring.radius)) / 25;
        } else if (ring.radius < 65) {
          alpha = (0.55 * (ring.radius - top.radius)) / (65 - top.radius);
          if (alpha < 0) alpha = 0;
        }

        ctx.beginPath();
        ctx.arc(targetCenterX, targetCenterY, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = top.color;
        ctx.lineWidth = 3.5;
        // Removed shadowColor for perf
        // Removed shadowBlur for perf
        ctx.globalAlpha = alpha;
        ctx.stroke();
      });
      ctx.restore();
    }

    if (top.maxSpinHalos && top.maxSpinHalos.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      top.maxSpinHalos.forEach((halo: any) => {
        const pct = (halo.maxLife - halo.life) / halo.maxLife;
        const alpha = Math.max(0, 1.0 - pct);

        // Dual layered halo:
        // Layer 1: White-hot sharp ring (doubled stroke thickness)
        ctx.beginPath();
        ctx.arc(targetCenterX, targetCenterY, halo.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 11.0 * (1.0 - pct);
        // Removed shadowColor for perf
        // Removed shadowBlur for perf
        ctx.globalAlpha = alpha;
        ctx.stroke();

        // Layer 2: Wide colorful glowing rim bloom (doubled stroke thickness)
        ctx.beginPath();
        ctx.arc(targetCenterX, targetCenterY, halo.radius, 0, Math.PI * 2);
        ctx.strokeStyle = top.color;
        ctx.lineWidth = 32 * (1.0 - pct);
        // Removed shadowColor for perf
        // Removed shadowBlur for perf
        ctx.globalAlpha = alpha * 0.75;
        ctx.stroke();
      });
      ctx.restore();
    }

    const dynamicZ = (top.introZ ?? 0) + (top.zPos ?? 0);
    if (dynamicZ > 0) {
      ctx.save();
      const shadowScale = Math.max(0.2, 1.0 - dynamicZ / 1000);
      const shadowAlpha = Math.max(0.1, 0.45 * shadowScale);
      ctx.fillStyle = `rgba(2, 6, 23, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.arc(top.x, top.y, top.radius * shadowScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    if (top.isExploding && top.explosionTimer !== undefined) {
      ctx.globalAlpha = Math.max(0, top.explosionTimer / 2.0);
    }
    if (top.flashTimer !== undefined && top.flashTimer > 0) {
      // 原本的閃爍效果已移除，改由後方的 lighter 全白疊加來達成更強烈的受傷白色閃現效果
    }
    let topDrawX = top.x;
    let topDrawY = top.y;

    if ((top as any).introShake && (top as any).introShake > 0) {
      topDrawX += (Math.random() - 0.5) * (top as any).introShake;
      topDrawY += (Math.random() - 0.5) * (top as any).introShake;
    }

    if (top.launchPadState === "prep_spinning") {
      // 隨著時間倒數而逐漸強烈晃動，轉速強烈加速
      const baseTimer = (top as any).launchPadSource === 'multiplayer' ? 2.0 : 1.5;
      const timer = top.launchPadTimer ?? baseTimer;
      const progress = Math.min(1.0, Math.max(0.0, 1.0 - timer / baseTimer));
      const shakeIntensity = 3.0 + Math.pow(progress, 2.0) * 22.0; // scales up to 25px
      topDrawX += (Math.random() - 0.5) * shakeIntensity;
      topDrawY += (Math.random() - 0.5) * shakeIntensity;
    } else if (top.launchPadState === "charging") {
      // Peak charge vibration before blastoff
      const shakeIntensity = 25.0;
      topDrawX += (Math.random() - 0.5) * shakeIntensity;
      topDrawY += (Math.random() - 0.5) * shakeIntensity;
    } else if (
      engine.zombieSiegeActive &&
      engine.siegeStatus === "clinging" &&
      top.id === engine.siegeTargetPlayerId
    ) {
      topDrawX += (Math.random() - 0.5) * 16;
      topDrawY += (Math.random() - 0.5) * 16;
    } else if (top.state === "standby" && top.isSpinning) {
      // 陀螺加速時，本體保持微微的上下左右晃動
      topDrawX += (Math.random() - 0.5) * 5.0;
      topDrawY += (Math.random() - 0.5) * 5.0;
    }

    if (top.struggleJitterX !== undefined) {
      topDrawX += top.struggleJitterX;
    }
    if (top.struggleJitterY !== undefined) {
      topDrawY += top.struggleJitterY;
    }
    ctx.translate(topDrawX, topDrawY);

    // Dynamically scale player and active visual effects based on Gigantification skill state
    const drawingScaleFactor = GameUtils.getTopScale(engine, top);

    const currentDynamicZ = (top.introZ ?? 0) + (top.zPos ?? 0);
    if (currentDynamicZ > 0) {
      const currentScale = 1.0 + currentDynamicZ / 250;
      ctx.scale(currentScale, currentScale);
    } else {
      let yOffset = 0;
      let shadowScale = 1.0;
      if (
        top.bounceTimer !== undefined &&
        top.bounceTimer > 0 &&
        top.maxBounceTimer !== undefined &&
        top.maxBounceTimer > 0
      ) {
        const ratio = Math.max(
          0,
          Math.min(1, top.bounceTimer / top.maxBounceTimer),
        );
        const jumpH = 4 * ratio * (1 - ratio);
        yOffset -= jumpH * 45; // max height 45px
        shadowScale *= Math.max(0.4, 1.0 - jumpH * 0.5);
      }

      // Beautiful soft ground shadow under the player top
      ctx.save();
      const ox = 8;
      const oy = 15;
      const shadowRadius = Math.max(top.radius * 1.5, 30) * shadowScale;
      const grad = ctx.createRadialGradient(
        ox,
        oy,
        shadowRadius * 0.1,
        ox,
        oy,
        shadowRadius,
      );
      grad.addColorStop(0, `rgba(0, 0, 0, ${0.85 * shadowScale})`);
      grad.addColorStop(0.5, `rgba(0, 0, 0, ${0.4 * shadowScale})`);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ox, oy, shadowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (yOffset !== 0) {
        ctx.translate(0, yOffset);
      }
    }

    // Dash / Spin Aura
    if (top.spin > 800) {
      ctx.fillStyle = `${top.color}44`; // translucent color
      ctx.beginPath();
      ctx.arc(0, 0, top.radius + 10 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw hemispherical shield / shockwave facing the dash direction during dash state, or when spin is 5 or more
    const isShieldSpinActive =
      ((top.spin ?? MAX_SPIN) / (top.maxSpin || MAX_SPIN)) * 10 >= 5.0;
    if ((top.state === "dash" || isShieldSpinActive) && top.hp > 0) {
      let dx = 0;
      let dy = 0;
      if (top.state === "dash") {
        dx = top.dashDirectionX ?? 0;
        dy = top.dashDirectionY ?? 0;
      } else {
        dx = top.vx ?? 0;
        dy = top.vy ?? 0;
      }
      const speed = Math.hypot(dx, dy);
      const dashAngle = speed > 5 ? Math.atan2(dy, dx) : (top.angle ?? 0);

      ctx.save();
      ctx.rotate(dashAngle);

      const progress =
        top.state === "dash"
          ? Math.max(
              0,
              Math.min(
                1,
                1.0 - (top.dashTimer ?? 0.5) / (top.maxDashDuration || 1.0),
              ),
            )
          : (Date.now() / 600) % 1.0;

      const wavePhase = (Date.now() / 80) % (Math.PI * 2);
      const pulse = Math.sin(wavePhase) * 4;
      const rBase = top.radius + 8 + pulse;

      // Layer 1: Volumetric volumetric gradient dome (combines forward linear energy & radial glow) - intensified opacity
      const grad = ctx.createRadialGradient(
        0,
        0,
        top.radius - 5,
        0,
        0,
        rBase + 5,
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.5, `${top.color}15`); // intensified soft inner fill
      grad.addColorStop(0.9, `${top.color}56`); // intensified medium intensity
      grad.addColorStop(1, `${top.color}8a`); // intensified outer shell

      const forwardHeatGrad = ctx.createLinearGradient(0, 0, rBase, 0);
      forwardHeatGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      forwardHeatGrad.addColorStop(0.4, `${top.color}0a`);
      forwardHeatGrad.addColorStop(0.85, `${top.color}74`); // intensified compression heat
      forwardHeatGrad.addColorStop(1, "rgba(255, 255, 255, 0.5)"); // intensified hot leading tip

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rBase, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = forwardHeatGrad;
      ctx.beginPath();
      ctx.arc(0, 0, rBase, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Layer 2: Magnetic energy field lines / Concentric inner rings (精緻的諧振線條) - reinforced thickness (increased by another 3x)
      ctx.strokeStyle = `${top.color}9c`;
      ctx.lineWidth = 6; // Tripled from 2
      ctx.beginPath();
      ctx.arc(0, 0, rBase - 5, -Math.PI / 2.1, Math.PI / 2.1);
      ctx.stroke();

      ctx.strokeStyle = `${top.color}55`;
      ctx.lineWidth = 4.5; // Tripled from 1.5
      ctx.beginPath();
      ctx.arc(0, 0, rBase - 11, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      // Layer 3: Dynamic Re-entry Edge-Fading Outline Stroke
      // Stroke gradient runs from y-endpoints (x=0) to the hot leading nose (x=rBase)
      const edgeStrokeGrad = ctx.createLinearGradient(0, 0, rBase, 0);
      edgeStrokeGrad.addColorStop(0, "rgba(0, 0, 0, 0)"); // Fades out beautifully towards the flat base
      edgeStrokeGrad.addColorStop(0.3, `${top.color}aa`); // More visible colored wingtips
      edgeStrokeGrad.addColorStop(0.75, top.color); // Fully saturated neon color
      edgeStrokeGrad.addColorStop(0.95, "#ffffff"); // White-hot core leading edge
      edgeStrokeGrad.addColorStop(1, "#ffffff");

      // Colored outer blur glow - reinforced thickness & glow (increased by another 3x)
      ctx.strokeStyle = edgeStrokeGrad;
      ctx.lineWidth = 27.0; // Tripled from 9.0
      // Removed shadowColor for perf
      // Removed shadowBlur for perf // Tripled and enhanced from 20
      ctx.beginPath();
      ctx.arc(0, 0, rBase, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      // Removed shadowBlur for perf // reset immediately

      // Robust white core - reinforced thickness (increased by another 3x)
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 7.5; // Tripled from 2.5
      ctx.beginPath();
      ctx.arc(0, 0, rBase, -Math.PI / 2.05, Math.PI / 2.05);
      ctx.stroke();

      // Layer 4: Expanding shockwave wave ripple - reinforced thickness (increased by another 3x)
      const waveR = rBase + 10 + progress * 28;
      const waveAlpha = Math.max(0, 0.75 * (1.0 - progress));
      if (waveAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = waveAlpha;

        const rippleStrokeGrad = ctx.createLinearGradient(0, 0, waveR, 0);
        rippleStrokeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        rippleStrokeGrad.addColorStop(0.5, `${top.color}66`); // intensified
        rippleStrokeGrad.addColorStop(1, top.color);

        ctx.strokeStyle = rippleStrokeGrad;
        ctx.lineWidth = 12.0; // Tripled from 4.0
        ctx.beginPath();
        ctx.arc(0, 0, waveR, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        // Inner helper echo ripple line - reinforced thickness
        ctx.lineWidth = 4.5; // Tripled from 1.5
        ctx.beginPath();
        ctx.arc(0, 0, waveR - 7, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // 判斷陀螺是否為待機/繞行狀態或是彈射充電與繞行狀態 (top.state === 'standby' || launchPad states)
    if (
      (top.state === "standby" ||
        top.launchPadState === "charging" ||
        top.launchPadState === "flying") &&
      top.hp > 0
    ) {
      ctx.save();
      const time = Date.now();

      const isVortexActive =
        (top.isSpinning && top.spin >= 500) || top.launchPadState !== undefined;
      if (isVortexActive) {
        // ==========================================
        // 【強力繞行氣旋特效】 (top.isSpinning === true && spin >= 5) 或特殊彈射衝鋒中
        // ==========================================
        // 1. 持續透明與縮放的動態漸變漸變算式 (Pulsing Factor) - 加強縮放與律動感
        const pulseScale = 0.98 + 0.12 * Math.sin(time / 80); // 縮放更加劇烈
        const pulseAlpha = 0.7 + 0.3 * Math.sin(time / 120); // 透明度維持高能見度

        ctx.globalAlpha *= Math.max(0, pulseAlpha);
        ctx.scale(pulseScale, pulseScale);

        // 2. 風旋旋轉的角度相位 (超高速旋轉)
        const windPhase = -(time / 25) % (Math.PI * 2);

        // 繪製 6 條對稱的強力氣旋螺線
        const numStrands = 6;
        for (let i = 0; i < numStrands; i++) {
          const offset = ((Math.PI * 2) / numStrands) * i;
          ctx.beginPath();

          // 氣旋螺旋算法：半徑與長度大幅提升，展現強力氣流擴散效果
          for (let a = 0; a < Math.PI * 1.8; a += 0.08) {
            const windRadius = top.radius + 4 + Math.pow(a, 1.55) * 14;
            const angle = windPhase + offset + a;

            const px = Math.cos(angle) * windRadius;
            const py = Math.sin(angle) * windRadius;

            if (a === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }

          // 3. 放射狀漸層色 (融入玩家陀螺主題色，外側半徑自然淡出) - 範圍擴大至 +100px
          const maxSpread = 80;
          const grad = ctx.createRadialGradient(
            0,
            0,
            top.radius,
            0,
            0,
            top.radius + maxSpread,
          );
          grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
          grad.addColorStop(0.3, `${top.color}dd`); // 絕美玩家代表色發光層
          grad.addColorStop(0.6, `${top.color}55`);
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.strokeStyle = grad;
          ctx.lineWidth = 4.5; // 線條更厚實
          ctx.lineCap = "round";

          // 增加發光陰影
          // Removed shadowColor for perf
          // Removed shadowBlur for perf
          ctx.stroke();
        }
        // Removed shadowBlur for perf // 重置陰影

        // 4. 加密外圍高能離心環與粒子閃爍圈 (Outer Heavy Vortex Ring)
        ctx.save();
        ctx.strokeStyle = `${top.color}44`;
        ctx.lineWidth = 3;
        ctx.setLineDash([15, 20]);
        ctx.lineDashOffset = -(time / 15) % 360;
        ctx.beginPath();
        ctx.arc(0, 0, top.radius + 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 5. 點綴內側銳利的超高速雙軌光圈 (Speed Dual-Ring)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          top.radius + 6 + Math.random() * 5,
          windPhase,
          windPhase + Math.PI * 1.3,
          false,
        );
        ctx.stroke();
      } else {
        // ==========================================
        // 【普通待機氣旋特效】 (top.isSpinning === false)
        // ==========================================
        // 1. 持續透明與縮放的動態漸變漸變算式 (Pulsing Factor)
        const pulseScale = 0.95 + 0.1 * Math.sin(time / 100);
        const pulseAlpha = 0.6 + 0.3 * Math.sin(time / 150);

        ctx.globalAlpha *= Math.max(0, pulseAlpha);
        ctx.scale(pulseScale, pulseScale);

        // 2. 風旋旋轉的角度相位 (隨著時間逆時針快速旋轉)
        const windPhase = -(time / 40) % (Math.PI * 2);

        // 繪製 4 條對稱的氣旋螺線
        const numStrands = 4;
        for (let i = 0; i < numStrands; i++) {
          const offset = ((Math.PI * 2) / numStrands) * i;
          ctx.beginPath();

          // 氣旋螺旋算法：隨著角度 a 遞增，半徑 windRadius 呈指數擴大
          for (let a = 0; a < Math.PI * 1.5; a += 0.1) {
            const windRadius = top.radius + 2 + Math.pow(a, 1.4) * 7; // 向外擴展
            const angle = windPhase + offset + a;

            const px = Math.cos(angle) * windRadius;
            const py = Math.sin(angle) * windRadius;

            if (a === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }

          // 3. 放射狀漸層色 (讓氣流向外側半徑自然淡出)
          const grad = ctx.createRadialGradient(
            0,
            0,
            top.radius,
            0,
            0,
            top.radius + 35,
          );
          grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          grad.addColorStop(0.4, "rgba(255, 255, 255, 0.4)");
          grad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx.strokeStyle = grad;
          ctx.lineWidth = 3.5;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        // 4. 點綴內側銳利的超高速光圈 (Speed Ring)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          top.radius + 4 + Math.random() * 4,
          windPhase,
          windPhase + Math.PI,
          false,
        );
        ctx.stroke();
      }

      ctx.restore();
    }

    // Draw Model 2 Ultimate Skill Orbs (6 orbiting thunder/fire/electric balls)
    if (top.model2SkillTimer !== undefined && top.model2SkillTimer > 0) {
      ctx.save();

      // Calculate fade-in and fade-out alpha factor
      let orbAlpha = 1.0;
      if (top.model2SkillTimer > 9.0) {
        orbAlpha = Math.max(
          0,
          Math.min(1.0, (9.6 - top.model2SkillTimer) / 0.6),
        );
      } else if (top.model2SkillTimer < 0.6) {
        orbAlpha = Math.max(0, Math.min(1.0, top.model2SkillTimer / 0.6));
      }

      const orbitRadius = 135;
      const orbRadius = 28;
      const angles: number[] = [];
      for (let i = 0; i < 6; i++) {
        angles.push((top.model2OrbAngle ?? 0) + (i * Math.PI) / 3);
      }

      // 1. Draw a faint glowing electrical circuit orbit path around the top
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.2 * orbAlpha})`;
      ctx.lineWidth = 1.8;
      // Removed shadowColor for perf
      // Removed shadowBlur for perf
      ctx.beginPath();
      ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
      // Removed shadowBlur for perf // reset shadow immediately

      // 2. Render each orb
      angles.forEach((ang) => {
        const ox = Math.cos(ang) * orbitRadius;
        const oy = Math.sin(ang) * orbitRadius;

        ctx.save();
        ctx.globalAlpha = orbAlpha;

        // A. Create shadow glow for high energy look
        // Removed shadowColor for perf
        // Removed shadowBlur for perf

        // B. Draw multi-layered radial gradient circle (white hot core -> electric cyan -> orange flame rim)
        const orbGrad = ctx.createRadialGradient(ox, oy, 1, ox, oy, orbRadius);
        orbGrad.addColorStop(0, "#ffffff"); // White hot center
        orbGrad.addColorStop(0.35, "#38bdf8"); // Electrical neon cyan
        orbGrad.addColorStop(0.75, "rgba(234, 179, 8, 0.9)"); // Fiery orange/gold plasma ring
        orbGrad.addColorStop(1, "rgba(234, 113, 8, 0)"); // Soft fading edge

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, orbRadius, 0, Math.PI * 2);
        ctx.fill();

        // Removed shadowBlur for perf // reset

        // C. Render 3 crackling electric discharges (lightning branches) shooting out
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * orbAlpha})`;
        ctx.lineWidth = 1.6;
        for (let j = 0; j < 3; j++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const len = orbRadius + Math.random() * 8;
          const sx = ox + Math.cos(sparkAngle) * len;
          const sy = oy + Math.sin(sparkAngle) * len;

          ctx.beginPath();
          ctx.moveTo(ox, oy);
          // Make electric line slightly jagged
          const mix = ox + (sx - ox) * 0.5 + (Math.random() - 0.5) * 4;
          const miy = oy + (sy - oy) * 0.5 + (Math.random() - 0.5) * 4;
          ctx.lineTo(mix, miy);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        ctx.restore();
      });

      ctx.restore();
    }

    // Render high-intensity glowing background ball (aura/corona) when at full spin (MAX_SPIN)
    const isFullEnergy = top.spin >= (top.maxSpin || MAX_SPIN);
    if (isFullEnergy && !top.isExploding) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const time = Date.now();
      const orbPulse = 1.0 + 0.08 * Math.sin(time * 0.015);
      const orbRadius = (top.radius || 48) * 1.55 * orbPulse;

      // Layer 1: Massive soft glow
      const outerGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, orbRadius);
      outerGrad.addColorStop(0, "#ffffff");
      outerGrad.addColorStop(0.2, "#ffffff");
      outerGrad.addColorStop(0.5, top.color || "#3b82f6");
      outerGrad.addColorStop(0.8, top.color || "#3b82f6");
      outerGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = outerGrad;
      ctx.globalAlpha = 0.75 + 0.15 * Math.sin(time * 0.012);
      ctx.beginPath();
      ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: White hot high energy core ball
      const innerRadius = (top.radius || 48) * 1.05 * orbPulse;
      const innerGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, innerRadius);
      innerGrad.addColorStop(0, "#ffffff");
      innerGrad.addColorStop(0.35, "#ffffff");
      innerGrad.addColorStop(0.8, "rgba(255, 255, 255, 0.45)");
      innerGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = innerGrad;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // [NEW] White circular whirlwind effect for normal top spinning
    if (top.hp > 0 && !top.isExploding) {
      ctx.save();
      // MAX_SPIN or top.maxSpin is usually around 1000
      const spinRatio = Math.max(
        0.1,
        Math.min(1.0, (top.spin || 0) / (top.maxSpin || 1000)),
      );

      // Spin ratio drives radius
      const whirlwindBaseRad = Math.max(
        40,
        top.radius * (1.1 + 0.9 * spinRatio),
      );

      const windRotTop = (Date.now() * 0.015) % (Math.PI * 2);
      ctx.rotate(windRotTop);

      const topAlphaRatio = 0.5 + 0.5 * spinRatio;

      // Outer ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * topAlphaRatio})`;
      ctx.lineWidth = 2; // THINNER
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, whirlwindBaseRad, 0, Math.PI * 0.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, whirlwindBaseRad, Math.PI, Math.PI * 1.6);
      ctx.stroke();

      // Inner reverse-spinning ring
      ctx.rotate(-windRotTop * 1.8);
      ctx.strokeStyle = `rgba(241, 245, 249, ${0.8 * topAlphaRatio})`; // Slate-100
      ctx.lineWidth = 1; // THINNER
      ctx.beginPath();
      ctx.arc(0, 0, whirlwindBaseRad * 0.75, 0, Math.PI * 0.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, whirlwindBaseRad * 0.75, Math.PI * 0.6, Math.PI * 1.0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, whirlwindBaseRad * 0.75, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

      ctx.restore();
    }

    // Draw drop shadow matching top's calculated radius
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    const shadowRadius = (top.radius || 48) + 4;
    ctx.arc(2, 4, shadowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(top.angle);
    const originalIdx = parseInt(top.id.split("_")[1], 10);
    const sprMap = ["top_0", "top_1", "top_2", "top_3"];
    const spr = sprites[sprMap[originalIdx] || "top_0"];

    const isFlashing =
      top.flashTimer !== undefined &&
      top.flashTimer > 0 &&
      top.launchPadState === undefined;

    if (
      (top.superTimer !== undefined && top.superTimer > 0) ||
      (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)
    ) {
      ctx.save();
      const innerR = top.radius / 1.25;
      const outerR = top.radius;

      ctx.beginPath();
      const spikeCount = 12;
      for (let i = 0; i < spikeCount * 2; i++) {
        const angle = (i * Math.PI) / spikeCount;
        const r = i % 2 === 0 ? outerR : innerR - 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = "#64748b";
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, innerR - 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.scale(drawingScaleFactor, drawingScaleFactor);
    ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);

    if (isFlashing) {
      // 加強閃爍白色的演出效果：利用 lighter 混合模式將自己疊加兩次，以達到極亮的全白/高光效果
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    }

    ctx.restore();

    // Draw a shifting rainbow colored tint overlay over the top when in Super/Star State or LaunchPad process!
    const isSuperOrLaunch =
      (top.superTimer !== undefined && top.superTimer > 0) ||
      (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) ||
      top.launchPadState !== undefined;
    if (isSuperOrLaunch) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.5; // beautiful 50% overlay transparency
      const tColor = Date.now() * 0.18; // Speed of rainbow phase shift
      const gradOver = ctx.createRadialGradient(0, 0, 0, 0, 0, top.radius);
      gradOver.addColorStop(0, `hsl(${tColor % 360}, 100%, 75%)`);
      gradOver.addColorStop(0.5, `hsl(${(tColor + 120) % 360}, 100%, 65%)`);
      gradOver.addColorStop(1, `hsl(${(tColor + 240) % 360}, 100%, 55%)`);
      ctx.fillStyle = gradOver;
      ctx.beginPath();
      ctx.arc(0, 0, top.radius + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Subtle glistening lens sheen on top of the top sprite so it looks radiant but not obscured
    if (isFullEnergy && !top.isExploding) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.24 + 0.06 * Math.sin(Date.now() * 0.015);
      const lensGrad = ctx.createRadialGradient(
        -top.radius * 0.2,
        -top.radius * 0.2,
        1,
        0,
        0,
        top.radius,
      );
      lensGrad.addColorStop(0, "#ffffff");
      lensGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.7)");
      lensGrad.addColorStop(0.85, top.color || "#3b82f6");
      lensGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = lensGrad;
      ctx.beginPath();
      ctx.arc(0, 0, top.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 當陀螺轉速在 5 以上時（即 spin >= 500），陀螺圖像的邊框線要有該 P 位色的呼吸燈閃爍效果（不論待機、加速、衝鋒）
    if (top.spin >= 500) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      // 呼吸燈閃爍效果
      const breatheFreq = 180; // 呼吸週期，毫秒
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / breatheFreq);

      // 設定 P 位色與白光的呼吸漸變
      // Removed shadowColor for perf
      // Removed shadowBlur for perf

      ctx.beginPath();
      // 圓形邊框，比 radius 稍微大一點點以更好地包裹陀螺圖像
      const borderR = (top.radius || 48) + 1.5;
      ctx.arc(0, 0, borderR, 0, Math.PI * 2);

      ctx.strokeStyle = top.color;
      ctx.lineWidth = 2.0 + 3.0 * pulse;
      ctx.globalAlpha = 0.45 + 0.55 * pulse;
      ctx.stroke();

      // 核心亮邊 (內圈超薄亮白邊)
      ctx.beginPath();
      ctx.arc(0, 0, borderR, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.3 * pulse;
      ctx.stroke();

      ctx.restore();
    }

    // 當陀螺轉速"全滿"時，陀螺要額外顯示一圈白色的外圈環狀氣流特效 (不論陀螺是在待機、加速或衝鋒)
    // 且採用螺旋狀氣流特效形式 (尺寸減少 50%，並具有持續縮放漸變與透明度漸變)
    const isFullSpin = top.spin >= (top.maxSpin || MAX_SPIN);
    if (isFullSpin) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const time = Date.now();
      // 呼吸週期：控制持續縮放與透明度的規律起伏 (調整為 25% 較快的漸變頻率)
      const pulsePhase = time * 0.00625;
      const scalePulse = 0.9 + 0.12 * Math.sin(pulsePhase); // 縮放比例在 0.90 ~ 1.02 之間
      const alphaPulse = 0.5 + 0.5 * Math.sin(pulsePhase + Math.PI / 6); // 透明度在 0.50 ~ 1.00 之間

      ctx.globalAlpha = alphaPulse;

      // 風旋旋轉的角度相位 (隨著時間快速旋轉)
      const windPhase = -(time / 30) % (Math.PI * 2);

      // 繪製 4 條對稱的純白螺旋氣旋
      const numStrands = 4;
      for (let i = 0; i < numStrands; i++) {
        const offset = ((Math.PI * 2) / numStrands) * i;
        ctx.beginPath();

        // 氣旋螺旋算法：隨著角度 a 遞增，半徑 windRadius 呈指數擴大，與加速狀態的螺旋相符 (並套用縮放百分比)
        for (let a = 0; a < Math.PI * 1.8; a += 0.08) {
          const baseRadius = (top.radius || 48) + 2 + Math.pow(a, 1.55) * 7.0; // 基礎螺旋半徑
          const windRadius = baseRadius * scalePulse; // 套用動態縮放
          const angle = windPhase + offset + a;

          const px = Math.cos(angle) * windRadius;
          const py = Math.sin(angle) * windRadius;

          if (a === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }

        // 放射狀漸層色 (純白色與半透明白發光，外側半徑自然淡出)
        const maxSpread = 42 * scalePulse;
        const grad = ctx.createRadialGradient(
          0,
          0,
          (top.radius || 48) * scalePulse,
          0,
          0,
          (top.radius || 48) * scalePulse + maxSpread,
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        grad.addColorStop(0.3, "rgba(255, 255, 255, 0.85)");
        grad.addColorStop(0.6, "rgba(255, 255, 255, 0.35)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.5; // 細緻微縮的氣流線
        ctx.lineCap = "round";

        // 增加純白發光陰影
        // Removed shadowColor for perf
        // Removed shadowBlur for perf
        ctx.stroke();
      }
      // Removed shadowBlur for perf // 重置陰影

      // 額外點綴內側高速白色雙軌光圈 (尺寸隨 scalePulse 連動縮放)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const innerCircleR =
        ((top.radius || 48) + 4) * scalePulse + Math.random() * 2;
      ctx.arc(0, 0, innerCircleR, windPhase, windPhase + Math.PI * 1.5, false);
      ctx.stroke();

      ctx.restore();
    }

    // 當轉速 5 以上時，且陀螺處於加速狀態，陀螺本體要纏繞電流特效
    const isHighSpinForElectricity =
      (top.spin / (top.maxSpin || MAX_SPIN)) * 10 >= 5.0;
    if (top.state === "standby" && top.isSpinning && isHighSpinForElectricity) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const numArcs = 3 + Math.floor(Math.random() * 3); // 3-5 electric lines
      for (let a = 0; a < numArcs; a++) {
        const r = top.radius * (0.6 + Math.random() * 0.5); // wrap across the body
        const startAngle = Math.random() * Math.PI * 2;
        const endAngle = startAngle + (0.5 + Math.random() * 1.0) * Math.PI;

        const startX = Math.cos(startAngle) * r;
        const startY = Math.sin(startAngle) * r;
        const endX = Math.cos(endAngle) * r;
        const endY = Math.sin(endAngle) * r;

        const midAngle = (startAngle + endAngle) / 2;
        const midR = r + (Math.random() - 0.5) * 15; // jagged offset
        const midX = Math.cos(midAngle) * midR;
        const midY = Math.sin(midAngle) * midR;

        // Layer 1: Glow color of the player's top
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = top.color;
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        // Layer 2: White core of high energy
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
      }

      // Random electric sparks
      if (Math.random() < 0.4) {
        const sparkAngle = Math.random() * Math.PI * 2;
        const sx = Math.cos(sparkAngle) * top.radius * 0.2;
        const sy = Math.sin(sparkAngle) * top.radius * 0.2;
        const ex = Math.cos(sparkAngle) * top.radius * 1.35;
        const ey = Math.sin(sparkAngle) * top.radius * 1.35;

        const mx =
          Math.cos(sparkAngle) * (top.radius * 0.8) +
          (Math.random() - 0.5) * 12;
        const my =
          Math.sin(sparkAngle) * (top.radius * 0.8) +
          (Math.random() - 0.5) * 12;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(mx, my);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = "#38bdf8"; // electrical neon blue
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();
    }

    // Draw rainbow outline for Super State!
    if (
      (top.superTimer !== undefined && top.superTimer > 0) ||
      (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) ||
      top.launchPadState !== undefined
    ) {
      ctx.save();
      ctx.lineWidth = 6;
      const time = Date.now() * 0.015; // Fast rainbow gradient cycle
      const grad = ctx.createLinearGradient(
        -top.radius,
        -top.radius,
        top.radius,
        top.radius,
      );
      grad.addColorStop(0, `hsl(${time % 360}, 100%, 55%)`);
      grad.addColorStop(0.2, `hsl(${(time + 60) % 360}, 100%, 55%)`);
      grad.addColorStop(0.4, `hsl(${(time + 120) % 360}, 100%, 55%)`);
      grad.addColorStop(0.6, `hsl(${(time + 180) % 360}, 100%, 55%)`);
      grad.addColorStop(0.8, `hsl(${(time + 240) % 360}, 100%, 55%)`);
      grad.addColorStop(1, `hsl(${(time + 300) % 360}, 100%, 55%)`);

      ctx.strokeStyle = grad;
      // Removed shadowColor for perf
      // Removed shadowBlur for perf
      ctx.beginPath();
      ctx.arc(0, 0, top.radius + 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw breakout spiral orbit aura when breakoutOrbitTimer is active
    if (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const ratio = top.breakoutOrbitTimer / 1.0; // 1.0 -> 0 value
      const alpha = Math.sin(ratio * Math.PI); // peak opacity at mid-lifecycle

      // Pulsating breakout shockwave circle
      ctx.beginPath();
      ctx.arc(0, 0, top.radius * 2.5 * (1.0 - ratio), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(236, 72, 153, " + alpha * 0.85 + ")";
      ctx.lineWidth = 4 + 8 * ratio;
      ctx.stroke();

      // Draw a majestic swirling galaxy/swort spiral trail
      ctx.beginPath();
      const totalPoints = 120;
      const maxRad = top.radius * 3.5;
      for (let i = 0; i < totalPoints; i++) {
        const pRatio = i / totalPoints;
        const theta = pRatio * Math.PI * 4 + Date.now() * 0.02; // 2 full revolutions spinning fast
        const r = top.radius + (maxRad - top.radius) * pRatio * (1.0 - ratio);
        const sx = Math.cos(theta) * r;
        const sy = Math.sin(theta) * r;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.strokeStyle = "rgba(244, 114, 182, " + alpha * 0.7 + ")";
      ctx.lineWidth = 3.0;
      ctx.stroke();

      // Add secondary reverse-spinning inner coil to represent double-helix breakout power
      ctx.beginPath();
      for (let i = 0; i < totalPoints; i++) {
        const pRatio = i / totalPoints;
        const theta = -pRatio * Math.PI * 4 - Date.now() * 0.025;
        const r =
          top.radius + (maxRad * 0.7 - top.radius) * pRatio * (1.0 - ratio);
        const sx = Math.cos(theta) * r;
        const sy = Math.sin(theta) * r;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.strokeStyle = "rgba(255, 255, 255, " + alpha * 0.9 + ")";
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.restore();
    }

    // Draw HP text centered on the top
    if (top.hp > 0 && !top.isExploding && top.launchPadState === undefined) {
      ctx.save();

      // Undo the top's spin rotation so the text stays upright relative to the screen
      ctx.rotate(-top.angle);

      // P3 (idx 2) and P4 (idx 3) are at the top of the screen, facing down, so rotate 180 degrees.
      const isTopSide = originalIdx === 2 || originalIdx === 3;
      if (isTopSide) {
        ctx.rotate(Math.PI);
      }

      ctx.font = 'bold 24px "Space Grotesk", "JetBrains Mono", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#0f172a"; // slate-900 for high contrast
      // Change text color to red if hp is low, otherwise white
      ctx.fillStyle =
        top.hp <= (top.maxHp || 100) * 0.3 ? "#ef4444" : "#ffffff";
      const hpStr = Math.max(0, Math.ceil(top.hp)).toString();
      ctx.strokeText(hpStr, 0, 0);
      ctx.fillText(hpStr, 0, 0);
      ctx.restore();
    } else if (top.hp <= 0 && !top.isAI) {
      ctx.save();

      // Undo the top's spin rotation so the text stays upright relative to the screen
      ctx.rotate(-top.angle);

      // P3 (idx 2) and P4 (idx 3) are at the top of the screen, facing down, so rotate 180 degrees.
      const isTopSide = originalIdx === 2 || originalIdx === 3;
      if (isTopSide) {
        ctx.rotate(Math.PI);
      }

      ctx.font =
        'bold 20px "Space Grotesk", "Microsoft JhengHei", "JetBrains Mono", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = "#000000"; // high contrast black outline

      // Arcade flashing red and white text
      const pulse = Math.floor(Date.now() / 250) % 2 === 0;
      ctx.fillStyle = pulse ? "#ef4444" : "#ffffff";

      ctx.strokeText("請投幣", 0, 0);
      ctx.fillText("請投幣", 0, 0);
      ctx.restore();
    }

    ctx.restore();

    // Render fast spin prompt icons when required (e.g. boss struggle or zombie siege clinging)
    const isBossStruggle = top.struggleMashCount !== undefined;
    const needsFastSpin =
      !top.isAI &&
      (isBossStruggle ||
        (engine.zombieSiegeActive &&
          engine.siegeStatus === "clinging" &&
          engine.siegeTargetPlayerId === top.id) ||
        (top.spinTutorialTimer !== undefined && top.spinTutorialTimer > 0) ||
        (top.coopState !== undefined &&
          (top.coopState.phase === "standoff" ||
            top.coopState.phase === "retreat_rotate")) ||
        top.launchPadState === "prep_spinning");

    if (needsFastSpin && !top.isExploding) {
      ctx.save();
      if (isBossStruggle) {
        ctx.translate(top.x, top.y);
      } else {
        ctx.translate(topDrawX, topDrawY);
      }

      const time = Date.now();
      const distance = top.radius + 40;

      const handSvg = new Path2D(
        "M 10 3 C 10 2.45 10.45 2 11 2 C 11.55 2 12 2.45 12 3 L 12 11 L 12.25 11 C 12.39 11 12.5 10.89 12.5 10.75 L 12.5 5 C 12.5 4.45 12.95 4 13.5 4 C 14.05 4 14.5 4.45 14.5 5 L 14.5 11 L 14.75 11 C 14.89 11 15 10.89 15 10.75 L 15 6 C 15 5.45 15.45 5 16 5 C 16.55 5 17 5.45 17 6 L 17 11 L 17.25 11 C 17.39 11 17.5 10.89 17.5 10.75 L 17.5 8 C 17.5 7.45 17.95 7 18.5 7 C 19.05 7 19.5 7.45 19.5 8 L 19.5 16.5 C 19.5 19.54 17.04 22 14 22 C 10.96 22 8.5 19.54 8.5 16.5 L 8.5 12 L 7 10.5 C 6.61 10.11 6.61 9.48 7 9.09 C 7.39 8.7 8.02 8.7 8.41 9.09 L 10 10.68 L 10 3 Z",
      );

      const drawHand = (offsetX: number, offsetY: number, rotation: number) => {
        ctx.save();
        ctx.translate(offsetX, offsetY);
        const pulse = 1.0 + 0.15 * Math.sin(time / 100);
        // Doubled the scale for larger hand icons as requested
        ctx.scale(3.6 * pulse, 3.6 * pulse);
        ctx.rotate(rotation);
        ctx.translate(-12, -12); // Center the 24x24 path

        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        ctx.fillStyle = "#ffffff";
        ctx.fill(handSvg);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "#000000";
        ctx.stroke(handSvg);
        ctx.restore();
      };

      if (isBossStruggle) {
        const tapOffset = Math.sin(time / 60) * 15;
        drawHand(0, tapOffset, 0);
      } else {
        // Oscillate angle like a steering wheel (swinging ~45 degrees back and forth)
        const oscAngle = Math.sin(time / 120) * (Math.PI / 4);

        ctx.rotate(oscAngle);

        // Draw circular indicator arrows (CW)
        ctx.save();
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#fbbf24"; // amber-400
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 10;

        for (let i = 0; i < 2; i++) {
          ctx.save();
          ctx.rotate(i * Math.PI);

          // Arc from -Math.PI / 4 to Math.PI / 4
          ctx.beginPath();
          ctx.arc(0, 0, distance - 15, -Math.PI / 4, Math.PI / 4);
          ctx.stroke();

          // Arrow head at Math.PI / 4
          const endAngle = Math.PI / 4;
          const hx = Math.cos(endAngle) * (distance - 15);
          const hy = Math.sin(endAngle) * (distance - 15);

          ctx.translate(hx, hy);
          ctx.rotate(endAngle);
          ctx.beginPath();
          ctx.moveTo(-10, -5);
          ctx.lineTo(0, 10);
          ctx.lineTo(10, -5);
          ctx.fillStyle = "#fbbf24";
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        }
        ctx.restore();

        // Hand 1 on right, pointing UP
        drawHand(distance, 0, 0);
        // Hand 2 on left, pointing UP
        drawHand(-distance, 0, 0);
      }

      ctx.restore();
    }

    // Label
    if (!top.isExploding) {
      ctx.save();
      if (top.flashTimer !== undefined && top.flashTimer > 0) {
        const blinkOn = Math.floor(Date.now() / 45) % 2 === 0;
        ctx.globalAlpha *= blinkOn ? 0.25 : 1.0;
      }
      ctx.font = 'bold 24px "Courier New"';
      ctx.textAlign = "center";
      ctx.fillStyle = top.color;

      let labelX = top.x;
      let labelY = top.y - top.radius - 30;

      if (top.label === "P3" || top.label === "P4") {
        labelY = top.y + top.radius + 30;
      }

      if (
        engine.zombieSiegeActive &&
        engine.siegeStatus === "clinging" &&
        top.id === engine.siegeTargetPlayerId
      ) {
        labelX += (Math.random() - 0.5) * 16;
        labelY += (Math.random() - 0.5) * 16;
      }

      ctx.translate(labelX, labelY);
      if (top.label === "P3" || top.label === "P4") {
        ctx.rotate(Math.PI);
      }

      ctx.fillText(top.label + (top.isAI ? " [電腦]" : ""), 0, 0);

      ctx.restore();
    }
  });

  // Draw Phantom Clones (分身幻影) with fade-in and fade-out transition
  engine.phantomClones.forEach((pc) => {
    let cloneAlpha = 1.0;
    if (pc.life > pc.maxLife - 0.6) {
      cloneAlpha = Math.max(0, Math.min(1.0, (pc.maxLife - pc.life) / 0.6));
    } else if (pc.life < 0.6) {
      cloneAlpha = Math.max(0, Math.min(1.0, pc.life / 0.6));
    }

    ctx.save();
    ctx.globalAlpha = cloneAlpha;
    ctx.translate(pc.x, pc.y);

    // Ground shadow under the phantom clone
    ctx.save();
    const ox = 8;
    const oy = 15;
    const shadowRadius = Math.max(pc.radius * 1.5, 30);
    const grad = ctx.createRadialGradient(
      ox,
      oy,
      shadowRadius * 0.1,
      ox,
      oy,
      shadowRadius,
    );
    grad.addColorStop(0, "rgba(0, 0, 0, 0.65)");
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ox, oy, shadowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const time = Date.now();

    // 1. Vortex (Powerful cyclone standby visual effect)
    const pulseScale = 0.98 + 0.12 * Math.sin(time / 80);
    const pulseAlpha = 0.7 + 0.3 * Math.sin(time / 120);

    ctx.save();
    ctx.globalAlpha *= Math.max(0, pulseAlpha);
    ctx.scale(pulseScale, pulseScale);

    const windPhase = -(time / 25) % (Math.PI * 2);
    const numStrands = 4;
    for (let i = 0; i < numStrands; i++) {
      const offset = ((Math.PI * 2) / numStrands) * i;
      ctx.beginPath();

      for (let a = 0; a < Math.PI * 1.5; a += 0.1) {
        const windRadius = pc.radius + 2 + Math.pow(a, 1.4) * 7;
        const angle = windPhase + offset + a;

        const px = Math.cos(angle) * windRadius;
        const py = Math.sin(angle) * windRadius;

        if (a === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }

      const maxSpread = 80;
      const gradv = ctx.createRadialGradient(
        0,
        0,
        pc.radius,
        0,
        0,
        pc.radius + maxSpread,
      );
      gradv.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      gradv.addColorStop(0.3, "rgba(56, 189, 248, 0.8)");
      gradv.addColorStop(0.6, "rgba(56, 189, 248, 0.3)");
      gradv.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.strokeStyle = gradv;
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";

      ctx.stroke();
    }
    ctx.restore();

    // 2. Dash / Spin Aura
    ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, pc.radius + 10 + Math.random() * 10, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw Body
    ctx.save();

    // Faint colored backdrop under the sprite
    ctx.fillStyle = "rgba(56, 189, 248, 0.15)";
    ctx.beginPath();
    ctx.arc(0, 0, pc.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Switch to screen/lighter blending for that premium emitting light feel
    ctx.globalCompositeOperation = "screen";

    const sprMap = ["top_0", "top_1", "top_2", "top_3"];
    const spr = sprites[sprMap[pc.originalIdx] || "top_0"];

    if (spr) {
      // Prepare the offscreen digital cyber overlay canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = spr.width;
      tempCanvas.height = spr.height;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.drawImage(spr, 0, 0);
        tempCtx.globalCompositeOperation = "source-in";
        // Cyber cyan/pale-blue fill
        tempCtx.fillStyle = "rgba(56, 189, 248, 0.85)";
        tempCtx.fillRect(0, 0, spr.width, spr.height);

        // Horizontal digital lines (CRT style screen scanlines)
        tempCtx.globalCompositeOperation = "source-atop";
        tempCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        tempCtx.lineWidth = 1.5;
        for (let y = 0; y < spr.height; y += 4) {
          tempCtx.beginPath();
          tempCtx.moveTo(0, y);
          tempCtx.lineTo(spr.width, y);
          tempCtx.stroke();
        }

        // Vertical matrix grid lines
        tempCtx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        tempCtx.lineWidth = 1.0;
        for (let x = 0; x < spr.width; x += 8) {
          tempCtx.beginPath();
          tempCtx.moveTo(x, 0);
          tempCtx.lineTo(x, spr.height);
          tempCtx.stroke();
        }

        // A dynamic shining scanner sweep
        const scanY = ((Date.now() / 15) % (spr.height + 40)) - 20;
        const scanGrad = tempCtx.createLinearGradient(
          0,
          scanY - 10,
          0,
          scanY + 10,
        );
        scanGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
        scanGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
        scanGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        tempCtx.fillStyle = scanGrad;
        tempCtx.fillRect(0, scanY - 10, spr.width, 20);
      }

      // outer halo layer - slightly rotated and scaled up
      ctx.save();
      const drawingScaleFactor =
        GameUtils.getTopScale(engine, { id: pc.ownerId } as any) || 1.0;
      ctx.scale(drawingScaleFactor, drawingScaleFactor);
      ctx.rotate(pc.angle - 0.12);
      ctx.globalAlpha = cloneAlpha * 0.3;
      ctx.drawImage(
        tempCanvas,
        -(spr.width * 1.1) / 2,
        -(spr.height * 1.1) / 2,
        spr.width * 1.1,
        spr.height * 1.1,
      );
      ctx.restore();

      // primary translucent layer - translucent as requested (0.65 opacity for cyber glow)
      ctx.save();
      ctx.scale(drawingScaleFactor, drawingScaleFactor);
      ctx.rotate(pc.angle);
      ctx.globalAlpha = cloneAlpha * 0.65;
      ctx.drawImage(tempCanvas, -spr.width / 2, -spr.height / 2);
      ctx.restore();

      // energetic inner core - slightly smaller and rotated
      ctx.save();
      ctx.scale(drawingScaleFactor, drawingScaleFactor);
      ctx.rotate(pc.angle + 0.18);
      ctx.globalAlpha = cloneAlpha * 0.35;
      ctx.drawImage(
        tempCanvas,
        -(spr.width * 0.9) / 2,
        -(spr.height * 0.9) / 2,
        spr.width * 0.9,
        spr.height * 0.9,
      );
      ctx.restore();
    }

    ctx.restore(); // restores blend mode and shadow blur

    // 4. Subtle cyber-blue ring indicating digital cyber clone magic
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, pc.radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Phantom Label
    ctx.save();
    ctx.globalAlpha = cloneAlpha;
    ctx.font = 'bold 20px "Courier New"';
    ctx.textAlign = "center";
    ctx.fillStyle = pc.color;
    ctx.fillText("分身幻影", pc.x, pc.y - pc.radius - 30);
    ctx.restore();
  });

  // Draw BulletTops Trail
  engine.bulletTops.forEach((bt) => {
    const owner = engine.tops.find(t => t.id === bt.ownerPlayerId);
    if (owner && bt.orbitAngle !== undefined && bt.orbitRadius !== undefined) {
      ctx.save();
      
      // Use screen composition for premium additive neon glowing effects
      ctx.globalCompositeOperation = "screen";

      const currentAngle = bt.orbitAngle;
      const orbitRadius = bt.orbitRadius;
      const trailLength = 20;
      const arcLength = 2.5; // radians (about 143 degrees of trail)

      // 1. Draw glowing outer rainbow aura trail
      const rainbowColors = [
        "rgba(255, 0, 0, ",
        "rgba(255, 127, 0, ",
        "rgba(255, 255, 0, ",
        "rgba(0, 255, 0, ",
        "rgba(0, 0, 255, ",
        "rgba(139, 0, 255, "
      ];
      for (let i = 0; i < trailLength - 1; i++) {
        const ratio = i / (trailLength - 1); // 0.0 (oldest) to 1.0 (newest)
        const ratioNext = (i + 1) / (trailLength - 1);
        
        const angle1 = currentAngle - arcLength * (1 - ratio);
        const p1x = owner.x + Math.cos(angle1) * orbitRadius;
        const p1y = owner.y + Math.sin(angle1) * orbitRadius;
        
        const angle2 = currentAngle - arcLength * (1 - ratioNext);
        const p2x = owner.x + Math.cos(angle2) * orbitRadius;
        const p2y = owner.y + Math.sin(angle2) * orbitRadius;
        
        const opacity = ratio * 0.65; // fades out towards oldest points
        const thickness = ratio * bt.radius * 0.75; // tapers down towards tail
        
        ctx.strokeStyle = rainbowColors[i % rainbowColors.length] + opacity + ")";
        ctx.lineWidth = Math.max(4, thickness);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
      }

      // 2. Draw a bright white-hot center line for the axis trail
      for (let i = 0; i < trailLength - 1; i++) {
        const ratio = i / (trailLength - 1);
        const ratioNext = (i + 1) / (trailLength - 1);
        
        const angle1 = currentAngle - arcLength * (1 - ratio);
        const p1x = owner.x + Math.cos(angle1) * orbitRadius;
        const p1y = owner.y + Math.sin(angle1) * orbitRadius;
        
        const angle2 = currentAngle - arcLength * (1 - ratioNext);
        const p2x = owner.x + Math.cos(angle2) * orbitRadius;
        const p2y = owner.y + Math.sin(angle2) * orbitRadius;
        
        const opacity = ratio * 0.9;
        const thickness = ratio * bt.radius * 0.22; // much thinner white-hot core
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = Math.max(2, thickness);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
      }

      ctx.restore();
    } else if (bt.trail && bt.trail.length > 1) {
      ctx.save();
      
      // Use screen composition for premium additive neon glowing effects
      ctx.globalCompositeOperation = "screen";

      // 1. Draw glowing outer rainbow aura trail
      const rainbowColors = [
        "rgba(255, 0, 0, ",
        "rgba(255, 127, 0, ",
        "rgba(255, 255, 0, ",
        "rgba(0, 255, 0, ",
        "rgba(0, 0, 255, ",
        "rgba(139, 0, 255, "
      ];
      for (let i = 0; i < bt.trail.length - 1; i++) {
        const p1 = bt.trail[i];
        const p2 = bt.trail[i + 1];
        
        const ratio = i / (bt.trail.length - 1); // 0.0 (oldest) to 1.0 (newest)
        const opacity = ratio * 0.65; // fades out towards oldest points
        const thickness = ratio * bt.radius * 0.75; // tapers down towards tail
        
        ctx.strokeStyle = rainbowColors[i % rainbowColors.length] + opacity + ")";
        ctx.lineWidth = Math.max(4, thickness);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // 2. Draw a bright white-hot center line for the axis trail
      for (let i = 0; i < bt.trail.length - 1; i++) {
        const p1 = bt.trail[i];
        const p2 = bt.trail[i + 1];
        
        const ratio = i / (bt.trail.length - 1);
        const opacity = ratio * 0.9;
        const thickness = ratio * bt.radius * 0.22; // much thinner white-hot core
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = Math.max(2, thickness);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.restore();
    }
  });

  // Draw BulletTops
  engine.bulletTops.forEach((bt) => {
    ctx.save();
    ctx.translate(bt.x, bt.y);
    ctx.rotate(bt.angle);

    // Draw a small cross-shaped top with rainbow colors
    const r = bt.radius;
    
    // Outer shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    
    // Cross shape (4 prongs)
    ctx.beginPath();
    for(let i=0; i<4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(-r * 0.2, 0);
        ctx.lineTo(-r * 0.2, -r);
        ctx.lineTo(r * 0.2, -r);
        ctx.lineTo(r * 0.2, 0);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    
    // Rainbow gradients for the prongs
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, "rgba(255, 0, 0, 0.8)");
    grad.addColorStop(0.2, "rgba(255, 127, 0, 0.8)");
    grad.addColorStop(0.4, "rgba(255, 255, 0, 0.8)");
    grad.addColorStop(0.6, "rgba(0, 255, 0, 0.8)");
    grad.addColorStop(0.8, "rgba(0, 0, 255, 0.8)");
    grad.addColorStop(1, "rgba(139, 0, 255, 0.8)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Center pivot
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  });
}
