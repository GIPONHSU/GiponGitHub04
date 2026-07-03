    ctx.save();
    const spr = o.type === "obstacle_chest" ? sprites["chest"] : sprites["barrel"];
    
    if (o.flashTimer !== undefined && o.flashTimer > 0) {
      ctx.filter = "brightness(0) invert(1)";
    }
    
    ctx.drawImage(spr, o.x - spr.width / 2, o.y - spr.height / 2);
    
    if (o.flashTimer !== undefined && o.flashTimer > 0) {
      ctx.filter = "none";
    }
