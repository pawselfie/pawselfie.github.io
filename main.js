const _origGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, attrs) {
    if (type === '2d') attrs = { ...attrs, willReadFrequently: true };
    return _origGetContext.call(this, type, attrs);
};

let mode, cnv, fnt, hive, hiveSaved, hexes, hexesNormal, selected, multSelt, gifted, bee_btns, bqp_btns, mut_btns, dragging=false;
let undoStack = [];
let redoStack = [];
let slotClipboard = null;

const RARITY_COLORS = {
    Common: '#bc8034', Rare: '#d0d1d8', Epic: '#e0bf09',
    Legendary: '#4ffff0', Mythic: '#b79ef7', Event: '#93dc62'
};

const BEE_INFO = {
    BA:  { name:'Basic Bee',      rarity:'Common',    color:'Colorless', gifted:'x1.2 Pollen',                               energy:20,       speed:14,    attack:1, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:[],                                             likes:['Sunflower','Clover','Mountain Top'],              dislikes:['Spider'] },
    BO:  { name:'Bomber Bee',     rarity:'Rare',      color:'Colorless', gifted:'x1.1 Bomb Pollen',                          energy:20,       speed:15.4,  attack:2, gatherAmt:10,       gatherSpd:4,    convertAmt:120,  convertSpd:4,    passive:null,                         tokens:['Buzz Bomb'],                                  likes:['Dandelion','Cactus'],                             dislikes:['Pumpkin'] },
    BR:  { name:'Brave Bee',      rarity:'Rare',      color:'Colorless', gifted:'+1 Bee Attack',                             energy:30,       speed:16.8,  attack:5, gatherAmt:10,       gatherSpd:4,    convertAmt:200,  convertSpd:4,    passive:null,                         tokens:[],                                             likes:['Spider','Clover'],                                dislikes:['Dandelion'] },
    BU:  { name:'Bumble Bee',     rarity:'Rare',      color:'Blue',      gifted:'x1.1 Capacity',                             energy:50,       speed:10.5,  attack:1, gatherAmt:18,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:['Blue Bomb'],                                  likes:['Blue Flower','Pine Tree','Stump'],                dislikes:['Mushroom'] },
    CO:  { name:'Cool Bee',       rarity:'Rare',      color:'Blue',      gifted:'x1.1 Blue Pollen',                          energy:20,       speed:14,    attack:2, gatherAmt:10,       gatherSpd:3,    convertAmt:120,  convertSpd:4,    passive:null,                         tokens:['Blue Boost'],                                 likes:['Bamboo','Pine Tree'],                             dislikes:['Strawberry'] },
    HA:  { name:'Hasty Bee',      rarity:'Rare',      color:'Colorless', gifted:'+15% Player Movespeed',                     energy:20,       speed:19.6,  attack:1, gatherAmt:10,       gatherSpd:3,    convertAmt:80,   convertSpd:3,    passive:null,                         tokens:['Haste'],                                      likes:['Sunflower','Cactus'],                             dislikes:['Pumpkin','Stump'] },
    LO:  { name:'Looker Bee',     rarity:'Rare',      color:'Colorless', gifted:'+25% Critical Power',                       energy:20,       speed:14,    attack:1, gatherAmt:13,       gatherSpd:4,    convertAmt:160,  convertSpd:4,    passive:null,                         tokens:['Focus'],                                      likes:['Clover','Mountain Top'],                          dislikes:['Sunflower'] },
    RA:  { name:'Rad Bee',        rarity:'Rare',      color:'Red',       gifted:'x1.1 Red Pollen',                           energy:20,       speed:14,    attack:1, gatherAmt:13,       gatherSpd:4,    convertAmt:80,   convertSpd:3,    passive:null,                         tokens:['Red Boost'],                                  likes:['Rose','Mushroom'],                                dislikes:['Pine Tree'] },
    RAS: { name:'Rascal Bee',     rarity:'Rare',      color:'Red',       gifted:'x1.25 Red Bomb Pollen',                     energy:20,       speed:16.1,  attack:3, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:['Red Bomb'],                                   likes:['Rose','Mushroom'],                                dislikes:['Pine Tree'] },
    ST:  { name:'Stubborn Bee',   rarity:'Rare',      color:'Colorless', gifted:'+15% Token Lifespan',                       energy:20,       speed:11.9,  attack:2, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:3,    passive:null,                         tokens:['Pollen Mark'],                                likes:['Dandelion','Pineapple'],                          dislikes:['Rose'] },
    BUB: { name:'Bubble Bee',     rarity:'Epic',      color:'Blue',      gifted:'x1.25 Bubble Pollen',                       energy:20,       speed:16.1,  attack:3, gatherAmt:10,       gatherSpd:4,    convertAmt:160,  convertSpd:4,    passive:'Gathering Bubbles',          tokens:['Blue Bomb'],                                  likes:['Blue Flower','Pine Tree'],                        dislikes:['Strawberry'] },
    BUC: { name:'Bucko Bee',      rarity:'Epic',      color:'Blue',      gifted:'+20% Blue Field Capacity',                  energy:30,       speed:15.4,  attack:5, gatherAmt:17,       gatherSpd:4,    convertAmt:80,   convertSpd:3,    passive:null,                         tokens:['Blue Boost'],                                 likes:['Pine Tree','Bamboo','Blue Flower'],                dislikes:['Rose','Strawberry'] },
    COM: { name:'Commander Bee',  rarity:'Epic',      color:'Colorless', gifted:'+3% Critical Chance',                       energy:30,       speed:14,    attack:4, gatherAmt:15,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:['Buzz Bomb','Focus'],                          likes:['Cactus','Spider'],                                dislikes:['Dandelion'] },
    DE:  { name:'Demo Bee',       rarity:'Epic',      color:'Colorless', gifted:'x1.25 Buzz Bomb Pollen',                    energy:20,       speed:16.8,  attack:3, gatherAmt:10,       gatherSpd:4,    convertAmt:200,  convertSpd:4,    passive:null,                         tokens:['Buzz Bomb+'],                                 likes:['Cactus','Dandelion'],                             dislikes:['Rose'] },
    EX:  { name:'Exhausted Bee',  rarity:'Epic',      color:'Colorless', gifted:'+20% White Field Capacity',                 energy:Infinity, speed:10.5,  attack:1, gatherAmt:10,       gatherSpd:4.6,  convertAmt:240,  convertSpd:4,    passive:null,                         tokens:['Buzz Bomb','Token Link'],                     likes:['Sunflower','Dandelion','Stump'],                  dislikes:['Cactus'] },
    FI:  { name:'Fire Bee',       rarity:'Epic',      color:'Red',       gifted:'x1.25 Flame Pollen',                        energy:25,       speed:11.2,  attack:4, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:'Gathering Flames',           tokens:['Red Bomb+'],                                  likes:['Mushroom','Strawberry'],                          dislikes:['Pine Tree'] },
    FR:  { name:'Frosty Bee',     rarity:'Epic',      color:'Blue',      gifted:'x1.25 Blue Bomb Pollen',                    energy:25,       speed:11.2,  attack:1, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:['Blue Bomb+','Blue Boost'],                    likes:['Blue Flower','Mountain Top'],                     dislikes:['Mushroom'] },
    HO:  { name:'Honey Bee',      rarity:'Epic',      color:'Colorless', gifted:'x1.5 Honey From Tokens',                    energy:20,       speed:14,    attack:1, gatherAmt:10,       gatherSpd:4,    convertAmt:360,  convertSpd:2,    passive:null,                         tokens:['Honey Gift','Honey Mark'],                    likes:['Mountain Top','Pumpkin'],                         dislikes:['Spider'] },
    RAG: { name:'Rage Bee',       rarity:'Epic',      color:'Red',       gifted:'+10% Bee Attack',                           energy:20,       speed:15.4,  attack:4, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:['Token Link','Rage'],                          likes:['Rose','Spider'],                                  dislikes:['Blue Flower'] },
    RI:  { name:'Riley Bee',      rarity:'Epic',      color:'Red',       gifted:'+20% Red Field Capacity',                   energy:25,       speed:15.4,  attack:5, gatherAmt:10,       gatherSpd:2,    convertAmt:140,  convertSpd:4,    passive:null,                         tokens:['Red Boost'],                                  likes:['Rose','Strawberry','Mushroom'],                   dislikes:['Pine Tree','Bamboo'] },
    SH:  { name:'Shocked Bee',    rarity:'Epic',      color:'Colorless', gifted:'x1.1 White Pollen',                         energy:20,       speed:19.6,  attack:2, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:2,    passive:'-50% Sleep Time',            tokens:['Haste','Token Link'],                         likes:['Spider','Pineapple'],                             dislikes:['Mushroom'] },
    BAB: { name:'Baby Bee',       rarity:'Legendary', color:'Colorless', gifted:'+25% Loot Luck',                            energy:15,       speed:10.5,  attack:0, gatherAmt:10,       gatherSpd:5,    convertAmt:80,   convertSpd:5,    passive:null,                         tokens:['Baby Love'],                                  likes:['Dandelion','Sunflower','Mushroom','Blue Flower'], dislikes:['Spider','Cactus','Pine Tree','Rose','Stump'] },
    CA:  { name:'Carpenter Bee',  rarity:'Legendary', color:'Colorless', gifted:'x1.25 Tool Pollen',                         energy:25,       speed:11.2,  attack:4, gatherAmt:10,       gatherSpd:3,    convertAmt:120,  convertSpd:4,    passive:null,                         tokens:['Pollen Mark','Honey Mark+'],                  likes:['Pine Tree','Bamboo'],                             dislikes:['Mountain Top'] },
    DEM: { name:'Demon Bee',      rarity:'Legendary', color:'Red',       gifted:'+20% Instant Bomb Conversion',              energy:20,       speed:10.5,  attack:8, gatherAmt:35,       gatherSpd:4,    convertAmt:60,   convertSpd:4,    passive:'Gathering Flames+',          tokens:['Red Bomb','Red Bomb+'],                       likes:['Spider','Mushroom'],                              dislikes:['Mountain Top'] },
    DI:  { name:'Diamond Bee',    rarity:'Legendary', color:'Blue',      gifted:'x1.2 Convert Rate',                         energy:20,       speed:14,    attack:1, gatherAmt:10,       gatherSpd:4,    convertAmt:1000, convertSpd:4,    passive:'Shimmering Honey',           tokens:['Honey Gift+','Blue Boost'],                   likes:['Blue Flower','Pineapple'],                        dislikes:['Rose'] },
    LI:  { name:'Lion Bee',       rarity:'Legendary', color:'Colorless', gifted:'+5% Gifted Bee Pollen',                     energy:60,       speed:19.6,  attack:9, gatherAmt:20,       gatherSpd:4,    convertAmt:160,  convertSpd:2,    passive:null,                         tokens:['Buzz Bomb+'],                                 likes:['Pineapple','Ant'],                                dislikes:['Clover'] },
    MU:  { name:'Music Bee',      rarity:'Legendary', color:'Colorless', gifted:'+25% Pollen From Gathering',                energy:20,       speed:16.1,  attack:1, gatherAmt:16,       gatherSpd:4,    convertAmt:240,  convertSpd:4,    passive:null,                         tokens:['Focus','Token Link','Melody'],                likes:['Clover','Dandelion'],                             dislikes:['Cactus'] },
    NI:  { name:'Ninja Bee',      rarity:'Legendary', color:'Blue',      gifted:'+5% Bee Movespeed',                         energy:20,       speed:21,    attack:4, gatherAmt:10,       gatherSpd:2,    convertAmt:80,   convertSpd:3,    passive:null,                         tokens:['Blue Bomb+','Haste'],                         likes:['Bamboo','Blue Flower'],                           dislikes:['Mushroom'] },
    SHY: { name:'Shy Bee',        rarity:'Legendary', color:'Red',       gifted:'+5% Bee Ability Pollen',                    energy:40,       speed:18.2,  attack:2, gatherAmt:10,       gatherSpd:2,    convertAmt:320,  convertSpd:4,    passive:'Nectar Lover',               tokens:['Red Bomb','Red Boost'],                       likes:['Strawberry','Pumpkin'],                           dislikes:['Pine Tree'] },
    BUO: { name:'Buoyant Bee',    rarity:'Mythic',    color:'Blue',      gifted:'x1.2 Capacity',                             energy:60,       speed:14,    attack:3, gatherAmt:15,       gatherSpd:5,    convertAmt:150,  convertSpd:3,    passive:'Balloon Enthusiast',         tokens:['Blue Bomb','Inflate Balloon','Surprise Party (G)'], likes:['Coconut','Mountain Top','Bamboo','Blue Flower'], dislikes:[] },
    FU:  { name:'Fuzzy Bee',      rarity:'Mythic',    color:'Colorless', gifted:'x1.1 Bomb Power',                           energy:50,       speed:11.9,  attack:3, gatherAmt:100,      gatherSpd:6,    convertAmt:40,   convertSpd:6,    passive:'Fuzzy Coat',                 tokens:['Buzz Bomb+','Fuzz Bombs','Pollen Haze (G)'],   likes:['Pine Tree','Dandelion'],                          dislikes:['Pepper'] },
    PR:  { name:'Precise Bee',    rarity:'Mythic',    color:'Red',       gifted:'+3% Super-Crit Chance',                     energy:40,       speed:11.2,  attack:8, gatherAmt:20,       gatherSpd:4,    convertAmt:130,  convertSpd:4,    passive:'Sniper (+5% Crit, +3% Super-Crit)', tokens:['Target Practice'],             likes:['Rose','Mountain Top'],                            dislikes:['Pine Tree','Bamboo'] },
    SP:  { name:'Spicy Bee',      rarity:'Mythic',    color:'Red',       gifted:'+25% Flame Duration',                       energy:20,       speed:14,    attack:5, gatherAmt:14,       gatherSpd:4,    convertAmt:200,  convertSpd:2,    passive:'Steam Engine',               tokens:['Rage','Inferno','Flame Fuel (G)'],             likes:['Pepper'],                                         dislikes:['Stump'] },
    TA:  { name:'Tadpole Bee',    rarity:'Mythic',    color:'Blue',      gifted:'+25% Bubble Duration',                      energy:10,       speed:11.2,  attack:1, gatherAmt:10,       gatherSpd:6,    convertAmt:120,  convertSpd:4,    passive:'Gathering Bubbles+',         tokens:['Blue Boost','Summon Frog','Baby Love (G)'],   likes:['Pine Tree','Stump'],                              dislikes:['Cactus'] },
    VE:  { name:'Vector Bee',     rarity:'Mythic',    color:'Colorless', gifted:'+15% Mark Duration',                        energy:45.6,     speed:16.24, attack:5, gatherAmt:18,       gatherSpd:4,    convertAmt:144,  convertSpd:2.72, passive:null,                         tokens:['Pollen Mark+','Triangulate','Mark Surge (G)'], likes:['Coconut','Spider'],                              dislikes:['Pineapple'] },
    BE:  { name:'Bear Bee',       rarity:'Event',     color:'Colorless', gifted:'+10% Pollen',                               energy:35,       speed:14,    attack:5, gatherAmt:15,       gatherSpd:2,    convertAmt:200,  convertSpd:2,    passive:null,                         tokens:['Bear Morph'],                                 likes:['Pine Tree','Pumpkin'],                            dislikes:['Blue Flower'] },
    COB: { name:'Cobalt Bee',     rarity:'Event',     color:'Blue',      gifted:'+15% Instant Blue Conversion',              energy:35,       speed:18.2,  attack:6, gatherAmt:10,       gatherSpd:4,    convertAmt:120,  convertSpd:3,    passive:null,                         tokens:['Blue Pulse','Blue Bomb Sync'],                 likes:['Pine Tree','Clover'],                             dislikes:['Pineapple'] },
    CR:  { name:'Crimson Bee',    rarity:'Event',     color:'Red',       gifted:'+15% Instant Red Conversion',               energy:35,       speed:18.2,  attack:6, gatherAmt:10,       gatherSpd:4,    convertAmt:120,  convertSpd:3,    passive:null,                         tokens:['Red Pulse','Red Bomb Sync'],                   likes:['Rose','Clover'],                                  dislikes:['Pineapple'] },
    DIG: { name:'Digital Bee',    rarity:'Event',     color:'Colorless', gifted:'+1% Ability Duplication Chance',            energy:20,       speed:11.9,  attack:1, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:'Drive Expansion',            tokens:['Glitch','Mind Hack','Map Corruption (G)'],    likes:['Coconut','Mountain Top','Dandelion'],             dislikes:['Pine Tree'] },
    FE:  { name:'Festive Bee',    rarity:'Event',     color:'Red',       gifted:'x1.25 Convert Rate at Hive',                energy:20,       speed:16.1,  attack:1, gatherAmt:40,       gatherSpd:4,    convertAmt:150,  convertSpd:1,    passive:null,                         tokens:['Honey Mark','Red Bomb+','Festive Gift','Festive Mark (FW)'], likes:['Pine Tree','Mountain Top','Mushroom'], dislikes:['Blue Flower'] },
    GU:  { name:'Gummy Bee',      rarity:'Event',     color:'Colorless', gifted:'+5% Honey Per Pollen',                      energy:50,       speed:14,    attack:3, gatherAmt:10,       gatherSpd:4,    convertAmt:700,  convertSpd:4,    passive:null,                         tokens:['Glob','Gumdrop Barrage'],                     likes:['Mountain Top','Pineapple','Stump'],               dislikes:['Pumpkin'] },
    PH:  { name:'Photon Bee',     rarity:'Event',     color:'Colorless', gifted:'+5% Instant Conversion',                    energy:Infinity, speed:21,    attack:3, gatherAmt:20,       gatherSpd:2,    convertAmt:240,  convertSpd:2,    passive:null,                         tokens:['Haste','Beamstorm'],                          likes:['Pumpkin','Pineapple'],                            dislikes:['Clover'] },
    PU:  { name:'Puppy Bee',      rarity:'Event',     color:'Colorless', gifted:'+20% Bond From Treats',                     energy:40,       speed:16.1,  attack:2, gatherAmt:25,       gatherSpd:4,    convertAmt:280,  convertSpd:4,    passive:null,                         tokens:['Puppy Love','Fetch'],                         likes:['Clover','Pumpkin'],                               dislikes:['Rose'] },
    TAB: { name:'Tabby Bee',      rarity:'Event',     color:'Colorless', gifted:'+50% Critical Power',                       energy:28,       speed:16.1,  attack:4, gatherAmt:'10–110', gatherSpd:4,    convertAmt:'160–1760', convertSpd:3, passive:null,                    tokens:['Scratch','Tabby Love'],                       likes:['Clover','Spider'],                                dislikes:['Cactus'] },
    VI:  { name:'Vicious Bee',    rarity:'Event',     color:'Blue',      gifted:'-15% Monster Respawn Time',                 energy:50,       speed:17.5,  attack:8, gatherAmt:10,       gatherSpd:4,    convertAmt:80,   convertSpd:4,    passive:null,                         tokens:['Blue Bomb+','Impale'],                        likes:['Rose','Cactus'],                                  dislikes:['Dandelion'] },
    WI:  { name:'Windy Bee',      rarity:'Event',     color:'Colorless', gifted:'+15% Instant White Conv., x2 Cloud Boosts', energy:20,       speed:19.6,  attack:3, gatherAmt:10,       gatherSpd:3,    convertAmt:180,  convertSpd:2,    passive:null,                         tokens:['White Boost','Rain Cloud','Tornado'],         likes:['Coconut','Dandelion'],                            dislikes:['Strawberry','Bamboo'] },
};

const BQP_INFO = {
    // Normal beequips
    AU:   { name:'Autumn Sunhat',       section:'normal',   level:16, color:'Any',  limit:1, beeReq:['Hasty','Bumble','Looker','Exhausted','Diamond','Puppy'],             otherReq:[] },
    BANG: { name:'Bang Snap',           section:'normal',   level:10, color:'Any',  limit:1, beeReq:[],                                                                    otherReq:['Bees must be Common, Rare, or Epic'] },
    BEAD: { name:'Bead Lizard',         section:'normal',   level:9,  color:'Any',  limit:1, beeReq:[],                                                                    otherReq:['Bee must be Common or Rare'] },
    BER:  { name:'Beret',               section:'normal',   level:11, color:'Blue', limit:2, beeReq:[],                                                                    otherReq:[] },
    BAN:  { name:'Bandage',             section:'normal',   level:3,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:[] },
    BOT:  { name:'Bottle Cap',          section:'normal',   level:4,  color:'Any',  limit:2, beeReq:[],                                                                    otherReq:['Bee must be Common or Rare'] },
    CAMO: { name:'Camo Bandana',        section:'normal',   level:8,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:['Bee must know "Bomb" ability'] },
    CAMP: { name:'Camphor Lip Balm',    section:'normal',   level:12, color:'Any',  limit:1, beeReq:['Cool','Stubborn','Bubble','Crimson'],                                otherReq:[] },
    CAN:  { name:'Candy Ring',          section:'normal',   level:14, color:'Any',  limit:1, beeReq:['Stubborn','Bumble','Honey','Diamond','Festive','Gummy'],              otherReq:[] },
    CH:   { name:'Charm Bracelet',      section:'normal',   level:12, color:'Any',  limit:1, beeReq:[],                                                                    otherReq:['Bee must be Legendary'] },
    DEMO: { name:'Demon Talisman',      section:'normal',   level:13, color:'Red',  limit:1, beeReq:['Demon'],                                                             otherReq:['Bee must have a Mutation'] },
    KA:   { name:'Kazoo',               section:'normal',   level:9,  color:'Any',  limit:1, beeReq:['Brave','Bumble','Bubble','Riley','Shocked','Buoyant'],               otherReq:[] },
    LE:   { name:'Lei',                 section:'normal',   level:14, color:'Any',  limit:1, beeReq:['Basic','Looker','Stubborn','Hasty','Exhausted'],                     otherReq:[] },
    PA:   { name:'Paperclip',           section:'normal',   level:7,  color:'Any',  limit:2, beeReq:[],                                                                    otherReq:['Bee must be Rare or Epic'] },
    PIN:  { name:'Pink Eraser',         section:'normal',   level:12, color:'Any',  limit:1, beeReq:[],                                                                    otherReq:['Bee must have a Convert Amount mutation'] },
    PI:   { name:'Pink Shades',         section:'normal',   level:10, color:'Any',  limit:1, beeReq:['Basic','Rad','Bomber','Demo','Honey','Shy'],                         otherReq:['Bee must be Gifted'] },
    RO:   { name:'Rose Headband',       section:'normal',   level:13, color:'Any',  limit:1, beeReq:['Basic','Rascal','Riley','Diamond','Windy','Vicious'],                otherReq:[] },
    SM:   { name:'Smiley Sticker',      section:'normal',   level:7,  color:'Any',  limit:2, beeReq:[],                                                                    otherReq:['Bee must be Gifted'] },
    SW:   { name:'Sweatband',           section:'normal',   level:5,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:[] },
    TH:   { name:'Thimble',             section:'normal',   level:3,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:[] },
    THU:  { name:'Thumbtack',           section:'normal',   level:6,  color:'Red',  limit:2, beeReq:[],                                                                    otherReq:[] },
    WH:   { name:'Whistle',             section:'normal',   level:8,  color:'Any',  limit:1, beeReq:['Brave','Commander','Rascal','Demo','Cool','Rage'],                   otherReq:[] },
    // Beesmas beequips
    BEE:  { name:'Beesmas Top',         section:'beesmas',  level:4,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:['Bee must be Common or Rare'] },
    BEES: { name:'Beesmas Tree Hat',    section:'beesmas',  level:10, color:'Any',  limit:3, beeReq:[],                                                                    otherReq:['Bee must have a Mutation'] },
    BUBB: { name:'Bubble Light',        section:'beesmas',  level:8,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:['Bee must have Energy Mutation'] },
    EL:   { name:'Elf Cap',             section:'beesmas',  level:3,  color:'Any',  limit:2, beeReq:[],                                                                    otherReq:[] },
    ELE:  { name:'Electric Candle',     section:'beesmas',  level:6,  color:'Red',  limit:3, beeReq:[],                                                                    otherReq:[] },
    FES:  { name:'Festive Wreath',      section:'beesmas',  level:10, color:'Red',  limit:1, beeReq:['Festive'],                                                           otherReq:[] },
    ICI:  { name:'Icicles',             section:'beesmas',  level:10, color:'Blue', limit:2, beeReq:[],                                                                    otherReq:['Bee must know "Blue Bomb" ability'] },
    LU:   { name:'Lump Of Coal',        section:'beesmas',  level:13, color:'Any',  limit:3, beeReq:[],                                                                    otherReq:[] },
    PAP:  { name:'Paper Angel',         section:'beesmas',  level:8,  color:'Any',  limit:2, beeReq:['Bomber','Rascal','Shy','Photon'],                                    otherReq:[] },
    PINE: { name:'Pinecone',            section:'beesmas',  level:9,  color:'Any',  limit:2, beeReq:['Bumble','Stubborn','Bucko','Frosty','Carpenter','Bear'],             otherReq:[] },
    PO:   { name:'Poinsettia',          section:'beesmas',  level:6,  color:'Any',  limit:2, beeReq:[],                                                                    otherReq:['Bee must know "Boost" ability'] },
    RE:   { name:'Reindeer Antlers',    section:'beesmas',  level:8,  color:'Any',  limit:1, beeReq:['Puppy'],                                                             otherReq:[] },
    SI:   { name:'Single Mitten',       section:'beesmas',  level:6,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:['Bee must be Rare, Epic, or Legendary'] },
    SN:   { name:'Snow Tiara',          section:'beesmas',  level:12, color:'Any',  limit:1, beeReq:['Cool','Stubborn','Shocked','Frosty','Diamond','Windy'],              otherReq:['Bee must be Gifted'] },
    SNO:  { name:'Snowglobe',           section:'beesmas',  level:7,  color:'Any',  limit:2, beeReq:['Basic','Bumble','Cool'],                                             otherReq:[] },
    TO:   { name:'Toy Horn',            section:'beesmas',  level:9,  color:'Any',  limit:2, beeReq:['Brave','Rage','Lion','Cobalt','Crimson'],                            otherReq:[] },
    TOY:  { name:'Toy Drum',            section:'beesmas',  level:7,  color:'Any',  limit:2, beeReq:['Brave','Demo','Bucko','Riley'],                                      otherReq:[] },
    WA:   { name:'Warm Scarf',          section:'beesmas',  level:5,  color:'Any',  limit:3, beeReq:['Basic','Rad','Exhausted','Frosty','Shy'],                            otherReq:[] },
    PE:   { name:'Peppermint Antennas', section:'beesmas',  level:7,  color:'Any',  limit:3, beeReq:[],                                                                    otherReq:[] },
    // Unreleased beequips
    SPS:  { name:'Six-Point Shuriken',    section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    PL:   { name:'Pan Lid',               section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    PB:   { name:'Pink Bow',              section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    OFF:  { name:'Orange Flip Flop',      section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    HH:   { name:'Heroic Helm',           section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    FGS:  { name:'Fidget Spinner',        section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    SC:   { name:'Safety Cone',           section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    CB:   { name:'Charity Bracelet',      section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    RS:   { name:'Round Spectacles',      section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    SH:   { name:'Shell Necklace',        section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    BKM:  { name:"Beekeeper's Medal",     section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
    MFP:  { name:'Monster Finger Puppet', section:'unreleased', level:null, color:null, limit:null, beeReq:[], otherReq:[] },
};

// Basic Bee stat baseline for comparison coloring
const BASIC_STATS = { energy: 20, speed: 14, attack: 1, gatherAmt: 10, gatherSpd: 4, convertAmt: 80, convertSpd: 4 };

function buildTooltipHTML(info) {
    function fmtStat(val, base, lowerIsBetter) {
        if (val === Infinity) return `<span style="color:#7ef87e">∞</span>`;
        if (typeof val !== 'number') return String(val);
        if (val === base) return String(val);
        const better = lowerIsBetter ? val < base : val > base;
        return `<span style="color:${better ? '#7ef87e' : '#f87e7e'}">${val}</span>`;
    }
    const B = BASIC_STATS;
    const en  = fmtStat(info.energy,     B.energy,     false);
    const spd = fmtStat(info.speed,      B.speed,      false);
    const atk = fmtStat(info.attack,     B.attack,     false);
    const ga  = fmtStat(info.gatherAmt,  B.gatherAmt,  false);
    const gs  = fmtStat(info.gatherSpd,  B.gatherSpd,  true);
    const ca  = fmtStat(info.convertAmt, B.convertAmt, false);
    const cs  = fmtStat(info.convertSpd, B.convertSpd, true);

    const fmtTokens = info.tokens.map(t => {
        if (t.endsWith(' (G)')) return `<span style="color:#ffe94a">${t.slice(0, -4)} ★</span>`;
        return t;
    }).join(', ');

    let h = `<div class="tt-name">${info.name}</div>`;
    h += `<div class="tt-meta"><span class="tt-rarity" style="color:${RARITY_COLORS[info.rarity]}">${info.rarity}</span><span class="tt-color">${info.color}</span></div>`;
    h += `<div class="tt-row"><span class="tt-lbl">Gifted</span><span>${info.gifted}</span></div>`;
    h += `<div class="tt-row"><span class="tt-lbl">Stats</span><span class="tt-statvals">EN:${en} BMS:${spd} ATK:${atk}</span></div>`;
    h += `<div class="tt-row"><span class="tt-lbl">Gather</span><span class="tt-statvals">${ga} Pollen / ${gs}s</span></div>`;
    h += `<div class="tt-row"><span class="tt-lbl">Convert</span><span class="tt-statvals">${ca} Honey / ${cs}s</span></div>`;
    if (info.passive)              h += `<div class="tt-row"><span class="tt-lbl">Passive</span><span>${info.passive}</span></div>`;
    if (info.tokens.length)        h += `<div class="tt-row"><span class="tt-lbl">Tokens</span><span>${fmtTokens}</span></div>`;
    if (info.likes.length)         h += `<div class="tt-row"><span class="tt-lbl">Likes</span><span>${info.likes.join(', ')}</span></div>`;
    if (info.dislikes.length)      h += `<div class="tt-row"><span class="tt-lbl">Dislikes</span><span>${info.dislikes.join(', ')}</span></div>`;
    return h;
}

function buildBqpTooltipHTML(info) {
    const icon = info.section === 'beesmas' ? '🎄' : info.section === 'unreleased' ? '⚠️' : '📌';
    let h = `<div class="tt-name">${icon} ${info.name}</div>`;
    if (info.section === 'unreleased') {
        h += `<div class="tt-row"><span class="tt-lbl">Status</span><span>Unreleased</span></div>`;
        return h;
    }
    h += `<div class="tt-row"><span class="tt-lbl">Limit</span><span>${info.limit}</span></div>`;
    h += `<div class="tt-row"><span class="tt-lbl">Level</span><span>${info.level}</span></div>`;
    h += `<div class="tt-row"><span class="tt-lbl">Color</span><span>${info.color}</span></div>`;
    if (info.beeReq.length)   h += `<div class="tt-row"><span class="tt-lbl">Bee Req</span><span>${info.beeReq.join(', ')}</span></div>`;
    if (info.otherReq.length) h += `<div class="tt-row"><span class="tt-lbl">Other Req</span><span>${info.otherReq.join(', ')}</span></div>`;
    return h;
}

function positionTooltip(tooltip, e) {
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    tooltip.style.left = (x + tw > window.innerWidth  ? e.clientX - tw - 10 : x) + 'px';
    tooltip.style.top  = (y + th > window.innerHeight ? e.clientY - th - 10 : y) + 'px';
}
let hideLevels = false;
let _pendingHiveFromURL = null;

(async () => {
    const param = new URLSearchParams(location.search).get('hive');
    if (!param) return;
    try {
        let json;
        if (param.startsWith('z')) {
            const b64 = param.slice(1).replace(/-/g, '+').replace(/_/g, '/');
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const stream = new DecompressionStream('deflate-raw');
            const writer = stream.writable.getWriter();
            writer.write(bytes);
            writer.close();
            const buf = await new Response(stream.readable).arrayBuffer();
            json = new TextDecoder().decode(buf);
        } else {
            json = param; // legacy: old param is plain JSON
        }
        _pendingHiveFromURL = JSON.parse(json);
    } catch(e) { console.error('Failed to parse hive URL param:', e); }
})();

// ── PRESETS ──────────────────────────────────────────────────────────────────
// Set `data` to the string produced by "Export as string" for each preset.
const PRESETS = {
    blue: [
        { name: 'Blue Hive',           data: '{"name":"Blue Hive","slots":["fe","gu","be","pu","tab","bub","buc","wi","co","bu","ex","di","ba","di","st","com","di","di","di","lo","mu","mu","di","ni","mu","ta","ta","ta","ta","ta","ta","buo","ta","buo","ta","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo"],"level":[20,20,20,20,20,20,20,20,20,20,20,21,20,21,20,20,21,21,21,20,20,20,21,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["BAR","BMS","BAR","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","CAM","BMS","CAM","BMS","BMS","CAM","CAM","CAM","BMS","BMS","BMS","CAM","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,null,"PINE","RE",null,"CAMP","TOY",null,"WH","PINE",null,"EL","BEAD","EL",null,null,"AU","RO","CAN",null,null,null,"SN",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Blessing Boost Comp', data: '{"name":"Blessing Boost Comp","slots":["fe","be","ba","wi","pu","bu","buc","ex","bub","lo","mu","mu","ni","mu","mu","ta","ta","di","ta","ta","ta","ta","ta","ta","ta","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","CAM","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PINE","BEAD","SN","RE","PINE","TOY",null,null,"AU",null,null,null,null,null,null,null,"RO",null,null,null,null,null,null,null,"BER","BER","BEES","BEES","BEES",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Diamond Comp',        data: '{"name":"Diamond Comp","slots":["fe","wi","be","pu","tab","bub","buc","ba","co","bu","ex","mu","ni","mu","lo","mu","di","di","di","mu","di","di","di","di","di","ta","ta","di","ta","ta","ta","ta","buo","ta","ta","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo"],"level":[21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,21,22,22,22,22,22,21,21,22,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],"mutation":["BAR","BMS","BAR","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","CAM","CAM","CAM","BMS","CAM","CAM","CAM","CAM","CAM","BMS","BMS","CAM","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":["FES",null,"PINE","RE",null,"CAMP","TOY","BEAD",null,"PINE",null,null,null,null,null,null,"CAN","RO","AU",null,null,"EL","SN","EL",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Honeyday Comp',      data: '{"name":"Honeyday Comp","slots":["fe","pu","ta","gu","be","bu","ex","bub","buc","st","mu","di","di","di","mu","mu","di","di","di","mu","di","di","di","di","di","ta","di","di","di","ta","ta","buo","ta","buo","ta","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo","buo"],"level":[21,21,21,21,21,21,21,21,21,21,21,22,22,22,21,21,22,22,22,21,22,22,22,22,22,21,22,22,22,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],"mutation":["BAR","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","CAM","CAM","CAM","BMS","BMS","CAM","CAM","CAM","BMS","CAM","CAM","CAM","CAM","CAM","BMS","CAM","CAM","CAM","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":["FES","RE",null,null,"PINE","PINE",null,null,null,"BEAD",null,"BER",null,"BER",null,null,"AU","RO","CAN",null,null,"EL","SN","EL",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Pop Gummy Comp',     data: '{"name":"Pop Gummy Comp","slots":["be","ph","gu","wi","tab","pu","st","dig","lo","cob","ha","ho","ba","sh","co","buc","ca","li","mu","bub","ni","ve","ve","ve","di","ve","ve","ve","ve","ve","ve","ta","ta","ta","ve","ta","ta","ta","ta","ta","pr","pr","ta","pr","pr","pr","pr","buo","pr","pr"],"level":[22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],"mutation":["BAR","BMS","BMS","BMS","BAR","BMS","BMS","GA","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS"],"beequip":[null,"PAP",null,null,null,null,"SM","SW","PA","TO","PA",null,"PI",null,"WH","TOY","SM","TO",null,"CAMP",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"KA",null,null]}' },
    ],
    white: [
        { name: 'White Hive',         data: '{"name":"White Hive","slots":["wi","be","dig","tab","gu","pu","lo","ba","st","ph","com","ha","bo","br","de","ho","bab","mu","bab","sh","bab","pr","ca","pr","bab","pr","pr","li","pr","pr","ve","ve","pr","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve"],"level":[22,22,23,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],"mutation":["BMS","BAR","GA","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS"],"beequip":[null,null,"SW",null,null,"RE","PA","PI","SM","PAP","WH","BEAD","PAP","TOY","TOY","PA",null,null,null,"KA",null,null,"SM",null,null,null,null,"TO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
    ],
    red: [
        { name: 'Red Hive',           data: '{"name":"Red Hive","slots":["st","ri","ba","ri","ra","ta","bab","com","bab","ta","ve","ve","ca","ve","ve","ve","ve","ve","ve","ve","ve","pr","buo","sp","ve","pr","pr","dig","sp","sp","pr","pr","be","sp","sp","pr","pr","tab","sp","sp","pr","pr","cr","sp","sp","pr","pr","ph","sp","sp"],"level":[21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],"mutation":["BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","GA","BAR","BAR","BMS","BMS","BAR","BAR","BAR","BMS","BMS","BAR","BAR","BAR","BMS","BMS","BMS","BAR","BAR","BMS","BMS","BMS","BAR","BAR"],"beequip":["CAMP","TOY","PI","TOY",null,null,null,"WH",null,"PO",null,null,"CH",null,null,null,null,null,null,null,null,null,"KA","SM",null,null,null,"SW",null,"SM",null,null,null,null,null,null,null,null,null,null,null,null,"TO",null,null,null,null,"PAP",null,null]}' },
        { name: 'Bloom Comp',         data: '{"name":"Bloom Comp","slots":["ph","tab","dig","be","cr","ra","com","ba","ri","st","ta","bab","ha","bab","ta","ve","ve","ca","ve","ve","ve","ve","mu","ve","ve","ve","sp","shy","sp","ve","sp","sp","sp","sp","sp","sp","sp","sp","sp","sp","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr"],"level":[22,22,23,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],"mutation":["BMS","BAR","GA","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS"],"beequip":["PAP",null,"SW",null,"TO","PA","WH","PI","TOY","CAMP","PO",null,"PA",null,"PO",null,null,"CH",null,null,null,null,null,null,null,null,"SM","PAP","SM",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Scorch Gummy Comp',  data: '{"name":"Scorch Gummy Comp","slots":["be","gu","cr","ph","tab","br","ra","dig","st","ha","ri","ho","ba","com","sh","bab","li","shy","mu","bab","ta","sp","ca","sp","ta","sp","pr","sp","pr","sp","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","ve","ve","ve","ve","ve","ve","ve","ve","ve","ve"],"level":[22,22,22,22,22,22,22,23,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22],"mutation":["BAR","BMS","BMS","BMS","BAR","BMS","BMS","GA","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BMS","BAR","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS"],"beequip":[null,null,"TO","PAP",null,"TOY","PA","SW","CAMP","PA","TOY","SM","PI","WH","KA",null,"TO","PAP",null,null,"PO",null,"SM",null,"PO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
    ],
    rbc: [
        { name: 'RBC Hive',           data: '{"name":"RBC Hive","slots":["ri","com","ha","mu","ca","buc","ta","st","ta","li","ta","sp","ta","sp","ta","sp","sp","buo","sp","sp","ve","be","ba","tab","ve","ve","ve","dig","ve","ve","ve","ve","ve","ve","ve","ve","ve","pr","ve","ve","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BMS","BAR","BAR","BMS","BAR","BMS","BAR","BMS","BMS","BMS","GA","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS"],"beequip":["TOY","WH","PA",null,"CH","TOY","PO","PA","PO","TO",null,"SM",null,"SM",null,null,null,"KA",null,null,null,null,"PI",null,null,null,null,"SW",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'RBC Blue Hive',      data: '{"name":"RBC Blue Hive","slots":["bub","buc","ba","ri","com","ca","tab","ha","be","mu","ta","ta","dig","ta","ta","ta","buo","ta","buo","ta","buo","buo","buo","buo","buo","ve","ve","buo","ve","ve","ve","ve","ve","ve","ve","ve","sp","ve","sp","ve","sp","pr","sp","pr","sp","pr","pr","pr","pr","pr"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,21,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BMS","BMS","GA","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BMS","BAR","BMS","BAR","BMS","BMS","BMS","BMS","BMS"],"beequip":["CAMP","TOY","PI","TOY","WH","CH",null,"BEAD",null,null,null,null,"SW",null,null,null,null,null,null,null,null,null,null,null,null,null,"SM","KA","SM",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,"br",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"buo",null,null,null,"buo",null,null,null,null,null,null,null,"sp",null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,20,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"BAR",null,null,null,null,null,null,null,null,null,null,null,null]}' },
    ],
    alts: [
        { name: 'Fuzzy Alt',          data: '{"name":"Fuzzy Alt","slots":["vi","dig","fe","gu","wi","shy","rag","rag","rag","shy","st","pr","rag","pr","ha","pr","pr","ve","pr","pr","co","co","co","co","co","fu","fu","co","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","FES","PE",null,"PAP",null,null,null,"PAP",null,null,null,null,null,null,null,"PE",null,null,"PA","PA","BEAD","SNO","SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,"co",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"rag","rag","rag",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Tad Alt',            data: '{"name":"Tad Alt","slots":["ha","fe","dig","gu","st","sh","sh","ni","sh","sh","sh","fu","co","fu","sh","fu","fu","co","fu","fu","fu","fu","fu","fu","fu","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","ta","buo","buo","buo","buo","buo"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["BMS","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BAR","BAR","BAR","BAR"],"beequip":["PA","FES","PE","CAN","PA",null,null,null,null,null,null,null,"SNO",null,null,null,null,"SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"PE",null,"PE",null],"partialBee":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"ta",null,"ta",null,"ta","ta","ta","ta","ta",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,20,null,20,null,20,20,20,20,20,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"BMS",null,"BMS",null,"BMS","BMS","BMS","BMS","BMS",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Buoyant Alt',        data: '{"name":"Buoyant Alt","slots":["vi","dig","fe","gu","WI","st","RAG","RAG","RAG","ha","RAG","RAG","ve","RAG","RAG","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","FES","PE",null,"PA",null,null,null,"PA",null,null,"PE",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,"buo",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,20,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,"BAR",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Blue-Guide Alt',     data: '{"name":"Blue-Guide Alt","slots":["ha","fe","wi","dig","st","SHY","RAG","RAG","RAG","SHY","RAG","CO","RAG","CO","RAG","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","buo","buo","buo","buo","buo"],"level":[15,20,20,20,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,20,20,20,20,20],"mutation":["BMS","BAR","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","PE","PE",null,"PAP",null,null,null,"PAP",null,"SNO",null,"BEAD",null,"SNO",null,"WH","PA","PA",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,null,null,null,null,null,null,null,null,null,"RAG",null,null,null,null,null,"RAG",null,null,null,null,null,null,null,null,null,null,null,null,"CO",null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,15,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,"BMS",null,null]}' },
        { name: 'Guide Alt',          data: '{"name":"Guide Alt","slots":["vi","dig","fe","gu","WI","SHY","RAG","RAG","RAG","SHY","st","CO","RAG","CO","ha","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS"],"beequip":[null,"PE","PE","PE",null,"PAP",null,null,null,"PAP",null,"PA",null,"SNO",null,"PA",null,"BEAD",null,"SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,null,null,null,null,null,null,null,"RAG",null,null,null,"RAG",null,"RAG",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Attack Alt',         data: '{"name":"Attack Alt","slots":["sp","sp","sp","sp","sp","sp","sp","sp","sp","sp","sp","vi","sp","dig","sp","shy","ha","tab","com","mu","br","lo","pr","sh","rag","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr"],"level":[21,21,21,21,21,21,21,21,21,21,21,22,21,22,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],"mutation":["AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","BMS","BMS","AT","BMS","AT","BMS","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT"],"beequip":[null,null,null,null,null,null,null,null,null,null,null,"RO",null,null,null,"PI","BEE",null,"WH",null,"TOY","BEE","THU","KA","TO",null,"BAN","THU","BAN",null,null,null,"BAN",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Mondo Attack Alt',   data: '{"name":"Mondo Attack Alt","slots":["sp","sp","sp","sp","sp","sp","sp","sp","sp","sp","sp","vi","sp","dig","sp","mu","st","tab","com","mu","br","lo","shy","sh","rag","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr","pr"],"level":[21,21,21,21,21,21,21,21,21,21,21,22,21,22,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],"mutation":["AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","BMS","AT","AT","BMS","BMS","AT","BMS","AT","BMS","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT","AT"],"beequip":[null,null,null,null,null,null,null,null,null,null,null,"RO",null,null,null,null,"BEE",null,"WH",null,"TO","BEE","PI","KA","TO",null,"BAN","THU","BAN",null,null,null,"BAN",null,null,null,null,"THU",null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Guide-Fuzzy Alt',    data: '{"name":"Guide-Fuzzy Alt","slots":["vi","dig","fe","gu","WI","SHY","RAG","RAG","RAG","SHY","st","PR","RAG","PR","ha","PR","CO","ve","CO","pr","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","CO","fu","CO","fu","CO","fu","fu","fu","fu","fu","fu","fu","fu","fu","fu"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","FES","PE",null,"PAP",null,null,null,"PAP",null,null,null,null,null,null,"PA","PE","SNO",null,"PA",null,"BEAD",null,"SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,"co",null,null,null,null,null,null,null,null,null,null,null,"rag",null,null,null,"rag",null,"rag",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Guide-Buo Alt',      data: '{"name":"Guide-Buo Alt","slots":["vi","dig","fe","gu","WI","SHY","RAG","RAG","RAG","SHY","st","PR","RAG","PR","ha","PR","CO","ve","CO","pr","CO","CO","CO","CO","CO","CO","BUO","CO","BUO","CO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","FES","PE",null,"PAP",null,null,null,"PAP",null,null,null,null,null,null,"PA","PE","SNO",null,"PA",null,"BEAD",null,"SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,"co",null,null,null,null,null,null,null,null,null,null,null,"rag",null,null,null,"rag",null,"rag",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Tri-Hybrid Alt',     data: '{"name":"Tri-Hybrid Alt","slots":["vi","dig","fe","gu","WI","SHY","RAG","RAG","RAG","SHY","st","PR","RAG","PR","ha","PR","CO","ve","CO","pr","CO","BUO","CO","BUO","CO","BUO","BUO","CO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","fu","fu","BUO","fu","fu","fu","fu","BUO","fu","fu"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","FES","PE",null,"PAP",null,null,null,"PAP",null,null,null,null,null,null,"PA","PE","SNO",null,"PA",null,"BEAD",null,"SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,"co",null,null,null,null,null,null,null,null,null,null,null,"rag",null,null,null,"rag",null,"rag",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
        { name: 'Tetra-Hybrid Alt',   data: '{"name":"Tetra-Hybrid Alt","slots":["vi","dig","fe","gu","WI","SHY","RAG","RAG","RAG","SHY","st","PR","RAG","PR","ha","PR","CO","ve","CO","pr","CO","BUO","CO","BUO","CO","BUO","BUO","CO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","BUO","fu","BUO","fu","BUO","fu","fu","BUO","fu","fu"],"level":[20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20],"mutation":["AT","BAR","BAR","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BMS","BAR","BMS","BMS","BMS","BAR","BMS","BAR","BMS","BAR","BAR","BMS","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR","BAR"],"beequip":[null,"PE","FES","PE",null,"PAP",null,null,null,"PAP",null,null,null,null,null,null,"PA","PE","SNO",null,"PA",null,"BEAD",null,"SNO",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBee":[null,null,null,null,"co",null,null,null,null,null,null,null,null,null,null,null,"rag",null,null,null,"rag",null,"rag",null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialBeequip":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialLevel":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"partialMutation":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]}' },
    ],
};
// Parse each preset's data string into hive arrays
(function() {
    for (const group of Object.values(PRESETS)) {
        for (const p of group) {
            const parsed = p.data ? JSON.parse(p.data) : {};
            p.slots    = parsed.slots    || new Array(50).fill('U');
            p.level    = parsed.level    || new Array(50).fill(0);
            p.mutation = parsed.mutation || new Array(50).fill(null);
            p.beequip  = parsed.beequip  || new Array(50).fill(null);
        }
    }
})();
let lastCtrlQTime = 0;
const bee_imgs = {};
const bqp_imgs = {};
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const sizeOverlay = document.createElement('div');
sizeOverlay.style.position = 'fixed';
sizeOverlay.style.top = 0;
sizeOverlay.style.left = 0;
sizeOverlay.style.width = '100%';
sizeOverlay.style.height = '100%';
sizeOverlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
sizeOverlay.style.color = '#fff';
sizeOverlay.style.display = 'flex';
sizeOverlay.style.alignItems = 'center';
sizeOverlay.style.justifyContent = 'center';
sizeOverlay.style.fontSize = '24px';
sizeOverlay.style.zIndex = 9999;
sizeOverlay.style.textAlign = 'center';
sizeOverlay.style.padding = '20px';
sizeOverlay.innerText = 'Please make your window bigger.\nGoing smaller might break the website visually.';
document.body.appendChild(sizeOverlay);

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function preload() {
    fnt = loadFont('assets/RobotoSlab-VariableFont_wght.ttf');
    hwfnt = loadFont('assets/HWYGNRRW.ttf');
    bee_imgs['bee_BA'] = loadImage('assets/bees/bee_BA.png');  
    bee_imgs['bee_BAB'] = loadImage('assets/bees/bee_BAB.png');
    bee_imgs['bee_BE'] = loadImage('assets/bees/bee_BE.png');  
    bee_imgs['bee_BO'] = loadImage('assets/bees/bee_BO.png');  
    bee_imgs['bee_BR'] = loadImage('assets/bees/bee_BR.png');  
    bee_imgs['bee_BU'] = loadImage('assets/bees/bee_BU.png');  
    bee_imgs['bee_BUB'] = loadImage('assets/bees/bee_BUB.png');
    bee_imgs['bee_BUC'] = loadImage('assets/bees/bee_BUC.png');
    bee_imgs['bee_BUO'] = loadImage('assets/bees/bee_BUO.png');
    bee_imgs['bee_CA'] = loadImage('assets/bees/bee_CA.png');  
    bee_imgs['bee_CO'] = loadImage('assets/bees/bee_CO.png');  
    bee_imgs['bee_COB'] = loadImage('assets/bees/bee_COB.png');
    bee_imgs['bee_COM'] = loadImage('assets/bees/bee_COM.png');
    bee_imgs['bee_CR'] = loadImage('assets/bees/bee_CR.png');  
    bee_imgs['bee_DE'] = loadImage('assets/bees/bee_DE.png');  
    bee_imgs['bee_DEM'] = loadImage('assets/bees/bee_DEM.png');
    bee_imgs['bee_DI'] = loadImage('assets/bees/bee_DI.png');  
    bee_imgs['bee_EX'] = loadImage('assets/bees/bee_EX.png');  
    bee_imgs['bee_FE'] = loadImage('assets/bees/bee_FE.png');
    bee_imgs['bee_FI'] = loadImage('assets/bees/bee_FI.png');
    bee_imgs['bee_FR'] = loadImage('assets/bees/bee_FR.png');
    bee_imgs['bee_FU'] = loadImage('assets/bees/bee_FU.png');
    bee_imgs['bee_GU'] = loadImage('assets/bees/bee_GU.png');
    bee_imgs['bee_HA'] = loadImage('assets/bees/bee_HA.png');
    bee_imgs['bee_HO'] = loadImage('assets/bees/bee_HO.png');
    bee_imgs['bee_LI'] = loadImage('assets/bees/bee_LI.png');
    bee_imgs['bee_LO'] = loadImage('assets/bees/bee_LO.png');
    bee_imgs['bee_MU'] = loadImage('assets/bees/bee_MU.png');
    bee_imgs['bee_NI'] = loadImage('assets/bees/bee_NI.png');
    bee_imgs['bee_PH'] = loadImage('assets/bees/bee_PH.png');
    bee_imgs['bee_PR'] = loadImage('assets/bees/bee_PR.png');
    bee_imgs['bee_PU'] = loadImage('assets/bees/bee_PU.png');
    bee_imgs['bee_RA'] = loadImage('assets/bees/bee_RA.png');
    bee_imgs['bee_RAG'] = loadImage('assets/bees/bee_RAG.png');
    bee_imgs['bee_RAS'] = loadImage('assets/bees/bee_RAS.png');
    bee_imgs['bee_RI'] = loadImage('assets/bees/bee_RI.png');
    bee_imgs['bee_SH'] = loadImage('assets/bees/bee_SH.png');
    bee_imgs['bee_SHY'] = loadImage('assets/bees/bee_SHY.png');
    bee_imgs['bee_SP'] = loadImage('assets/bees/bee_SP.png');
    bee_imgs['bee_ST'] = loadImage('assets/bees/bee_ST.png');
    bee_imgs['bee_TA'] = loadImage('assets/bees/bee_TA.png');
    bee_imgs['bee_TAB'] = loadImage('assets/bees/bee_TAB.png');
    bee_imgs['bee_VE'] = loadImage('assets/bees/bee_VE.png');
    bee_imgs['bee_VI'] = loadImage('assets/bees/bee_VI.png');
    bee_imgs['bee_WI'] = loadImage('assets/bees/bee_WI.png');
    bee_imgs['bee_DIG'] = loadImage('assets/bees/bee_DIG.png');

    bqp_imgs['bqp_TH'] = loadImage('assets/bqps/bqp_TH.png');
    bqp_imgs['bqp_SW'] = loadImage('assets/bqps/bqp_SW.png');
    bqp_imgs['bqp_BAN'] = loadImage('assets/bqps/bqp_BAN.png');
    bqp_imgs['bqp_THU'] = loadImage('assets/bqps/bqp_THU.png');
    bqp_imgs['bqp_CAMO'] = loadImage('assets/bqps/bqp_CAMO.png');
    bqp_imgs['bqp_BOT'] = loadImage('assets/bqps/bqp_BOT.png');
    bqp_imgs['bqp_KA'] = loadImage('assets/bqps/bqp_KA.png');
    bqp_imgs['bqp_SM'] = loadImage('assets/bqps/bqp_SM.png');
    bqp_imgs['bqp_WH'] = loadImage('assets/bqps/bqp_WH.png');
    bqp_imgs['bqp_CH'] = loadImage('assets/bqps/bqp_CH.png');
    bqp_imgs['bqp_PA'] = loadImage('assets/bqps/bqp_PA.png');
    bqp_imgs['bqp_BER'] = loadImage('assets/bqps/bqp_BER.png');
    bqp_imgs['bqp_BANG'] = loadImage('assets/bqps/bqp_BANG.png');
    bqp_imgs['bqp_BEAD'] = loadImage('assets/bqps/bqp_BEAD.png');
    bqp_imgs['bqp_PI'] = loadImage('assets/bqps/bqp_PI.png');
    bqp_imgs['bqp_LE'] = loadImage('assets/bqps/bqp_LE.png');
    bqp_imgs['bqp_DEMO'] = loadImage('assets/bqps/bqp_DEMO.png');
    bqp_imgs['bqp_CAMP'] = loadImage('assets/bqps/bqp_CAMP.png');
    bqp_imgs['bqp_AU'] = loadImage('assets/bqps/bqp_AU.png');
    bqp_imgs['bqp_RO'] = loadImage('assets/bqps/bqp_RO.png');
    bqp_imgs['bqp_PIN'] = loadImage('assets/bqps/bqp_PIN.png');
    bqp_imgs['bqp_CAN'] = loadImage('assets/bqps/bqp_CAN.png');
    bqp_imgs['bqp_EL'] = loadImage('assets/bqps/bqp_EL.png');
    bqp_imgs['bqp_SI'] = loadImage('assets/bqps/bqp_SI.png');
    bqp_imgs['bqp_WA'] = loadImage('assets/bqps/bqp_WA.png');
    bqp_imgs['bqp_PE'] = loadImage('assets/bqps/bqp_PE.png');
    bqp_imgs['bqp_BEE'] = loadImage('assets/bqps/bqp_BEE.png');
    bqp_imgs['bqp_PINE'] = loadImage('assets/bqps/bqp_PINE.png');
    bqp_imgs['bqp_ICI'] = loadImage('assets/bqps/bqp_ICI.png');
    bqp_imgs['bqp_BEES'] = loadImage('assets/bqps/bqp_BEES.png');
    bqp_imgs['bqp_BUBB'] = loadImage('assets/bqps/bqp_BUBB.png');
    bqp_imgs['bqp_SN'] = loadImage('assets/bqps/bqp_SN.png');
    bqp_imgs['bqp_SNO'] = loadImage('assets/bqps/bqp_SNO.png');
    bqp_imgs['bqp_RE'] = loadImage('assets/bqps/bqp_RE.png');
    bqp_imgs['bqp_TO'] = loadImage('assets/bqps/bqp_TO.png');
    bqp_imgs['bqp_PAP'] = loadImage('assets/bqps/bqp_PAP.png');
    bqp_imgs['bqp_TOY'] = loadImage('assets/bqps/bqp_TOY.png');
    bqp_imgs['bqp_LU'] = loadImage('assets/bqps/bqp_LU.png');
    bqp_imgs['bqp_PO'] = loadImage('assets/bqps/bqp_PO.png');
    bqp_imgs['bqp_ELE'] = loadImage('assets/bqps/bqp_ELE.png');
    bqp_imgs['bqp_FES'] = loadImage('assets/bqps/bqp_FES.png');

    bqp_imgs['bqp_SPS'] = loadImage('assets/bqps/bqp_SPS.png');
    bqp_imgs['bqp_PL'] = loadImage('assets/bqps/bqp_PL.png');
    bqp_imgs['bqp_PB'] = loadImage('assets/bqps/bqp_PB.png');
    bqp_imgs['bqp_OFF'] = loadImage('assets/bqps/bqp_OFF.png');
    bqp_imgs['bqp_HH'] = loadImage('assets/bqps/bqp_HH.png');
    bqp_imgs['bqp_FGS'] = loadImage('assets/bqps/bqp_FGS.png');
    bqp_imgs['bqp_SC'] = loadImage('assets/bqps/bqp_SC.png');
    bqp_imgs['bqp_CB'] = loadImage('assets/bqps/bqp_CB.png');
    bqp_imgs['bqp_RS'] = loadImage('assets/bqps/bqp_RS.png');
    bqp_imgs['bqp_SH'] = loadImage('assets/bqps/bqp_SH.png');
    bqp_imgs['bqp_BKM'] = loadImage('assets/bqps/bqp_BKM.png');
    bqp_imgs['bqp_MFP'] = loadImage('assets/bqps/bqp_MFP.png');
}

function setup() {
    cnv = createCanvas(957, 506);
    frameRate(30);
    setMode('menu');
    textFont(fnt);
    
    hive = {
        name: 'hive',
        slots: [],
        level: [],
        mutation: [],
        beequip: [],
        partialBee: [],
        partialBeequip: [],
        partialLevel: [],
        partialMutation: []
    };
    hexes = [];
    hexesNormal = [];
    selected = [];
    allButtons = selectAll('.beePanel div.bee-section button');

    bee_btns = [];
    bqp_btns = [];
    mut_btns = [];

    allButtons.forEach(wrappedBtn => {
        btn = wrappedBtn.elt;
        parentId = btn.parentElement.id;

        if (['bees-common', 'bees-rare', 'bees-epic', 'bees-legend', 'bees-mythic', 'bees-event'].includes(parentId)) {
            bee_btns.push(wrappedBtn);
        }
        else if (['bees-beequip', 'bees-beesmas', 'bees-unreleased'].includes(parentId)) {
            bqp_btns.push(wrappedBtn);
        }
        else if (parentId === 'bees-mutation') {
            mut_btns.push(wrappedBtn);
        }
    });

    for (const wrappedBtn of bee_btns) {
        const btn = wrappedBtn.elt;
        const code = btn.id.slice(4);
        const img = document.createElement('img');
        img.src = `assets/bico/icon_${code}.webp`;
        img.alt = '';
        img.draggable = false;
        img.onerror = () => img.style.display = 'none';
        btn.prepend(img);
    }

    const beeTooltip = document.getElementById('bee-tooltip');
    for (const wrappedBtn of bee_btns) {
        const btn = wrappedBtn.elt;
        const code = btn.id.slice(4);
        const info = BEE_INFO[code];
        if (!info) continue;
        btn.addEventListener('mouseenter', (e) => {
            beeTooltip.innerHTML = buildTooltipHTML(info);
            beeTooltip.classList.add('visible');
            positionTooltip(beeTooltip, e);
        });
        btn.addEventListener('mousemove', (e) => positionTooltip(beeTooltip, e));
        btn.addEventListener('mouseleave', () => beeTooltip.classList.remove('visible'));
    }

    for (const wrappedBtn of bqp_btns) {
        const btn = wrappedBtn.elt;
        const code = btn.id.slice(4);
        const img = document.createElement('img');
        img.src = `assets/bqps/bqp_${code}.png`;
        img.alt = '';
        img.draggable = false;
        img.onerror = () => img.style.display = 'none';
        btn.prepend(img);
        const bqpInfo = BQP_INFO[code];
        if (bqpInfo) {
            btn.addEventListener('mouseenter', (e) => {
                beeTooltip.innerHTML = buildBqpTooltipHTML(bqpInfo);
                beeTooltip.classList.add('visible');
                positionTooltip(beeTooltip, e);
            });
            btn.addEventListener('mousemove', (e) => positionTooltip(beeTooltip, e));
            btn.addEventListener('mouseleave', () => beeTooltip.classList.remove('visible'));
        }
    }

    if (_pendingHiveFromURL) {
        hive = _pendingHiveFromURL;
        hive.slots        = hive.slots        || [];
        hive.level        = hive.level        || new Array(hive.slots.length).fill(0);
        hive.mutation     = hive.mutation     || new Array(hive.slots.length).fill(null);
        hive.beequip      = hive.beequip      || new Array(hive.slots.length).fill(null);
        hive.partialBee      = hive.partialBee      || new Array(hive.slots.length).fill(null);
        hive.partialBeequip  = hive.partialBeequip  || new Array(hive.slots.length).fill(null);
        hive.partialLevel    = hive.partialLevel    || new Array(hive.slots.length).fill(null);
        hive.partialMutation = hive.partialMutation || new Array(hive.slots.length).fill(null);
        setMode('app', true);
    }

    // buttons

    // goto app
    select('#appButton-1').mouseClicked(newHive);
    select('#appButton-2').mouseClicked(loadHive);
    select('#appButton-3').mouseClicked(importText);

    // goto menu
    select('#menuButton').mouseClicked(setMode.bind(null, 'menu'));

    select('#addSlot').mouseClicked(addSlot);
    select('#removeSlot').mouseClicked(removeSlot);
    select('#changeName').mouseClicked(changeName);

    select('#saveHive').mouseClicked(saveHive);
    select('#exportImg').mouseClicked(exportImage);
    select('#exportTxt').mouseClicked(exportText);

    multSelt = createCheckbox('select (shift)')
        .parent(select('#multSeltCon'));
    
    select('#generalMax').mouseClicked(expandPanel.bind(null, 'general'));
    select('#generalMin').mouseClicked(expandPanel.bind(null, 'general', 'true'));

    select('#partialMax').mouseClicked(expandPanel.bind(null, 'partial'));
    select('#partialMin').mouseClicked(expandPanel.bind(null, 'partial', 'true'));

    select('#commonMax').mouseClicked(expandPanel.bind(null, 'common'));
    select('#commonMin').mouseClicked(expandPanel.bind(null, 'common', 'true'));

    select('#rareMax').mouseClicked(expandPanel.bind(null, 'rare'));
    select('#rareMin').mouseClicked(expandPanel.bind(null, 'rare', 'true'));

    select('#epicMax').mouseClicked(expandPanel.bind(null, 'epic'));
    select('#epicMin').mouseClicked(expandPanel.bind(null, 'epic', 'true'));

    select('#legendMax').mouseClicked(expandPanel.bind(null, 'legend'));
    select('#legendMin').mouseClicked(expandPanel.bind(null, 'legend', 'true'));

    select('#mythicMax').mouseClicked(expandPanel.bind(null, 'mythic'));
    select('#mythicMin').mouseClicked(expandPanel.bind(null, 'mythic', 'true'));

    select('#eventMax').mouseClicked(expandPanel.bind(null, 'event'));
    select('#eventMin').mouseClicked(expandPanel.bind(null, 'event', 'true'));

    select('#mutationMax').mouseClicked(expandPanel.bind(null, 'mutation'));
    select('#mutationMin').mouseClicked(expandPanel.bind(null, 'mutation', 'true'));

    select('#beequipMax').mouseClicked(expandPanel.bind(null, 'beequip'));
    select('#beequipMin').mouseClicked(expandPanel.bind(null, 'beequip', 'true'));

    select('#beesmasMax').mouseClicked(expandPanel.bind(null, 'beesmas'));
    select('#beesmasMin').mouseClicked(expandPanel.bind(null, 'beesmas', 'true'));

    select('#unreleasedMax').mouseClicked(expandPanel.bind(null, 'unreleased'));
    select('#unreleasedMin').mouseClicked(expandPanel.bind(null, 'unreleased', 'true'));

    select('#selectAll').mouseClicked(selectAllSlots);
    select('#btn-U').mouseClicked(changeSlot.bind(null, 'U', 'bee'));
    select('#btn-LVL').mouseClicked(changeSlot.bind(null, 0, 'level'));
    select('#btn-FLIP').mouseClicked(changeSlot.bind(null, 0, 'flip'));
    select('#removeBeequip').mouseClicked(changeSlot.bind(null, 0, 'removequip'));
    select('#removeMutation').mouseClicked(changeSlot.bind(null, null, 'removemut'));
    select('#clearSlot').mouseClicked(changeSlot.bind(null, 0, 'clearslot'));
    select('#clearPartial').mouseClicked(changeSlot.bind(null, 0, 'clearpartial'));
    select('#removePartialBeequip').mouseClicked(changeSlot.bind(null, null, 'removepartialquip'));
    select('#removePartialMutation').mouseClicked(changeSlot.bind(null, null, 'removepartialmut'));
    select('#btn-PLVL').mouseClicked(changeSlot.bind(null, 0, 'partiallevel'));
    select('#clearHive').mouseClicked(clearHive);
    select('#toggleLevels').mouseClicked(toggleHideLevels);
    select('#shareURL').mouseClicked(shareURL);

    gifted = createCheckbox('gifted (alt)', true)
        .id('giftedSelect')
        .parent(select('#multSeltCon'));

    document.getElementById('keybindsBtn').addEventListener('click', showKeybinds);

    initPresetPanel();
}

function draw() {
    background('#0C1626');
    // menu
    if (mode == 'menu') {
        textAlign(CENTER);
        textSize(50);
        fill(select('body').style('color'));
        let textY = height / 2 + map(sin(frameCount * 0.025), -1, 1, -20, 20);
        noStroke();
        text('Deepsea Hive Builder', width/2, textY);
        textSize(25);
        text("fork by riot (original fork by dully, original project by t4styl)", width/2, textY+35);
        select('#headerTitle').html('&nbsp&nbspDeepsea Hive Builder');
        if (getItem('hive')) {
            select('#appButton-2').attribute('data-status', 'active');
        } else {
            select('#appButton-2').attribute('data-status', 'inactive');
        }
    }
    
    // app
    if (mode == 'app') {
        select('#headerTitle').html(`&nbsp&nbspDeepsea Hive Builder - ${hive.name}`);
        drawHive(width / 2 - 140, height-17.5, 30, hive.slots, hive.level, hive.mutation, hive.beequip, hive.partialBee, hive.partialBeequip, hive.partialLevel, hive.partialMutation);
        hexes = hexes.splice(0, hive.slots.length < 25 ? 25 : hive.slots.length);
        if (hive.slots.length >= 50 || selected.length != 0) {
            select('#addSlot').attribute('disabled', '');
        } else {
            select('#addSlot').removeAttribute('disabled')
        }

        if (hive.slots.length <= 25 || selected.length != 0) {
            select('#removeSlot').attribute('disabled', '');
        } else {
            select('#removeSlot').removeAttribute('disabled');
        }

        if (selected.length != 0) {
            select('#changeName').attribute('disabled', '');
        } else {
            select('#changeName').removeAttribute('disabled');
        }

        for (const i of bee_btns) {
            i.mouseClicked(changeSlot.bind(null, i.id().slice(4), 'bee'));
        }

        for (const i of bqp_btns) {
            i.mouseClicked(changeSlot.bind(null, i.id().slice(4), 'beequip'));
        }

        for (const i of mut_btns) {
            i.mouseClicked(changeSlot.bind(null, i.id().slice(4), 'mutation'));
        }
    }
    
    if (mode == 'app' && dragging) {
        for (const [i, v] of hexes.entries()) {
            if (dist(mouseX, mouseY, v.x, v.y) <= 25) {
                if (!selected.includes(i)) {
                    selected.push(i);
                }
            }
        }
    }
}

function mouseClicked() {
    if (mode == 'app') {
        if (mouseX.between(0, 472, true) && mouseY.between(0, 563)) {
            let onSlot = false;
            for (const [i, v] of hexes.entries()) {
                if (dist(mouseX, mouseY, v.x, v.y) <= 25) {
                    if (!keyIsDown(SHIFT) && !multSelt.checked()) {
                        hexes = hexesNormal.slice();
                        selected = [];
                    }
                    onSlot = true;
                    selected.push(i);
                }
            }
            if (!onSlot && !keyIsDown(SHIFT)) {
                selected = [];
                hexes = hexesNormal.slice();
            }
        }
    }
}

function mousePressed() {
    if (mode === 'app' && keyIsDown(SHIFT)) {
        dragging = true;
    }
}

function mouseReleased() {
    if (mode === 'app') {
        dragging = false;
    }
}

Number.prototype.between = function(a, b, inclusive) {
    let min = Math.min.apply(Math, [a, b]),
        max = Math.max.apply(Math, [a, b]);
    return inclusive ? this >= min && this <= max : this > min && this < max;
};

function loadHive() {
    hive = getItem('hive');
    hive.partialBee      = hive.partialBee      || new Array(hive.slots.length).fill(null);
    hive.partialBeequip  = hive.partialBeequip  || new Array(hive.slots.length).fill(null);
    hive.partialLevel    = hive.partialLevel    || new Array(hive.slots.length).fill(null);
    hive.partialMutation = hive.partialMutation || new Array(hive.slots.length).fill(null);
    setMode('app', true);
}

async function newHive() {
    hive = {
        name: 'hive',
        slots: [],
        level: [],
        mutation: [],
        beequip: [],
        partialBee: [],
        partialBeequip: [],
        partialLevel: [],
        partialMutation: []
    };
    hexes = [];
    hexesNormal = [];
    await setMode('app');
}


async function setMode(m, loaded=false) {
    if (m == 'menu') {
        if (mode == 'app') {
            let x = madeChanges();
            if (!hiveSaved && x) {
                let leave = await showModal({ message: "are you sure? you haven't saved your hive!", type: 'confirm' });
                if (!leave) {
                    return;
                }
            }
        }
        undoStack = [];
        mode = 'menu';
        cnv.parent(select('#menu > .canvasContainer'));
        resizeCanvas(957, 506);
        cnv.style('left', '50%');
        cnv.style('transform', 'translateX(-50%)');
        select('#menu').attribute('data-status', 'active');
        select('#app').attribute('data-status', 'inactive');
    } else {
        if (!loaded) {
            let x = await showModal({ message: 'Enter hive name (max 15 chars): (this can be changed later)', type: 'prompt', defaultValue: 'hive' });
            if (!x) { return; }
            hive.name = x.substring(0, 16);

            let n = await showModal({ message: 'How many hive slots will the hive use (25-50): (this can be changed later)', type: 'prompt', defaultValue: '50' });
            if (!isNaN(n) && !isNaN(parseFloat(n))) {
                const slotCount = clamp(parseInt(n), 25, 50);
                hive.slots = new Array(slotCount).fill('U');

                // initialize other arrays to match
                hive.level = new Array(slotCount).fill(0);
                hive.mutation = new Array(slotCount).fill(null);
                hive.beequip = new Array(slotCount).fill(null);
                hive.partialBee      = new Array(slotCount).fill(null);
                hive.partialBeequip  = new Array(slotCount).fill(null);
                hive.partialLevel    = new Array(slotCount).fill(null);
                hive.partialMutation = new Array(slotCount).fill(null);
            } else {
                return;
            }
        }
        mode = 'app';
        hiveSaved = false;
        cnv.parent(select('#app > .canvasContainer'));
        resizeCanvas(472, 563);
        select('#menu').attribute('data-status', 'inactive');
        select('#app').attribute('data-status', 'active');
        if (typeof updateParticles === 'function') updateParticles(hive);
    }
}

function madeChanges() {
    if (getItem('hive')) {
        return hive.name != getItem('hive').name || hive.slots.join(';') != getItem('hive').slots.join(';');
    }
    return false;
}

function addSlot() {
    saveUndoState();
    hive.slots.push('U');
    hive.level.push(0);
    hive.mutation.push(null);
    hive.beequip.push(null);
    hive.partialBee.push(null);
    hive.partialBeequip.push(null);
    hive.partialLevel.push(null);
    hive.partialMutation.push(null);
    if (typeof updateParticles === 'function') updateParticles(hive);
}

function removeSlot() {
    saveUndoState();
    hive.slots.pop();
    hive.level.pop();
    hive.mutation.pop();
    hive.beequip.pop();
    hive.partialBee.pop();
    hive.partialBeequip.pop();
    hive.partialLevel.pop();
    hive.partialMutation.pop();
    if (typeof updateParticles === 'function') updateParticles(hive);
}

async function changeName() {
    let x = await showModal({ message: 'Enter hive name (max 15 chars):', type: 'prompt', defaultValue: 'hive' });
    if (!x) {
        return;
    }
    saveUndoState();
    hive.name = x.substring(0, 15);
}

function flashStatusText(msg) {
    const txt = select('#savedText');
    txt.elt.textContent = msg;
    txt.style('opacity', '1');
    txt.style('animation', '1s linear 0s save-fadeout');
    txt.elt.addEventListener('animationend', () => {
        txt.style('opacity', '0');
        txt.style('animation', null);
        txt.elt.textContent = 'saved!';
    }, { once: true });
}

function saveHive() {
    storeItem('hive', hive);
    hiveSaved = true;
    const customs = getCustomPresets();
    const match = customs.findIndex(p => p.name === hive.name);
    if (match !== -1) {
        customs[match] = {
            name:            hive.name,
            slots:           hive.slots.slice(),
            level:           hive.level.slice(),
            mutation:        hive.mutation.slice(),
            beequip:         hive.beequip.slice(),
            partialBee:      (hive.partialBee      || []).slice(),
            partialBeequip:  (hive.partialBeequip  || []).slice(),
            partialLevel:    (hive.partialLevel    || []).slice(),
            partialMutation: (hive.partialMutation || []).slice(),
        };
        saveCustomPresets(customs);
    }
    flashStatusText('saved!');
}

function exportImage() {
    const beeList = new Map([['U', 'Empty'], ['BA', 'Basic Bee'], ['BO', 'Bomber Bee'], ['BR', 'Brave Bee'], ['BU', 'Bumble Bee'],['CO', 'Cool Bee'], ['HA', 'Hasty Bee'], ['LO', 'Looker Bee'], ['RA', 'Rad Bee'],['RAS', 'Rascal Bee'], ['ST', 'Stubborn Bee'], ['BUB', 'Bubble Bee'], ['BUC', 'Bucko Bee'],['COM', 'Commander Bee'], ['DE', 'Demo Bee'], ['EX', 'Exhausted Bee'], ['FI', 'Fire Bee'],['FR', 'Frosty Bee'], ['HO', 'Honey Bee'], ['RAG', 'Rage Bee'], ['RI', 'Riley Bee'],['SH', 'Shocked Bee'], ['BAB', 'Baby Bee'], ['CA', 'Carpenter Bee'], ['DEM', 'Demon Bee'],['DI', 'Diamond Bee'], ['LI', 'Lion Bee'], ['MU', 'Music Bee'], ['NI', 'Ninja Bee'],['SHY', 'Shy Bee'], ['BUO', 'Buoyant Bee'], ['FU', 'Fuzzy Bee'], ['PR', 'Precise Bee'],['SP', 'Spicy Bee'], ['TA', 'Tadpole Bee'], ['VE', 'Vector Bee'], ['BE', 'Bear Bee'],['COB', 'Cobalt Bee'], ['CR', 'Crimson Bee'], ['FE', 'Festive Bee'], ['GU', 'Gummy Bee'],['PH', 'Photon Bee'], ['PU', 'Puppy Bee'], ['TAB', 'Tabby Bee'], ['VI', 'Vicious Bee'],['WI', 'Windy Bee'], ['DIG', 'Digital Bee']]);
    let pg = createGraphics(472, 613);
    const rootStyle = getComputedStyle(document.documentElement);
    pg.background(rootStyle.getPropertyValue('--bg').trim());
    pg.textSize(30);
    pg.textAlign(CENTER, CENTER);
    pg.fill(rootStyle.getPropertyValue('--text').trim());
    pg.textFont(fnt);
    pg.text(hive.name, pg.width/2, 25);
    pg.textAlign(LEFT, TOP);
    pg.textSize(10);
    pg.image(cnv, 0, 50);
    const total = new Map();
    hive.slots.forEach(i => {
        const k = i.toUpperCase();
        total.set(k, (total.get(k) || 0) + 1);
    });
    let totalSort = [...total.entries()].sort(([, A], [, B]) => B-A), offset = 20;
    totalSort.forEach(([bee, amount]) => {
        const name = beeList.get(bee) || bee;
        console.log(name);
        pg.text(`${name}: ${amount}`, 10, offset);
        offset += 15;
    });
    let fname = hive.name.replace(/[/\\?%*:|"<>]/g, '-');
    save(pg, `${fname}.png`);
}

function exportText() {
    let slotLength = hive.slots.length;
    if (!hive.level) hive.level = [];
    if (!hive.mutation) hive.mutation = [];
    if (!hive.beequip) hive.beequip = [];
    while (hive.level.length < slotLength) {
        hive.level.push(0);
    }
    while (hive.mutation.length < slotLength) {
        hive.mutation.push(null);
    }
    while (hive.beequip.length < slotLength) {
        hive.beequip.push(null);
    }
    const hiveData = {
        name: hive.name,
        slots: hive.slots,
        level: hive.level,
        mutation: hive.mutation,
        beequip: hive.beequip,
        partialBee: hive.partialBee,
        partialBeequip: hive.partialBeequip,
        partialLevel: hive.partialLevel,
        partialMutation: hive.partialMutation
    };
    const jsonStr = JSON.stringify(hiveData);
    navigator.clipboard.writeText(jsonStr).then(() => {
        flashStatusText('copied!');
    });
}

async function importText() {
    let jsonStr = await showModal({ message: 'Enter hive data:', type: 'prompt' });
    if (!jsonStr) { return; }
    try {
        const hiveData = JSON.parse(jsonStr);
        saveUndoState();
        hive.name = hiveData.name;
        hive.slots = hiveData.slots || [];
        hive.level = hiveData.level || [];
        hive.mutation = hiveData.mutation || [];
        hive.beequip = hiveData.beequip || [];
        hive.partialBee      = hiveData.partialBee      || new Array(hive.slots.length).fill(null);
        hive.partialBeequip  = hiveData.partialBeequip  || new Array(hive.slots.length).fill(null);
        hive.partialLevel    = hiveData.partialLevel    || new Array(hive.slots.length).fill(null);
        hive.partialMutation = hiveData.partialMutation || new Array(hive.slots.length).fill(null);
        setMode('app', true);
    } catch (error) {
        showModal({ message: 'Invalid hive data.', type: 'alert' });
    }
}

function expandPanel(type, collapse) {
    if (collapse == 'true') {
        select(`#${type}Max`).attribute('data-status', 'active');
        select(`#${type}Min`).attribute('data-status', 'inactive');
        select(`#bees-${type}`).attribute('data-status', 'inactive');
    } else {
        select(`#${type}Max`).attribute('data-status', 'inactive');
        select(`#${type}Min`).attribute('data-status', 'active');
        select(`#bees-${type}`).attribute('data-status', 'active');
    }
}

async function changeSlot(type, category) {
    if (hive.slots.length < 25) {
        while (hive.slots.length != 25) {
            hive.slots.push('U');
        }
    }
    saveUndoState();
    let uniqueSelected = [...new Set(selected)];
    let level = null;
    if (category === 'level') {
        let n = await showModal({ message: 'What level do you want to set the selected hive slots?', type: 'prompt', defaultValue: '20' });
        if (!n || isNaN(n)) return;
        level = clamp(parseInt(n), 1, 25);
    }
    let partialLevelVal = null;
    if (category === 'partiallevel') {
        let n = await showModal({ message: 'What partial level do you want to set the selected hive slots?', type: 'prompt', defaultValue: '20' });
        if (!n || isNaN(n)) return;
        partialLevelVal = clamp(parseInt(n), 1, 25);
    }
    const isPartial = keyIsDown(CONTROL) && (category === 'bee' || category === 'beequip' || category === 'mutation');
    for (const i of uniqueSelected) {
        if (category === 'bee') {
            if (isPartial && type !== 'U') {
                hive.partialBee[i] = (!keyIsDown(ALT) && !gifted.checked()) ? type : type.toLowerCase();
            } else {
                if (!keyIsDown(ALT) && !gifted.checked()) {
                    hive.slots[i] = type;
                } else {
                    hive.slots[i] = (type === 'U') ? 'U' : type.toLowerCase();
                }
            }
        } else if (category === 'mutation') {
            if (isPartial) {
                hive.partialMutation[i] = type;
            } else {
                hive.mutation[i] = type;
            }
        } else if (category === 'beequip') {
            if (isPartial) {
                hive.partialBeequip[i] = type;
            } else {
                hive.beequip[i] = type;
            }
        } else if (category === 'level') {
            hive.level[i] = level+0;
        } else if (category === 'partiallevel') {
            hive.partialLevel[i] = partialLevelVal;
        } else if (category === 'flip') {
            let cur = hive.slots[i];
            if (hive.slots[i] == 'U') continue;
            hive.slots[i] = (cur === cur.toUpperCase()) ? cur.toLowerCase() : cur.toUpperCase();
        } else if (category === 'removequip') {
            hive.beequip[i] = null;
        } else if (category === 'removemut') {
            hive.mutation[i] = null;
        } else if (category === 'clearslot') {
            hive.slots[i]    = 'U';
            hive.beequip[i]  = null;
            hive.mutation[i] = null;
            hive.partialBee[i]      = null;
            hive.partialBeequip[i]  = null;
            hive.partialLevel[i]    = null;
            hive.partialMutation[i] = null;
        } else if (category === 'clearpartial') {
            hive.partialBee[i]      = null;
            hive.partialBeequip[i]  = null;
            hive.partialLevel[i]    = null;
            hive.partialMutation[i] = null;
        } else if (category === 'removepartialquip') {
            hive.partialBeequip[i] = null;
        } else if (category === 'removepartialmut') {
            hive.partialMutation[i] = null;
        }
    }
    selected = [];
    hexes = hexesNormal.slice();
    if (typeof updateParticles === 'function') updateParticles(hive);
}

function toggleHideLevels() {
    hideLevels = !hideLevels;
    document.getElementById('toggleLevels').textContent = hideLevels ? 'Show Levels' : 'Hide Levels';
}

async function clearHive() {
    if (!await showModal({ message: 'Clear all bees, beequips, and mutations from every slot?', type: 'confirm' })) return;
    saveUndoState();
    const n = hive.slots.length;
    hive.slots       = new Array(n).fill('U');
    hive.mutation    = new Array(n).fill(null);
    hive.beequip     = new Array(n).fill(null);
    hive.partialBee      = new Array(n).fill(null);
    hive.partialBeequip  = new Array(n).fill(null);
    hive.partialLevel    = new Array(n).fill(null);
    hive.partialMutation = new Array(n).fill(null);
    selected = [];
    hexes = hexesNormal.slice();
    if (typeof updateParticles === 'function') updateParticles(hive);
}

function checkWindowSize() {
    if (window.innerWidth < 800 || window.innerHeight < 500) {
        sizeOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        sizeOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

window.addEventListener('load', checkWindowSize);
window.addEventListener('resize', checkWindowSize);

function showModal({ message, type = 'alert', defaultValue = '' }) {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-overlay');
        const msgEl = document.getElementById('modal-message');
        const inputEl = document.getElementById('modal-input');
        const cancelBtn = document.getElementById('modal-cancel');
        const okBtn = document.getElementById('modal-ok');

        msgEl.textContent = message;
        inputEl.style.display = type === 'prompt' ? 'block' : 'none';
        cancelBtn.style.display = type === 'alert' ? 'none' : '';
        if (type === 'prompt') inputEl.value = defaultValue;

        overlay.classList.add('active');

        function cleanup() {
            overlay.classList.remove('active');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            document.removeEventListener('keydown', onKeydown);
        }

        function onOk() {
            cleanup();
            if (type === 'prompt') resolve(inputEl.value);
            else if (type === 'confirm') resolve(true);
            else resolve();
        }

        function onCancel() {
            cleanup();
            if (type === 'confirm') resolve(false);
            else resolve(null);
        }

        function onKeydown(e) {
            if (e.key === 'Enter' || (e.key === ' ' && document.activeElement !== inputEl)) onOk();
            else if (e.key === 'Escape') type === 'alert' ? onOk() : onCancel();
        }

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        document.addEventListener('keydown', onKeydown);

        if (type === 'prompt') setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
    });
}

function selectAllSlots() {
    selected = [];
    for (let i = 0; i < hive.slots.length; i++) {
        selected.push(i);
    }
}

function saveUndoState() {
    undoStack.push(JSON.parse(JSON.stringify(hive)));
    if (undoStack.length > 20) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.parse(JSON.stringify(hive)));
    hive = undoStack.pop();
    selected = [];
    hexes = [];
    if (typeof updateParticles === 'function') updateParticles(hive);
}

function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.parse(JSON.stringify(hive)));
    hive = redoStack.pop();
    selected = [];
    hexes = [];
    if (typeof updateParticles === 'function') updateParticles(hive);
}


function copySelection() {
    if (selected.length === 0) return;
    const idx = [...new Set(selected)].sort((a, b) => a - b);
    slotClipboard = {
        slots:           idx.map(i => hive.slots[i]),
        level:           idx.map(i => hive.level[i]),
        mutation:        idx.map(i => hive.mutation[i]),
        beequip:         idx.map(i => hive.beequip[i]),
        partialBee:      idx.map(i => hive.partialBee[i]),
        partialBeequip:  idx.map(i => hive.partialBeequip[i]),
        partialLevel:    idx.map(i => hive.partialLevel[i]),
        partialMutation: idx.map(i => hive.partialMutation[i])
    };
}

function cutSelection() {
    copySelection();
    if (!slotClipboard) return;
    saveUndoState();
    for (const i of [...new Set(selected)]) {
        hive.slots[i] = 'U';
        hive.level[i] = 0;
        hive.mutation[i] = null;
        hive.beequip[i] = null;
        hive.partialBee[i]      = null;
        hive.partialBeequip[i]  = null;
        hive.partialLevel[i]    = null;
        hive.partialMutation[i] = null;
    }
    selected = [];
    hexes = hexesNormal.slice();
    if (typeof updateParticles === 'function') updateParticles(hive);
}

function pasteSelection() {
    if (!slotClipboard || selected.length === 0) return;
    saveUndoState();
    const idx = [...new Set(selected)].sort((a, b) => a - b);
    const len = slotClipboard.slots.length;
    for (let j = 0; j < idx.length; j++) {
        const i = idx[j], s = j % len;
        hive.slots[i]          = slotClipboard.slots[s];
        hive.level[i]          = slotClipboard.level[s];
        hive.mutation[i]       = slotClipboard.mutation[s];
        hive.beequip[i]         = slotClipboard.beequip[s];
        hive.partialBee[i]      = slotClipboard.partialBee      ? slotClipboard.partialBee[s]      : null;
        hive.partialBeequip[i]  = slotClipboard.partialBeequip  ? slotClipboard.partialBeequip[s]  : null;
        hive.partialLevel[i]    = slotClipboard.partialLevel    ? slotClipboard.partialLevel[s]    : null;
        hive.partialMutation[i] = slotClipboard.partialMutation ? slotClipboard.partialMutation[s] : null;
    }
    selected = [];
    hexes = hexesNormal.slice();
    if (typeof updateParticles === 'function') updateParticles(hive);
}

function getCustomPresets() {
    try { return JSON.parse(localStorage.getItem('customPresets') || '[]'); }
    catch { return []; }
}

function saveCustomPresets(arr) {
    localStorage.setItem('customPresets', JSON.stringify(arr));
}

function initPresetPanel() {
    let activeGroup = 'blue';
    const tabs = document.querySelectorAll('.preset-tab');
    const list = document.getElementById('preset-list');

    function renderPresets(group) {
        list.innerHTML = '';
        if (group === 'custom') {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'preset-btn preset-save-btn';
            saveBtn.textContent = '+ Create Preset';
            saveBtn.addEventListener('click', async () => {
                let name = await showModal({ message: 'Name this preset:', type: 'prompt', defaultValue: hive.name || 'My Preset' });
                if (!name) return;
                const customs = getCustomPresets();
                const taken = new Set(customs.map(p => p.name));
                if (taken.has(name)) {
                    let n = 2;
                    while (taken.has(`${name} ${n}`)) n++;
                    name = `${name} ${n}`;
                }
                customs.push({
                    name,
                    slots:           hive.slots.slice(),
                    level:           hive.level.slice(),
                    mutation:        hive.mutation.slice(),
                    beequip:         hive.beequip.slice(),
                    partialBee:      (hive.partialBee      || []).slice(),
                    partialBeequip:  (hive.partialBeequip  || []).slice(),
                    partialLevel:    (hive.partialLevel    || []).slice(),
                    partialMutation: (hive.partialMutation || []).slice(),
                });
                saveCustomPresets(customs);
                renderPresets('custom');
            });
            list.appendChild(saveBtn);

            for (const preset of getCustomPresets()) {
                const wrap = document.createElement('span');
                wrap.className = 'custom-preset-entry';

                const btn = document.createElement('button');
                btn.className = 'preset-btn';
                btn.textContent = preset.name;
                btn.addEventListener('click', () => {
                    const fresh = getCustomPresets().find(p => p.name === preset.name);
                    if (fresh) loadPreset(fresh);
                });

                const del = document.createElement('button');
                del.className = 'custom-preset-del';
                del.textContent = '×';
                del.addEventListener('click', async () => {
                    const ok = await showModal({ message: `Delete "${preset.name}"?`, type: 'confirm' });
                    if (!ok) return;
                    saveCustomPresets(getCustomPresets().filter(p => p.name !== preset.name));
                    renderPresets('custom');
                });

                wrap.appendChild(btn);
                wrap.appendChild(del);
                list.appendChild(wrap);
            }
            return;
        }
        for (const preset of PRESETS[group]) {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = preset.name;
            btn.addEventListener('click', () => loadPreset(preset));
            list.appendChild(btn);
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeGroup = tab.dataset.group;
            renderPresets(activeGroup);
        });
    });

    tabs.forEach(t => t.classList.toggle('active', t.dataset.group === activeGroup));
    renderPresets(activeGroup);
}

function loadPreset(preset) {
    saveUndoState();
    hive = {
        name:            preset.name,
        slots:           preset.slots.slice(),
        level:           preset.level.slice(),
        mutation:        preset.mutation.slice(),
        beequip:         preset.beequip.slice(),
        partialBee:      preset.partialBee      ? preset.partialBee.slice()      : new Array(preset.slots.length).fill(null),
        partialBeequip:  preset.partialBeequip  ? preset.partialBeequip.slice()  : new Array(preset.slots.length).fill(null),
        partialLevel:    preset.partialLevel    ? preset.partialLevel.slice()    : new Array(preset.slots.length).fill(null),
        partialMutation: preset.partialMutation ? preset.partialMutation.slice() : new Array(preset.slots.length).fill(null),
    };
    selected = [];
    hexes = [];
    hexesNormal = [];
    if (typeof updateParticles === 'function') updateParticles(hive);
}

async function shareURL() {
    const bytes = new TextEncoder().encode(JSON.stringify(hive));
    const stream = new CompressionStream('deflate-raw');
    const writer = stream.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const buf = await new Response(stream.readable).arrayBuffer();
    let binary = '';
    for (const b of new Uint8Array(buf)) binary += String.fromCharCode(b);
    const b64url = 'z' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const url = `${location.origin}${location.pathname}?hive=${b64url}`;
    await navigator.clipboard.writeText(url);
    flashStatusText('copied!');
}

function showKeybinds() {
    const overlay = document.getElementById('keybinds-overlay');
    const okBtn = document.getElementById('keybinds-ok');
    overlay.classList.add('active');

    function close() {
        overlay.classList.remove('active');
        okBtn.removeEventListener('click', close);
        document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(e) {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
            e.preventDefault();
            close();
        }
    }

    okBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKeydown);
}

function keyPressed() {
    if (mode === 'menu') {
        if (document.getElementById('modal-overlay').classList.contains('active')) return;
        if (key === 'Enter' || key === ' ') {
            hive = {
                name: 'hive',
                slots: new Array(50).fill('U'),
                level: new Array(50).fill(0),
                mutation: new Array(50).fill(null),
                beequip: new Array(50).fill(null),
                partialBee: new Array(50).fill(null),
                partialBeequip: new Array(50).fill(null),
                partialLevel: new Array(50).fill(null),
                partialMutation: new Array(50).fill(null)
            };
            hexes = [];
            hexesNormal = [];
            mode = 'app';
            hiveSaved = false;
            cnv.parent(select('#app > .canvasContainer'));
            resizeCanvas(472, 563);
            select('#menu').attribute('data-status', 'inactive');
            select('#app').attribute('data-status', 'active');
            return false;
        }
        if (key === 'i' || key === 'I') { importText(); return false; }
        if ((key === 'c' || key === 'C') && getItem('hive')) { loadHive(); return false; }
        return;
    }
    if (mode !== 'app') return;
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (key === 'Backspace') {
        if (selected.length === 0) return false;
        saveUndoState();
        const uniqueSel = [...new Set(selected)];
        if (keyIsDown(CONTROL)) {
            // Ctrl+Backspace: remove regular bee and beequip only
            for (const i of uniqueSel) {
                hive.slots[i] = 'U';
                hive.beequip[i] = null;
            }
        } else {
            const hasPartial = uniqueSel.some(i => hive.partialBee[i] != null || hive.partialBeequip[i] != null || hive.partialLevel[i] != null || hive.partialMutation[i] != null);
            if (hasPartial) {
                // First Backspace: clear all partial data
                for (const i of uniqueSel) {
                    hive.partialBee[i]      = null;
                    hive.partialBeequip[i]  = null;
                    hive.partialLevel[i]    = null;
                    hive.partialMutation[i] = null;
                }
            } else {
                // No partial: act as usual
                for (const i of uniqueSel) {
                    hive.slots[i] = 'U';
                    hive.beequip[i] = null;
                    hive.mutation[i] = null;
                }
            }
        }
        selected = [];
        hexes = hexesNormal.slice();
        return false;
    }
    if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
        if (selected.length === 0) return false;
        const delta = keyCode === UP_ARROW ? 1 : keyCode === DOWN_ARROW ? -1 : keyCode === LEFT_ARROW ? -5 : 5;
        saveUndoState();
        const uniqueSel2 = [...new Set(selected)];
        for (const i of uniqueSel2) {
            if (keyIsDown(CONTROL) && hive.partialBee[i] != null) {
                const cur = hive.partialLevel[i] != null ? hive.partialLevel[i] : (hive.level[i] || 0);
                const next = clamp(cur + delta, 0, 25);
                hive.partialLevel[i] = next === 0 ? null : next;
            } else {
                hive.level[i] = clamp((hive.level[i] || 0) + delta, 0, 25);
            }
        }
        return false;
    }
    if (!keyIsDown(CONTROL)) return;
    const k = key.toLowerCase();
    if (k === 'z' && keyIsDown(SHIFT)) { redo(); return false; }
    if (k === 'z') { undo(); return false; }
    if (k === 'a') { selectAllSlots(); return false; }
    if (k === 'c') { copySelection(); return false; }
    if (k === 'x') { cutSelection(); return false; }
    if (k === 'v') { pasteSelection(); return false; }
    if (k === 'i') { changeSlot(0, 'level'); return false; }
    if (k === 'q') { clearHive(); return false; }
    if (k === 'y') { toggleHideLevels(); return false; }
}
