const _origGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, attrs) {
    if (type === '2d') attrs = { ...attrs, willReadFrequently: true };
    return _origGetContext.call(this, type, attrs);
};

let mode, cnv, fnt, hive, hiveSaved, hexes, hexesNormal, selected, multSelt, gifted, bee_btns, bqp_btns, mut_btns, dragging=false;
let undoStack = [];
let slotClipboard = null;
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
        { name: 'RBC Blue Hive',      data: '' },
    ],
    alts: [
        { name: 'Fuzzy Alt',          data: '' },
        { name: 'Tad Alt',            data: '' },
        { name: 'Buoyant Alt',        data: '' },
        { name: 'Blue-Guide Alt',     data: '' },
        { name: 'Guide Alt',          data: '' },
        { name: 'Attack Alt',         data: '' },
        { name: 'Mondo Attack Alt',   data: '' },
        { name: 'Guide-Fuzzy Alt',    data: '' },
        { name: 'Guide-Buo Alt',      data: '' },
        { name: 'Tri-Hybrid Alt',     data: '' },
        { name: 'Tetra-Hybrid Alt',   data: '' },
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
        beequip: []
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

    for (const wrappedBtn of bqp_btns) {
        const btn = wrappedBtn.elt;
        const code = btn.id.slice(4);
        const img = document.createElement('img');
        img.src = `assets/bqps/bqp_${code}.png`;
        img.alt = '';
        img.draggable = false;
        img.onerror = () => img.style.display = 'none';
        btn.prepend(img);
    }

    if (_pendingHiveFromURL) {
        hive = _pendingHiveFromURL;
        hive.slots    = hive.slots    || [];
        hive.level    = hive.level    || new Array(hive.slots.length).fill(0);
        hive.mutation = hive.mutation || new Array(hive.slots.length).fill(null);
        hive.beequip  = hive.beequip  || new Array(hive.slots.length).fill(null);
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
    select('#clearHive').mouseClicked(clearHive);
    select('#toggleLevels').mouseClicked(toggleHideLevels);
    select('#shareURL').mouseClicked(shareURL);

    gifted = createCheckbox('gifted (alt)', true)
        .id('giftedSelect')
        .parent(select('#multSeltCon'));

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
        drawHive(width / 2 - 140, height-17.5, 30, hive.slots, hive.level, hive.mutation, hive.beequip);
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
    setMode('app', true);
}

async function newHive() {
    hive = {
        name: 'hive',
        slots: [],
        level: [],
        mutation: [],
        beequip: []
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
}

function removeSlot() {
    saveUndoState();
    hive.slots.pop();
    hive.level.pop();
    hive.mutation.pop();
    hive.beequip.pop();
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
            name:     hive.name,
            slots:    hive.slots.slice(),
            level:    hive.level.slice(),
            mutation: hive.mutation.slice(),
            beequip:  hive.beequip.slice(),
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
        beequip:hive.beequip
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
    for (const i of uniqueSelected) {
        if (category === 'bee') {
            if (!keyIsDown(ALT) && !gifted.checked()) {
                hive.slots[i] = type;
            } else {
                hive.slots[i] = (type === 'U') ? 'U' : type.toLowerCase();
            }
        } else if (category === 'mutation') {
            hive.mutation[i] = type;
        } else if (category === 'beequip') {
            hive.beequip[i] = type;
        } else if (category === 'level') {
            hive.level[i] = level+0;
        } else if (category === 'flip') {
            let cur = hive.slots[i];
            if (hive.slots[i] == 'U') continue;
            hive.slots[i] = (cur === cur.toUpperCase()) ? cur.toLowerCase() : cur.toUpperCase();
        } else if (category === 'removequip') {
            hive.beequip[i] = null;
        } else if (category === 'removemut') {
            hive.mutation[i] = null;
        }
    }
    selected = [];
    hexes = hexesNormal.slice();
}

function toggleHideLevels() {
    hideLevels = !hideLevels;
    document.getElementById('toggleLevels').textContent = hideLevels ? 'Show Levels' : 'Hide Levels';
}

async function clearHive() {
    if (!await showModal({ message: 'Clear all bees, beequips, and mutations from every slot?', type: 'confirm' })) return;
    saveUndoState();
    const n = hive.slots.length;
    hive.slots = new Array(n).fill('U');
    hive.mutation = new Array(n).fill(null);
    hive.beequip = new Array(n).fill(null);
    selected = [];
    hexes = hexesNormal.slice();
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
}

function undo() {
    if (undoStack.length === 0) return;
    hive = undoStack.pop();
    selected = [];
    hexes = [];
}

function copySelection() {
    if (selected.length === 0) return;
    const idx = [...new Set(selected)].sort((a, b) => a - b);
    slotClipboard = {
        slots:    idx.map(i => hive.slots[i]),
        level:    idx.map(i => hive.level[i]),
        mutation: idx.map(i => hive.mutation[i]),
        beequip:  idx.map(i => hive.beequip[i])
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
    }
    selected = [];
    hexes = hexesNormal.slice();
}

function pasteSelection() {
    if (!slotClipboard || selected.length === 0) return;
    saveUndoState();
    const idx = [...new Set(selected)].sort((a, b) => a - b);
    const len = slotClipboard.slots.length;
    for (let j = 0; j < idx.length; j++) {
        const i = idx[j], s = j % len;
        hive.slots[i]    = slotClipboard.slots[s];
        hive.level[i]    = slotClipboard.level[s];
        hive.mutation[i] = slotClipboard.mutation[s];
        hive.beequip[i]  = slotClipboard.beequip[s];
    }
    selected = [];
    hexes = hexesNormal.slice();
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
                    slots:    hive.slots.slice(),
                    level:    hive.level.slice(),
                    mutation: hive.mutation.slice(),
                    beequip:  hive.beequip.slice(),
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
        name:     preset.name,
        slots:    preset.slots.slice(),
        level:    preset.level.slice(),
        mutation: preset.mutation.slice(),
        beequip:  preset.beequip.slice(),
    };
    selected = [];
    hexes = [];
    hexesNormal = [];
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

function keyPressed() {
    if (mode === 'menu') {
        if (document.getElementById('modal-overlay').classList.contains('active')) return;
        if (key === 'Enter' || key === ' ') {
            hive = {
                name: 'hive',
                slots: new Array(50).fill('U'),
                level: new Array(50).fill(0),
                mutation: new Array(50).fill(null),
                beequip: new Array(50).fill(null)
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
        for (const i of [...new Set(selected)]) {
            hive.slots[i] = 'U';
            hive.beequip[i] = null;
            hive.mutation[i] = null;
        }
        selected = [];
        hexes = hexesNormal.slice();
        return false;
    }
    if (!keyIsDown(CONTROL)) return;
    const k = key.toLowerCase();
    if (k === 'z') { undo(); return false; }
    if (k === 'a') { selectAllSlots(); return false; }
    if (k === 'c') { copySelection(); return false; }
    if (k === 'x') { cutSelection(); return false; }
    if (k === 'v') { pasteSelection(); return false; }
    if (k === 'i') { changeSlot(0, 'level'); return false; }
    if (k === 'q') { clearHive(); return false; }
    if (k === 'y') { toggleHideLevels(); return false; }
}
