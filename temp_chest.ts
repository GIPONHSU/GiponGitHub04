  if (a.type === "obstacle_chest" || b.type === "obstacle_chest") {
    const top = a.type === "top" ? (a as Top) : b.type === "top" ? (b as Top) : null;
    const chest = a.type === "obstacle_chest" ? (a as Obstacle) : (b as Obstacle);

    if (top && !chest.markForDeletion) {
      if (!chest.hitCounts) {
        chest.hitCounts = new Map<string, number>();
      }
      
      // We need to only process this hit if it's a real collision impact (e.g. bounce happens).
      // We can rely on the bounce logic to happen after this, but wait: if we return, it might not bounce.
      // We should probably let it bounce. Let's just track the hit and maybe break it.
    }
  }
