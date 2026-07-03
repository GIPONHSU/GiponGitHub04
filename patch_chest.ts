      } else if (a.type === "obstacle_chest" || b.type === "obstacle_chest") {
        const chest = (a.type === "obstacle_chest" ? a : b) as Obstacle;
        const other = a.type === "obstacle_chest" ? b : a;

        // If a zombie/monster touches the chest, it does not trigger any explosion
        if (other.type.startsWith("zombie")) {
          return;
        }

        if (other.type === "top") {
          const topOther = other as Top;
          
          if (!chest.hitCounts) {
            chest.hitCounts = new Map<string, number>();
          }
          
          let hits = chest.hitCounts.get(topOther.id) || 0;
          hits++;
          chest.hitCounts.set(topOther.id, hits);

          chest.flashTimer = 0.15;
          SoundSystem.play("Attack_Punch_024");
          
          // 1/5 chance or guaranteed on 10th hit
          if (Math.random() < 0.2 || hits >= 10) {
            chest.markForDeletion = true;
            SoundSystem.play("SE-Explo1");
            EffectSystem.addParticles(
              engine,
              chest.x,
              chest.y,
              "#facc15",
              40,
              300,
              12,
            );
            
            // Grant "special armed ability" to the top
            // Placeholder: give a super state buff
            topOther.superTimer = (topOther.superTimer || 0) + 5; 
            EffectSystem.addParticles(
              engine,
              topOther.x,
              topOther.y,
              "#3b82f6",
              30,
              400,
              8,
            );
            
            engine.floatingTexts.push({
              id: "ft_" + Math.random(),
              x: topOther.x,
              y: topOther.y - 40,
              text: "ARMED UP!",
              color: "#3b82f6",
              life: 1.5,
              maxLife: 1.5,
              vy: -30,
            });
          } else {
             EffectSystem.addParticles(
               engine,
               chest.x,
               chest.y,
               "#facc15",
               8,
               res.impactForce * 0.25,
               6,
             );
          }
        }
