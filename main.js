import * as THREE from "three";

/*
  THE LAST CHRISTMAS WISH
  A continuous, automatically playing 120-second Three.js short film.
  All main visuals are procedural. Audio hooks are intentionally optional:
  place royalty-free files in ./audio and uncomment the paths in setupAudio().
*/

const DURATION = 120;
const SEGMENTS = [
  { start: 0, end: 20, name: "A Cold Christmas Night" },
  { start: 20, end: 40, name: "The Mysterious Visitor" },
  { start: 40, end: 55, name: "The Christmas Past" },
  { start: 55, end: 75, name: "The Christmas Present" },
  { start: 75, end: 100, name: "The Christmas Future" },
  { start: 100, end: 120, name: "A New Christmas" }
];

const canvas = document.querySelector("#screen");
const titleCard = document.querySelector("#title-card");
const endCard = document.querySelector("#end-card");
const statusEl = document.querySelector("#status");

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: false, powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101827);
scene.fog = new THREE.FogExp2(0x182337, 0.018);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 180);
camera.position.set(0, 5, 16);

const hemi = new THREE.HemisphereLight(0xc5d8ff, 0x453b32, 1.35);
scene.add(hemi);
const keyLight = new THREE.DirectionalLight(0xffe4bb, 2.0);
keyLight.position.set(-7, 12, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -24; keyLight.shadow.camera.right = 24;
keyLight.shadow.camera.top = 24; keyLight.shadow.camera.bottom = -24;
scene.add(keyLight);

const clock = new THREE.Clock();
let elapsed = 0;
let audioContext = null;
let audioStarted = false;

const mats = {
  snow: new THREE.MeshStandardMaterial({ color: 0xe6edf5, roughness: 0.95 }),
  snowShade: new THREE.MeshStandardMaterial({ color: 0xb9c9d8, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x485263, roughness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x202a38, roughness: 0.92 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x654632, roughness: 0.9 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0x9a7049, roughness: 0.9 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xe8b95e, metalness: 0.35, roughness: 0.42 }),
  warm: new THREE.MeshStandardMaterial({ color: 0xffc66e, emissive: 0xff8b25, emissiveIntensity: 1.3 }),
  coat: new THREE.MeshStandardMaterial({ color: 0x202b3c, roughness: 0.92 }),
  trousers: new THREE.MeshStandardMaterial({ color: 0x303747, roughness: 1 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xd8a17d, roughness: 0.92 }),
  hair: new THREE.MeshStandardMaterial({ color: 0xadb5bd, roughness: 1 }),
  black: new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 1 }),
  red: new THREE.MeshStandardMaterial({ color: 0x9d3438, roughness: 0.85 }),
  green: new THREE.MeshStandardMaterial({ color: 0x315b45, roughness: 0.9 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf0dfbd, roughness: 0.9 }),
  blue: new THREE.MeshStandardMaterial({ color: 0x526d8b, roughness: 0.9 })
};

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extra });
}
function mesh(geo, material, parent, x=0, y=0, z=0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function group(parent, x=0, y=0, z=0) {
  const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g); return g;
}
function box(parent, w,h,d, material, x=0,y=0,z=0) {
  return mesh(new THREE.BoxGeometry(w,h,d), material, parent,x,y,z);
}
function sphere(parent, r, material, x=0,y=0,z=0, sx=1,sy=1,sz=1) {
  const m = mesh(new THREE.SphereGeometry(r, 16, 12), material, parent,x,y,z);
  m.scale.set(sx,sy,sz); return m;
}
function cylinder(parent, rt, rb, h, material, x=0,y=0,z=0, sides=12) {
  return mesh(new THREE.CylinderGeometry(rt,rb,h,sides), material,parent,x,y,z);
}
function addPointLight(parent, color, intensity, distance, x,y,z) {
  const l = new THREE.PointLight(color,intensity,distance,2);
  l.position.set(x,y,z); parent.add(l); return l;
}
function setVisible(g, v) { g.visible = v; }

function makeCharacter(parent, options = {}) {
  const {
    x=0, y=0, z=0, child=false, coatColor=0x202b3c,
    hairColor=0xadb5bd, skinColor=0xd8a17d, scarfColor=null
  } = options;
  const root = group(parent,x,y,z);
  const scale = child ? 0.68 : 1;
  const body = group(root,0,0,0);
  const coatMat = mat(coatColor);
  const skinMat = mat(skinColor);
  const hairMat = mat(hairColor);
  const headY = child ? 1.55 : 1.92;
  const bodyH = child ? 0.95 : 1.2;

  cylinder(body,0.42*scale,0.5*scale,bodyH,coatMat,0,0.92*scale,0,10);
  sphere(body,0.38*scale,skinMat,0,headY,0,1,1.08,0.9);
  // Hair cap and side locks
  sphere(body,0.39*scale,hairMat,0,headY+0.18*scale,-0.015,1,0.55,0.95);
  sphere(body,0.13*scale,hairMat,-0.34*scale,headY-0.02*scale,0,1,1.1,1);
  sphere(body,0.13*scale,hairMat,0.34*scale,headY-0.02*scale,0,1,1.1,1);
  // Nose, eyes, brows
  sphere(body,0.055*scale,skinMat,0,headY-0.03*scale,0.34*scale,1,1,1.2);
  const eyeMat = mat(0x24252a,{roughness:0.4});
  sphere(body,0.035*scale,eyeMat,-0.13*scale,headY+0.04*scale,0.33*scale);
  sphere(body,0.035*scale,eyeMat,0.13*scale,headY+0.04*scale,0.33*scale);
  const browMat = mat(child ? 0x594b43 : 0x77736e);
  box(body,0.12*scale,0.025*scale,0.025*scale,browMat,-0.13*scale,headY+0.13*scale,0.34*scale);
  box(body,0.12*scale,0.025*scale,0.025*scale,browMat,0.13*scale,headY+0.13*scale,0.34*scale);
  // Neck
  cylinder(body,0.12*scale,0.14*scale,0.18*scale,skinMat,0,headY-0.35*scale,0,10);
  // Arms with pivot groups
  const arms = [];
  for (const side of [-1,1]) {
    const pivot = group(body,side*0.43*scale,1.28*scale,0);
    cylinder(pivot,0.13*scale,0.15*scale,0.68*scale,coatMat,0,-0.31*scale,0,10).rotation.z = side*0.18;
    sphere(pivot,0.13*scale,skinMat,side*0.07*scale,-0.68*scale,0);
    arms.push(pivot);
  }
  // Legs and shoes
  const legs = [];
  for (const side of [-1,1]) {
    const leg = group(body,side*0.19*scale,0.43*scale,0);
    cylinder(leg,0.14*scale,0.16*scale,0.65*scale,mat(child?0x66534a:0x303747),0,-0.27*scale,0,9);
    box(leg,0.22*scale,0.13*scale,0.36*scale,mats.black,0,-0.58*scale,0.1*scale);
    legs.push(leg);
  }
  if (scarfColor !== null) {
    const scarf = mat(scarfColor);
    cylinder(body,0.24*scale,0.24*scale,0.13*scale,scarf,0,headY-0.39*scale,0,10);
    box(body,0.13*scale,0.45*scale,0.07*scale,scarf,0.22*scale,headY-0.62*scale,0.18*scale);
  }
  let cane = null;
  if (!child) {
    cane = cylinder(body,0.025,0.025,1.0,mats.woodLight,0.63*scale,0.53*scale,0,8);
    cane.rotation.z = -0.06;
    sphere(body,0.06,mats.gold,0.63*scale,1.04*scale,0);
  }
  return { root, body, arms, legs, cane, scale };
}

function animateCharacter(ch, t, walk=0, gesture=0) {
  const s = ch.scale;
  ch.legs[0].rotation.x = Math.sin(t*8)*0.42*walk;
  ch.legs[1].rotation.x = Math.sin(t*8+Math.PI)*0.42*walk;
  ch.arms[0].rotation.x = Math.sin(t*8+Math.PI)*0.24*walk;
  ch.arms[1].rotation.x = Math.sin(t*8)*0.24*walk;
  ch.arms[0].rotation.z = -0.08 - gesture*0.35;
  ch.arms[1].rotation.z = 0.08 + gesture*0.35;
  ch.body.position.y = Math.abs(Math.sin(t*8))*0.035*walk;
}

function makeHouse(parent,x,z,scale=1, warm=true) {
  const h = group(parent,x,0,z); h.scale.setScalar(scale);
  box(h,3.1,2.1,2.5,mat(0x75604f),0,1.05,0);
  const roof = mesh(new THREE.ConeGeometry(2.35,1.45,4),mat(0x343b49),h,0,2.75,0);
  roof.rotation.y=Math.PI/4; roof.scale.z=0.82;
  box(h,0.58,1.15,0.08,mats.wood,-0.55,0.58,1.28);
  for (const wx of [-1.05,1.05]) {
    box(h,0.58,0.65,0.08,mat(warm?0xffc978:0x43546a,{emissive:warm?0xff9c3c:0x000000,emissiveIntensity:warm?0.8:0}),wx,1.25,1.29);
    box(h,0.07,0.72,0.1,mats.wood,wx,1.25,1.34);
    box(h,0.66,0.07,0.1,mats.wood,wx,1.25,1.34);
  }
  return h;
}
function makeTree(parent,x,y,z,scale=1) {
  const t = group(parent,x,y,z); t.scale.setScalar(scale);
  cylinder(t,0.16,0.2,0.5,mats.wood,0,0.25,0,8);
  for(let i=0;i<3;i++){
    const c = mesh(new THREE.ConeGeometry(0.85-i*0.12,1.25,8),mats.green,t,0,0.95+i*0.7,0);
    c.rotation.y=0.3*i;
  }
  const star = mesh(new THREE.OctahedronGeometry(0.22),mats.gold,t,0,3.0,0);
  addPointLight(t,0xffc66e,1.1,5,0,2.2,0);
  for(let i=0;i<9;i++){
    const a=i*2.4, y0=0.65+(i%3)*0.65, r=0.68-(i%3)*0.12;
    sphere(t,0.07,i%2?mats.red:mats.gold,Math.cos(a)*r,y0,Math.sin(a)*r);
  }
  return t;
}
function makeSnow(parent, count=450, area=24, height=12) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count*3);
  const speeds = new Float32Array(count);
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-0.5)*area;
    positions[i*3+1]=Math.random()*height;
    positions[i*3+2]=(Math.random()-0.5)*area;
    speeds[i]=0.5+Math.random()*1.2;
  }
  geo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  const points = new THREE.Points(geo,new THREE.PointsMaterial({color:0xf2f6ff,size:0.075,transparent:true,opacity:0.82}));
  parent.add(points);
  return {points,speeds,area,height};
}
function updateSnow(snow,dt){
  const p=snow.points.geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    p.array[i*3+1]-=snow.speeds[i]*dt;
    p.array[i*3]+=Math.sin(elapsed*0.7+i)*dt*0.12;
    if(p.array[i*3+1]<0){p.array[i*3+1]=snow.height;p.array[i*3]=(Math.random()-0.5)*snow.area;}
  }
  p.needsUpdate=true;
}
function ground(parent, color=0xdce6ef, size=80) {
  const g=mesh(new THREE.PlaneGeometry(size,size),mat(color),parent,0,-0.08,0);
  g.rotation.x=-Math.PI/2; g.receiveShadow=true; return g;
}
function createSceneRoot() { const g=group(scene); g.visible=false; return g; }

const scenes = Array.from({length:6},()=>createSceneRoot());
const snowSystems = [];
const sceneLights = [];

// SCENE 1: Snowy Victorian town
{
  const s=scenes[0]; ground(s,0xcbd7e3,90);
  s.background = null;
  for(let i=0;i<7;i++){
    makeHouse(s,-12+i*4, -5-(i%2)*2,0.82+(i%3)*0.08,i%2===0);
    makeHouse(s,-11+i*4, 5+(i%2)*2,0.72+(i%2)*0.12,true);
  }
  for(let i=0;i<5;i++){
    const lamp=group(s,-9+i*4,0,1.5);
    cylinder(lamp,0.06,0.08,2.8,mats.black,0,1.4,0,8);
    box(lamp,0.42,0.42,0.42,mats.warm,0,2.9,0);
    addPointLight(lamp,0xffbf70,1.5,7,0,2.8,0);
  }
  makeTree(s,-7,0,-1,0.9);
  const ed=makeCharacter(s,{x:0,z:1,coatColor:0x1d2736}); ed.root.scale.setScalar(1.08);
  const child=makeCharacter(s,{x:5,z:2,child:true,coatColor:0x8b3e3b,scarfColor:0xe5b75e});
  const crowd=[];
  for(let i=0;i<5;i++) crowd.push(makeCharacter(s,{x:-8+i*3.8,z:-3.5,child:i%2===0,coatColor:[0x526d8b,0x7c493d,0x435a49][i%3],scarfColor:0xc99a5a}));
  snowSystems.push(makeSnow(s,520,34,15));
  s.userData={ed,child,crowd};
}
// SCENE 2: Edward's study and spirit
{
  const s=scenes[1]; s.background=null;
  box(s,18,8,0.5,mat(0x263348),0,4,-3);
  box(s,18,0.25,12,mats.wood,0,0,-1);
  // bookshelves
  for(let side of [-1,1]){
    box(s,3.0,5.4,0.55,mats.wood,side*6.4,2.7,-1.9);
    for(let row=0;row<4;row++){
      box(s,2.8,0.12,0.7,mats.woodLight,side*6.4,0.9+row*1.05,-1.45);
      for(let b=0;b<7;b++) box(s,0.22,0.7,0.35,mat([0x7d3f3b,0x35546b,0x9b7748,0x3f604d][(b+row)%4]),side*6.4-1.1+b*0.36,1.32+row*1.05,-1.65);
    }
  }
  // fireplace
  box(s,3.3,2.7,0.7,mat(0x51443e),-3.8,1.35,-1.8);
  box(s,2.1,1.4,0.15,mat(0x17191e),-3.8,0.85,-1.38);
  const fire=group(s,-3.8,0.55,-1.15);
  for(let i=0;i<5;i++){
    const f=mesh(new THREE.ConeGeometry(0.25,0.85,7),mat(i%2?0xff9c35:0xffd16d,{emissive:0xff6b19,emissiveIntensity:1.6}),fire,(i-2)*0.28,0.45+Math.random()*0.15,0);
    f.rotation.z=(Math.random()-.5)*0.45;
  }
  const fireLight=addPointLight(s,0xff8a32,2.2,9,-3.8,1.2,0);
  box(s,2.5,0.7,1.2,mats.wood,0,0.45,2.0);
  const ed=makeCharacter(s,{x:0,z:0.8}); ed.root.rotation.y=-0.15;
  const spirit=group(s,3.2,2.6,-0.1);
  const glow=mat(0xffd98b,{emissive:0xffb52e,emissiveIntensity:2.2,transparent:true,opacity:0.88});
  sphere(spirit,0.42,glow,0,0.5,0,0.9,1.3,0.75);
  sphere(spirit,0.25,glow,0,1.15,0,1,1,0.9);
  sphere(spirit,0.035,mat(0x4c3922),-0.09,1.18,0.22);
  sphere(spirit,0.035,mat(0x4c3922),0.09,1.18,0.22);
  const halo=mesh(new THREE.TorusGeometry(0.8,0.035,8,40),mats.gold,spirit,0,0.5,0);
  halo.rotation.x=Math.PI/2;
  const spiritLight=addPointLight(spirit,0xffc45d,2.8,10,0,0.8,0);
  const particles=makeSnow(spirit,90,5,4);
  s.userData={ed,spirit,spiritLight,fire,fireLight,particles};
}
// SCENE 3: Past classroom
{
  const s=scenes[2]; ground(s,0x9c896e,35);
  box(s,18,8,0.4,mat(0xb78d61),0,4,-3);
  for(let i=0;i<4;i++){
    box(s,2.0,1.2,0.15,mat(0xf4d59c),-6+i*4,4.8,-2.72);
    box(s,0.08,1.2,0.18,mats.wood,-6+i*4,4.8,-2.6);
    box(s,2.0,0.08,0.18,mats.wood,-6+i*4,4.8,-2.6);
  }
  for(let i=0;i<3;i++){
    box(s,2.1,0.16,0.9,mats.woodLight,-4+i*4,1.4,0);
    box(s,0.13,1.3,0.13,mats.wood,-4.8+i*4,0.7,-0.1);
    box(s,0.13,1.3,0.13,mats.wood,-3.2+i*4,0.7,-0.1);
  }
  const young=makeCharacter(s,{x:0,z:0.5,child:true,coatColor:0x526d8b,hairColor:0x9c9c91});
  const adult=makeCharacter(s,{x:4,z:2,coatColor:0x202b3c});
  const memory=group(s,-4,0,-2);
  makeTree(memory,0,0,0,0.75);
  for(let i=0;i<3;i++) makeCharacter(memory,{x:-2+i*2,z:1,child:i!==1,coatColor:[0x8a433e,0x46634c,0x526d8b][i]});
  const warmLight=addPointLight(s,0xffc47a,2.2,20,0,6,3);
  s.userData={young,adult,memory,warmLight};
}
// SCENE 4: Humble family home
{
  const s=scenes[3]; ground(s,0x765f4c,30);
  box(s,18,8,0.5,mat(0x5a493f),0,4,-3);
  makeTree(s,-6,0,-0.2,0.9);
  box(s,3.5,0.28,1.8,mats.wood,0,1.0,0);
  for(let i=0;i<4;i++){
    const p=makeCharacter(s,{x:-2.6+i*1.75,z:1.5,child:i===1||i===3,coatColor:[0x8b403a,0x526d8b,0x49664f,0x8b7147][i]});
    p.root.rotation.y=(i-1.5)*0.16;
  }
  // simple meal props
  for(let i=0;i<4;i++){
    sphere(s,0.22,mats.cream,-2.5+i*1.65,1.22,0.95,1,0.3,1);
    sphere(s,0.1,mat(0x9a573d),-2.5+i*1.65,1.3,0.95,1,0.5,1);
  }
  const ed=makeCharacter(s,{x:5.1,z:2.4,coatColor:0x202b3c});
  const firebox=box(s,2.8,2.4,0.5,mat(0x4b3d35),-6,1.2,-2);
  box(s,1.7,1.25,0.1,mat(0x1c1b1b),-6,0.8,-1.7);
  const fl=addPointLight(s,0xffa34b,2.3,9,-6,1.1,-1);
  makeTree(s,7,0,-1,0.65);
  s.userData={ed,fl};
}
// SCENE 5: Quiet cemetery, reflective not graphic
{
  const s=scenes[4]; ground(s,0x9da8b6,60);
  s.background=null;
  for(let i=0;i<7;i++){
    const trunk=cylinder(s,0.12,0.2,4,mat(0x343b42),-10+i*3,2,-4-(i%2)*2,7);
    trunk.rotation.z=(i%2?-.16:.16);
    for(let j=0;j<3;j++){
      const branch=cylinder(s,0.055,0.1,2.0,mat(0x343b42),-10+i*3+(j-1)*0.45,3.1,-4-(i%2)*2,6);
      branch.rotation.z=(j-1)*0.55;
    }
  }
  const grave=group(s,0,0,-1);
  box(grave,1.4,1.3,0.35,mat(0x68727e),0,0.68,0);
  const top=mesh(new THREE.SphereGeometry(0.7,12,8,0,Math.PI*2,0,Math.PI/2),mat(0x68727e),grave,0,1.3,0);
  box(grave,0.12,0.75,0.08,mats.snowShade,0,0.8,0.2);
  box(grave,0.48,0.12,0.08,mats.snowShade,0,0.9,0.2);
  const ed=makeCharacter(s,{x:-3,z:1.5,coatColor:0x202b3c});
  const spirit=group(s,3,2.5,-1);
  const spiritMat=mat(0x8b9caf,{emissive:0x5c7697,emissiveIntensity:0.8,transparent:true,opacity:0.72});
  sphere(spirit,0.45,spiritMat,0,0.4,0,0.9,1.4,0.75);
  sphere(spirit,0.25,spiritMat,0,1.1,0);
  addPointLight(spirit,0x8ba9d4,1.7,8,0,0.8,0);
  snowSystems.push(makeSnow(s,420,28,13));
  s.userData={ed,grave,spirit};
}
// SCENE 6: Morning redemption
{
  const s=scenes[5]; ground(s,0xd8e3ec,90);
  for(let i=0;i<7;i++){
    makeHouse(s,-12+i*4,-5-(i%2)*2,0.82+(i%3)*0.08,true);
    makeHouse(s,-11+i*4,5+(i%2)*2,0.72+(i%2)*0.12,true);
  }
  makeTree(s,-7,0,-1,0.9);
  const ed=makeCharacter(s,{x:0,z:1,coatColor:0x202b3c});
  const towns=[];
  for(let i=0;i<4;i++) towns.push(makeCharacter(s,{x:-5+i*3.2,z:2.8,child:i%2===0,coatColor:[0x8b403a,0x526d8b,0x49664f,0x8b7147][i]}));
  const gifts=group(s,1.2,0.2,1.4);
  for(let i=0;i<3;i++){
    const g=box(gifts,0.55,0.5,0.5,i%2?mats.red:mats.green,(i-1)*0.62,0.25,0);
    box(gifts,0.09,0.53,0.52,mats.gold,(i-1)*0.62,0.25,0);
    box(gifts,0.56,0.08,0.52,mats.gold,(i-1)*0.62,0.25,0);
  }
  const sunrise=addPointLight(s,0xffd28b,2.8,35,-7,8,-5);
  snowSystems.push(makeSnow(s,300,32,14));
  s.userData={ed,towns,gifts,sunrise};
}

// subtle vignette / fog backdrop settings per scene
function smooth(a,b,x){ const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); }
function mix(a,b,t){ return a+(b-a)*t; }
function cameraPose(t, sceneIndex) {
  const local=t-SEGMENTS[sceneIndex].start;
  const poses=[
    {from:[0,5,18],to:[0,3,0],look:[0,1.7,0]},
    {from:[7,4.5,13],to:[0,3.6,7],look:[0,1.8,0]},
    {from:[-1,4,13],to:[0,2.7,5],look:[0,1.5,0]},
    {from:[7,4.5,13],to:[1,3.0,5],look:[0,1.5,0]},
    {from:[-7,5,15],to:[0,3.2,6],look:[0,1.5,0]},
    {from:[0,6,19],to:[0,4,0],look:[0,1.8,0]}
  ];
  const p=poses[sceneIndex];
  const k=sceneIndex===0?local/20:local/(SEGMENTS[sceneIndex].end-SEGMENTS[sceneIndex].start);
  const drift=Math.sin(local*0.22)*0.45;
  const from=new THREE.Vector3(...p.from), to=new THREE.Vector3(...p.to);
  const pos=from.lerp(to,smooth(0,1,k));
  pos.x+=drift;
  camera.position.lerp(pos,0.06);
  camera.lookAt(p.look[0]+drift*0.25,p.look[1],p.look[2]);
}

function sceneOne(t,dt){
  const s=scenes[0],{ed,child,crowd}=s.userData;
  const local=t;
  ed.root.position.x=mix(2.6,-1.1,smooth(2,18,local));
  ed.root.position.z=1.8;
  animateCharacter(ed,t,local<17?0.65:0.08,0);
  child.root.position.x=mix(5.5,2.4,smooth(8,11,local));
  child.root.rotation.y=local>10?-0.45:0;
  animateCharacter(child,t,0.1,local>10&&local<14?0.5:0);
  crowd.forEach((c,i)=>{animateCharacter(c,t+i,0.25,0);c.root.position.x+=Math.sin(t*.4+i)*0.002;});
}
function sceneTwo(t,dt){
  const {ed,spirit,spiritLight,fire,fireLight,particles}=scenes[1].userData;
  animateCharacter(ed,t,0, t>25?0.6:0.05);
  ed.body.rotation.y=Math.sin(t*.7)*.04;
  const appear=smooth(22,27,t)*(1-smooth(38,40,t));
  spirit.visible=appear>0.01;
  spirit.position.y=2.2+Math.sin(t*1.8)*.18;
  spirit.scale.setScalar(appear);
  spirit.rotation.y=Math.sin(t*.6)*.18;
  spiritLight.intensity=2.8*appear;
  fire.rotation.z=Math.sin(t*9)*.035;
  fireLight.intensity=2+Math.sin(t*12)*.3;
  updateSnow(particles,dt);
}
function sceneThree(t,dt){
  const {young,adult,memory}=scenes[2].userData;
  animateCharacter(young,t,0.03,0);
  animateCharacter(adult,t,0,0);
  adult.root.position.x=4+Math.sin(t*.6)*.08;
  memory.visible=t>43;
  memory.scale.setScalar(smooth(42,46,t));
  young.body.rotation.y=Math.sin(t)*.08;
}
function sceneFour(t,dt){
  const {ed,fl}=scenes[3].userData;
  animateCharacter(ed,t,0,0.7*smooth(61,72,t));
  ed.root.position.x=mix(5.1,3.8,smooth(62,74,t));
  ed.root.rotation.y=-0.35;
  fl.intensity=2.1+Math.sin(t*8)*.2;
}
function sceneFive(t,dt){
  const {ed,grave,spirit}=scenes[4].userData;
  animateCharacter(ed,t,0,0.95*smooth(88,97,t));
  ed.root.position.x=mix(-3, -0.8,smooth(83,97,t));
  ed.root.rotation.y=mix(0,0.25,smooth(90,97,t));
  spirit.position.y=2.2+Math.sin(t)*.12;
  grave.rotation.y=Math.sin(t*.3)*.025;
}
function sceneSix(t,dt){
  const {ed,towns,gifts,sunrise}=scenes[5].userData;
  animateCharacter(ed,t,0.18,0.9*smooth(105,113,t));
  ed.root.position.x=mix(0,1.0,smooth(105,114,t));
  towns.forEach((c,i)=>{animateCharacter(c,t+i,0.18,0.35);});
  gifts.position.y=.2+Math.sin(t*2)*.04;
  sunrise.intensity=2.3+Math.sin(t*.5)*.2;
}

function updateAnimation(t,dt){
  let index=SEGMENTS.findIndex(seg=>t>=seg.start && t<seg.end);
  if(index<0) index=5;
  scenes.forEach((s,i)=>setVisible(s,i===index));
  cameraPose(t,index);
  switch(index){
    case 0: sceneOne(t,dt); break;
    case 1: sceneTwo(t,dt); break;
    case 2: sceneThree(t,dt); break;
    case 3: sceneFour(t,dt); break;
    case 4: sceneFive(t,dt); break;
    case 5: sceneSix(t,dt); break;
  }
  // Cross-fade scene ambience through fog/background tone.
  const colors=[0x172437,0x111c2d,0x9d805f,0x5b4032,0x172234,0x8ca4ba];
  const target=new THREE.Color(colors[index]);
  if(index===2 || index===3 || index===5) scene.background=target;
  else scene.background=target;
  scene.fog.color.copy(target);
  scene.fog.density=index===4?0.028:0.016;
  // Keep snow systems moving only while their scene is active.
  if(index===0 || index===4 || index===5) {
    const snowIndex=index===0?0:(index===4?1:2);
    if(snowSystems[snowIndex]) updateSnow(snowSystems[snowIndex],dt);
  }
  const fadeIn=smooth(0,2,t);
  const fadeOut=1-smooth(117,120,t);
  renderer.toneMappingExposure=mix(0.72,1.12,fadeIn)*fadeOut+0.05;
  if(t<4) titleCard.style.opacity=String(1-smooth(1.5,4,t));
  else titleCard.style.opacity="0";
  if(t>116) endCard.style.opacity=String(smooth(116,119,t));
  else endCard.style.opacity="0";
  if(t>=DURATION) {
    endCard.style.opacity="1";
    statusEl.style.opacity="0";
  } else {
    statusEl.textContent=SEGMENTS[index].name;
    statusEl.style.opacity=t>4?"0.68":"0";
  }
}

function setupAudio(){
  // Optional local audio integration. Add royalty-free files to ./audio:
  // const music = new Audio("./audio/christmas-score.mp3");
  // music.loop = false; music.volume = 0.32;
  // document.addEventListener("pointerdown", () => music.play().catch(()=>{}), { once:true });
  // Browsers may block autoplay; visuals never depend on audio.
  // A soft synthesized bell cue can be enabled after user gesture:
  document.addEventListener("pointerdown", () => {
    if(audioStarted) return;
    audioStarted=true;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const playBell=(freq,when)=>{
        const osc=audioContext.createOscillator(), gain=audioContext.createGain();
        osc.type="sine"; osc.frequency.value=freq;
        gain.gain.setValueAtTime(0.0001,when);
        gain.gain.exponentialRampToValueAtTime(0.045,when+0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001,when+1.3);
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.start(when); osc.stop(when+1.35);
      };
      playBell(880,audioContext.currentTime);
      playBell(1174,audioContext.currentTime+0.18);
    } catch(e) { /* audio is optional */ }
  },{once:true});
}
setupAudio();

function renderAnimation(){
  const dt=Math.min(clock.getDelta(),0.05);
  if(elapsed<DURATION) elapsed=Math.min(DURATION,elapsed+dt);
  updateAnimation(elapsed,dt);
  renderer.render(scene,camera);
  requestAnimationFrame(renderAnimation);
}

function resize(){
  const w=window.innerWidth,h=window.innerHeight;
  camera.aspect=w/h;
  camera.fov=h>w?52:42;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
  renderer.setSize(w,h,false);
}
window.addEventListener("resize",resize);
window.addEventListener("orientationchange",()=>setTimeout(resize,150));

try {
  statusEl.textContent="The film is beginning…";
  renderAnimation();
} catch(error) {
  console.error(error);
  statusEl.textContent="Unable to start WebGL. Please try a modern browser.";
}
