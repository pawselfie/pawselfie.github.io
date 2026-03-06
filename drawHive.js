function drawHive(x, y, radius, slots, level, mutation, beequip) {
    hexes = [];
    const mutations = {
        NONE: color(255, 254, 254),
        AT: color(234, 59, 54),
        CAM: color(249, 198, 64),
        GA: color(202, 250, 124),
        EN: color(172, 138, 88),
        BAR: color(185, 165, 240),
        CC: color(70, 209, 112),
        BMS: color(79, 184, 242),
        IC: color(245, 254, 29)
    }
    const rarities = {
        COMMON: color(188, 128, 52),
        RARE: color(208, 209, 216),
        EPIC: color(224, 191, 9),
        LEGENDARY: color(79, 255, 240),
        MYTHIC: color(183, 158, 247),
        EVENT: color(147, 220, 98),
        U: color(117, 101, 33),
        SELECTED: color(27, 209, 94)
    };

    const colours = {
        COLORLESS: color(29, 48, 60),
        RED: color(244, 73, 56),
        BLUE: color(58, 143, 210)
    };

    const bees = {
        BA: ['COMMON', 'COLORLESS'],
        BO: ['RARE', 'COLORLESS'],
        BR: ['RARE', 'COLORLESS'],
        BU: ['RARE', 'BLUE'],
        CO: ['RARE', 'BLUE'],
        HA: ['RARE', 'COLORLESS'],
        LO: ['RARE', 'COLORLESS'],
        RA: ['RARE', 'RED'],
        RAS: ['RARE', 'RED'],
        ST: ['RARE', 'COLORLESS'],
        BUB: ['EPIC', 'BLUE'],
        BUC: ['EPIC', 'BLUE'],
        COM: ['EPIC', 'COLORLESS'],
        DE: ['EPIC', 'COLORLESS'],
        EX: ['EPIC', 'COLORLESS'],
        FI: ['EPIC', 'RED'],
        FR: ['EPIC', 'BLUE'],
        HO: ['EPIC', 'COLORLESS'],
        RAG: ['EPIC', 'RED'],
        RI: ['EPIC', 'RED'],
        SH: ['EPIC', 'COLORLESS'],
        BAB: ['LEGENDARY', 'COLORLESS'],
        CA: ['LEGENDARY', 'COLORLESS'],
        DEM: ['LEGENDARY', 'RED'],
        DI: ['LEGENDARY', 'BLUE'],
        LI: ['LEGENDARY', 'COLORLESS'],
        MU: ['LEGENDARY', 'COLORLESS'],
        NI: ['LEGENDARY', 'BLUE'],
        SHY: ['LEGENDARY', 'RED'],
        BUO: ['MYTHIC', 'BLUE'],
        FU: ['MYTHIC', 'COLORLESS'],
        PR: ['MYTHIC', 'RED'],
        SP: ['MYTHIC', 'RED'],
        TA: ['MYTHIC', 'BLUE'],
        VE: ['MYTHIC', 'COLORLESS'],
        BE: ['EVENT', 'COLORLESS'],
        COB: ['EVENT', 'BLUE'],
        CR: ['EVENT', 'RED'],
        FE: ['EVENT', 'RED'],
        GU: ['EVENT', 'COLORLESS'],
        PH: ['EVENT', 'COLORLESS'],
        PU: ['EVENT', 'COLORLESS'],
        TAB: ['EVENT', 'COLORLESS'],
        VI: ['EVENT', 'BLUE'],
        WI: ['EVENT', 'COLORLESS'],
        DIG: ['EVENT', 'COLORLESS']
    };
    let xOffset = 0;
    let yOffset = Math.floor(radius / 2);

    for (let i = 0; i < slots.length; i++) {
        let bee = slots[i].toUpperCase();
        let rarity = slots[i] != 'U' ? bees[bee][0] : 'U';
        let fillColour = rarities[rarity];
        // HONEYCOMB GRID
        if (i > 0 && i % 5 == 0) {
            yOffset -= radius / 1.2;
            xOffset = 0;
        }
        if ((i + 3) % 5 == 0 || (i + 1) % 5 == 0) {
            yOffset += radius / 1.1;
        } else {
            yOffset -= radius / 1.1;
        }
        xOffset += radius * 1.5;
        stroke(134, 89, 8);
        strokeWeight(2);

        hexes.push({x: x + xOffset, y: y + yOffset, bee: bee, type: rarity});
        // DRAWING EMPTY OR SELECTED ICON
        if (slots[i] == 'U') {
            if (!selected.includes(i)) {
                fill(rarities.U);
            } else {
                fill(rarities.SELECTED);
            }
            stroke('#0C1626');
            hexagon(x + xOffset, y + yOffset, radius - 2);
        } else if (selected.includes(i)) {
            fill(rarities.SELECTED);
        } else {
            fill(fillColour);
        }
        // DRAWING BEE'S HEXAGON
        if (slots[i] != 'U') {
            hexagon(hexes[hexes.length - 1].x, hexes[hexes.length - 1].y, radius);
        }
        // CHANGING THE COLOR OF THE BEE ICON, ALSO ADDING LEVEL
        if (slots[i] != 'U') {

            // ADD A TINT ON BEE ICON, BUT
            let imgName = `bee_${slots[i].toUpperCase()}`;
            let img = bee_imgs[imgName];
            if (slots[i].toUpperCase() != 'LO' && slots[i].toUpperCase() != 'CA') {
                tint(colours[bees[slots[i].toUpperCase()][1]]);
            } else {
                noTint();
            }
            // DRAW BEE ICON
            imageMode(CENTER);
            image(img, x + xOffset, y + yOffset, radius + 8, radius + 8);

            // DRAWING BEE'S GIFTED BORDER
            if (slots[i] == slots[i].toLowerCase()) {
                stroke('#ff0');
                strokeWeight(4);
                noFill();
                hexagon(x + xOffset, y + yOffset, radius - 2);
            }

            // LEVEL
            if (!hideLevels) try {
                let lvl = level[i].toString();
                if (lvl) {
                    let posX = hexes[hexes.length - 1].x - 18;
                    let posY = hexes[hexes.length - 1].y;
                    let beeMutation = mutations?.[mutation?.[i]?.toUpperCase()] || mutations.NONE;

                    textFont(hwfnt);
                    textAlign(CENTER, CENTER);
                    textSize(20);
                    fill(beeMutation);
                    stroke(0);
                    strokeWeight(2);
                    text(lvl, posX, posY);
                    textFont(fnt);
                }
            } catch(error) {
            }

            // BEEQUIP
            try {
                let bqp = beequip[i].toString();
                if (bqp) {
                    let imgName = `bqp_${beequip[i].toUpperCase()}`;
                    let bqpImg = bqp_imgs[imgName];

                    if (bqpImg) {
                        let posX = hexes[hexes.length - 1].x;
                        let posY = hexes[hexes.length - 1].y;

                        imageMode(CENTER);
                        noTint();
                        image(bqpImg, posX, posY+20, radius - 50, radius - 50);
                    }
                }
            } catch (error) {
            }
        }
        

        if (selected.length === 0) {
            hexesNormal = hexes.map(h => ({...h}));
        }

    }
    // I'M GUESSING FAILSAFE ?
    if (slots.length < 25) {
        if (slots.length % 5 == 0) {
            yOffset -= radius / 1.2;
            xOffset = 0;
        }
        if ((slots.length + 3) % 5 == 0 || (slots.length + 1) % 5 == 0) {
            yOffset += radius / 1.1;
        } else {
            yOffset -= radius / 1.1;
        }
        xOffset += radius * 1.5;
        hexes.push({x: x + xOffset, y: y + yOffset, bee: 'U', type: 'U'});
        for (let j = 1; j < 25 - slots.length + 1; j++) {
            stroke('#0C1626');
            if (hexes[j + slots.length - 1].type == 'SELECTED') {
                fill(rarities.SELECTED);
            } else {
                fill(rarities.U);
            }
            hexagon(hexes[hexes.length - 1].x, hexes[hexes.length - 1].y, radius - 2);
            if ((j + slots.length) % 5 == 0) {
                yOffset -= radius / 1.2;
                xOffset = 0;
            }
            if (((j + slots.length) + 3) % 5 == 0 || ((j + slots.length) + 1) % 5 == 0) {
                yOffset += radius / 1.1;
            } else {
                yOffset -= radius / 1.1;
            }
            xOffset += radius * 1.5;
            
            hexes.push({x: x + xOffset, y: y + yOffset, bee: 'U', type: 'U'});
        }
        hexes.pop();
        if (selected.length === 0) {
            hexesNormal = hexes.map(h => ({...h}));
        }
    }
}

function hexagon(x, y, radius) {
    let angle = PI / 3;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
        let sx = x + cos(a) * radius;
        let sy = y + sin(a) * radius;
        vertex(sx, sy);
    }
    endShape(CLOSE);
}
