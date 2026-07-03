import fs from 'fs';

const files = {
    'src/game/renderers/EntityRenderer.ts': [
        {
            old: 'if (top.superTimer !== undefined && top.superTimer > 0) {',
            new: 'if ((top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)) {'
        },
        {
            old: 'const isSuperOrLaunch = (top.superTimer !== undefined && top.superTimer > 0) || top.launchPadState !== undefined;',
            new: 'const isSuperOrLaunch = (top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || top.launchPadState !== undefined;'
        },
        {
            old: 'if ((top.superTimer !== undefined && top.superTimer > 0) || top.launchPadState !== undefined) {',
            new: 'if ((top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || top.launchPadState !== undefined) {'
        }
    ],
    'src/game/renderers/UIRenderer.ts': [
        {
            old: 'if (top.superTimer !== undefined && top.superTimer > 0 && isCastingSkill) {',
            new: 'if (((top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)) && isCastingSkill) {'
        },
        {
            old: 'const isBarFullSpin = top.spin >= (top.maxSpin || 1000) || (top.superTimer !== undefined && top.superTimer > 0 && isCastingSkill);',
            new: 'const isBarFullSpin = top.spin >= (top.maxSpin || 1000) || (((top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)) && isCastingSkill);'
        },
        {
            old: 'if (top.superTimer !== undefined && top.superTimer > 0) {',
            new: 'if ((top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0)) {'
        }
    ]
};

for (const [file, replacements] of Object.entries(files)) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        for (const { old, new: repl } of replacements) {
            content = content.replace(old, repl);
        }
        fs.writeFileSync(file, content);
        console.log('Fixed ' + file);
    }
}
