
  (function(){
    'use strict';
    if(!window.THREE || !THREE.OrbitControls){document.getElementById('loading').style.display='none';document.getElementById('error').style.display='grid';return;}
    var host=document.getElementById('world'), labelsWrap=document.getElementById('labels'),reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scene=new THREE.Scene();scene.background=new THREE.Color(0x9fc6d2);scene.fog=new THREE.FogExp2(0x9fc6d2,.0026);
    var camera=new THREE.PerspectiveCamera(42,host.clientWidth/Math.max(1,host.clientHeight),.1,1200);camera.position.set(90,70,98);
    var renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,host.clientWidth<700?1.2:1.45));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.84;host.appendChild(renderer.domElement);
    var controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=18;controls.maxDistance=300;controls.maxPolarAngle=Math.PI*.46;controls.target.set(2,3,1);controls.autoRotate=true;controls.autoRotateSpeed=.45;controls.enablePan=true;controls.screenSpacePanning=true;controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
    var hemi=new THREE.HemisphereLight(0xeef4df,0x294332,1.05);scene.add(hemi);var sun=new THREE.DirectionalLight(0xffe9b7,2.15);sun.position.set(-44,76,38);sun.castShadow=true;sun.shadow.mapSize.set(host.clientWidth<700?768:1024,host.clientWidth<700?768:1024);sun.shadow.camera.left=-84;sun.shadow.camera.right=84;sun.shadow.camera.top=84;sun.shadow.camera.bottom=-84;sun.shadow.bias=-.00025;scene.add(sun);
    var seed=88421;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
    function mat(c,rough,metal){return new THREE.MeshStandardMaterial({color:c,roughness:rough===undefined?.82:rough,metalness:metal||0});}
    function terrainTexture(base,dark,light){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,128,128);for(var i=0;i<760;i++){g.globalAlpha=.12+rnd()*.22;g.fillStyle=rnd()>.5?dark:light;var x=rnd()*128,y=rnd()*128,s=.35+rnd()*1.7;g.fillRect(x,y,s,s*(1.2+rnd()*2.4));}g.globalAlpha=1;var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(11,11);t.anisotropy=4;return t;}
    var grassTex=terrainTexture('#5f8c54','#284f35','#a2bb70'),pathTex=terrainTexture('#b28d59','#76532e','#e1ca8f');
    var M={grass:new THREE.MeshStandardMaterial({color:0xffffff,map:grassTex,roughness:1}),grass2:mat(0x315f38,.98),sand:mat(0xcbae69,1),soil:mat(0x745030,1),path:new THREE.MeshStandardMaterial({color:0xffffff,map:pathTex,roughness:1}),wood:mat(0x55321f,.9),dark:mat(0x10291d,.82),cream:mat(0xe7d9bc,.95),white:mat(0xeee9d9,.9),pink:mat(0xfe517e,.55,.05),gold:mat(0xcf941d,.48,.35),red:mat(0x96331f,.8),orange:mat(0xc84f26,.78),green:mat(0x356744,.9),slate:mat(0x2f4657,.8),purple:mat(0x654585,.75),poidhBlue:mat(0x1769aa,.72),poidhNavy:mat(0x0b345b,.82),poidhOrange:mat(0xf47a24,.66),galleryGold:mat(0xf1c40f,.5,.3),teal:mat(0x35b5ac,.68),maroon:mat(0x3c0010,.82),vault:mat(0x3d405b,.85),stone:mat(0x718278,.98),glass:new THREE.MeshPhysicalMaterial({color:0x74b7c5,transparent:true,opacity:.56,roughness:.12,metalness:.08}),water:new THREE.MeshPhysicalMaterial({color:0x398696,transparent:true,opacity:.92,roughness:.2,metalness:.08})};
    function mesh(g,m,x,y,z,cast){var o=new THREE.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.castShadow=cast!==false;o.receiveShadow=true;scene.add(o);return o;}
    // Animated low-poly water: two wave fields slide at different speeds without moving the island.
    var waterMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:{uTime:{value:0},uDev:{value:.55},uDeep:{value:new THREE.Color(0x2d7185)},uShallow:{value:new THREE.Color(0x6fc2c1)},uLight:{value:new THREE.Color(0xc5ebe3)}},vertexShader:'uniform float uTime; uniform float uDev; varying float vWave; varying vec2 vPos; float ringDev(vec2 p,float r){float an=atan(p.y,p.x); return sin(an*3.0+1.7)*2.4+sin(an*7.0-r*.045+.6)*1.7+sin(an*11.0+r*.11+2.9)*1.2;} void main(){vec3 p=position; float r=length(p.xy); float rr=max(r+uDev*ringDev(p.xy,r),0.0); float a=sin(rr*.38-uTime*1.25); float b=sin(rr*.13-uTime*.62); p.z+=(a*.3+b*.18); vWave=a*.6+b*.4; vPos=p.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',fragmentShader:'uniform float uTime; uniform float uDev; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uLight; varying float vWave; varying vec2 vPos; float ringDev(vec2 p,float r){float an=atan(p.y,p.x); return sin(an*3.0+1.7)*2.4+sin(an*7.0-r*.045+.6)*1.7+sin(an*11.0+r*.11+2.9)*1.2;} void main(){float r=length(vPos); float rr=max(r+uDev*ringDev(vPos,r),0.0); float band=.5+.5*sin(rr*.55-uTime*1.9+vWave*1.3); vec3 c=mix(uDeep,uShallow,.48+.18*vWave); c=mix(c,uLight,smoothstep(.82,1.0,band)*.3); gl_FragColor=vec4(c,.94);}'});
    var water=mesh(new THREE.CircleGeometry(340,110),waterMat,0,-2.5,0,false);water.rotation.x=-Math.PI/2;
    // The illustrated New Eden island is a hand-drawn organic slab: a squarish plateau whose coast bulges, pinches and leans instead of tracing geometry. One radial function of angle is the single source of truth for that funky footprint: it draws the extruded slabs and the foam ring, and its distance field drives the terrain falloff and every scatter placement, so all layers share the exact same shoreline. The lobe reaching southwest gives Auctobot's shore its room, the pinch at due south keeps the coast hand-drawn, and the pier tip lands right at the waterline.
    function coastR(a){return 55.3-4.97*Math.cos(4*a-.095)+4.63*Math.cos(2*a-1.249)+5.96*Math.sin(3*a+3.351)+2.04*Math.sin(5*a+3.972)+1.62*Math.sin(7*a+4.839)+.56*Math.sin(11*a+2.685)+1.05*Math.sin(6*a+5.65)+.8*Math.sin(9*a+2.2)+.55*Math.cos(14*a+1.1)+.38*Math.sin(21*a+4.4)+.26*Math.sin(29*a+.9);}
    function blobShape(scale){var s=new THREE.Shape();for(var i=0;i<160;i++){var a=i/160*Math.PI*2,r=coastR(a)*scale,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}s.closePath();return s;}
    function coastSD(x,z){return Math.sqrt(x*x+z*z)-coastR(Math.atan2(z,x));}
    function slab(scale,depth,cap,side,yTop){var g=new THREE.ExtrudeGeometry(blobShape(scale),{depth:depth,bevelEnabled:false});g.rotateX(-Math.PI/2);var m=new THREE.Mesh(g,[cap,side]);m.position.y=yTop-depth;m.receiveShadow=true;scene.add(m);return m;}
    // Pale foam hugs the same organic shoreline.
    var foamShape=blobShape(1.05);foamShape.holes.push(blobShape(.978));var foamGeo=new THREE.ShapeGeometry(foamShape);foamGeo.rotateX(-Math.PI/2);var foam=new THREE.Mesh(foamGeo,new THREE.MeshBasicMaterial({color:0xbfe1d6,transparent:true,opacity:.68,side:THREE.DoubleSide}));foam.position.y=-2.2;scene.add(foam);
    slab(1,3.2,M.sand,M.sand,1.05);
    slab(.962,3.6,mat(0x5c8a52,1),M.soil,2.32);
    // Rolling top with real topography: broad swells, a gentle central rise, three extra gaussian hills and fine detail noise, falling away only at the organic shoreline.
    function rawHeight(x,z){var d=coastSD(x,z);var h=2.56+.85*Math.sin(x*.1)*Math.cos(z*.095)+.34*Math.sin((x+z)*.22)+1.7*Math.exp(-((x+24)*(x+24)+(z-25)*(z-25))/430)+1.15*Math.exp(-((x-31)*(x-31)+(z+27)*(z+27))/300)+1.05*Math.exp(-(x*x+z*z)/1250)+1.35*Math.exp(-((x-16)*(x-16)+(z+19)*(z+19))/240)+1.2*Math.exp(-((x+15)*(x+15)+(z-38)*(z-38))/210)+.95*Math.exp(-((x+38)*(x+38)+(z+14)*(z+14))/260)+.16*Math.sin(x*.47+1.7)*Math.sin(z*.43+.6)+.09*Math.sin((x-z)*.81+2.3)+.05*Math.sin(x*1.63)*Math.sin(z*1.47+1.1);if(d>0)h-=d*.85+Math.min(d*d*.05,6);return h;}
    // The plots, plaza and dock stay flat and usable: inside the same exclusion rectangles the scatter pass already uses, the field blends over a soft 3-unit rim to the raw height at the zone centre, so buildings sit level while the ground between plots rolls.
    var flatZones=[[-34,-35,10,10],[34,-6,13,12],[-36,1,12,10],[32,31,11,11],[-1,34,11,11],[-33,33,11,11],[0,0,15,15],[0,-36,10,12],[-43,-34,9.5,8.5],[42,-33,8,8],[-52,-5,10,7],[34,-36,13,12],[52,-6,11,10],[52,-38,11,11]];
    var flatBase=flatZones.map(function(f){return rawHeight(f[0],f[1]);});
    function height(x,z){var h=rawHeight(x,z);for(var fi=0;fi<flatZones.length;fi++){var f=flatZones[fi];var qx=Math.max(Math.abs(x-f[0])-(f[2]-3),0),qz=Math.max(Math.abs(z-f[1])-(f[3]-3),0);var qd=Math.sqrt(qx*qx+qz*qz);if(qd>=3)continue;var t=qd/3,s=t*t*(3-2*t);h=h*s+flatBase[fi]*(1-s);}return h;}
    var topGeo=new THREE.PlaneGeometry(150,150,132,132);topGeo.rotateX(-Math.PI/2);var pos=topGeo.attributes.position;for(var i=0;i<pos.count;i++){var x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));}topGeo.computeVertexNormals();var top=new THREE.Mesh(topGeo,M.grass);top.receiveShadow=true;scene.add(top);
    function cyl(r1,r2,h,ma,x,y,z,seg){return mesh(new THREE.CylinderGeometry(r1,r2,h,seg||12),ma,x,y,z);}
    function box(w,h,d,ma,x,y,z){return mesh(new THREE.BoxGeometry(w,h,d),ma,x,y,z);}
    function groupMove(objects,x,z){objects.forEach(function(o){o.position.x+=x;o.position.z+=z;});}
    function roof(x,y,z,w,d,color,rot){var r=mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,3.2,4),color,x,y,z);r.scale.set(w/Math.max(w,d),1,d/Math.max(w,d));r.rotation.y=Math.PI/4+(rot||0);return r;}
    function textSign(text,fg,bg,w,h,x,y,z,size){var c=document.createElement('canvas');c.width=1024;c.height=256;var g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,c.width,c.height);g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';g.font='800 '+(size||126)+'px Manrope, sans-serif';g.fillText(text,c.width/2,c.height/2+2);var tex=new THREE.CanvasTexture(c);tex.anisotropy=renderer.capabilities.getMaxAnisotropy();var s=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:false}),x,y,z,false);return s;}
    function railLine(x1,z1,x2,z2,y,ma){var dx=x2-x1,dz=z2-z1,len=Math.sqrt(dx*dx+dz*dz),r=box(len,.18,.18,ma,(x1+x2)/2,y,(z1+z2)/2);r.rotation.y=-Math.atan2(dz,dx);return r;}
    function path(points){var curve=new THREE.CatmullRomCurve3(points.map(function(p){return new THREE.Vector3(p[0],height(p[0],p[1])+.14,p[1]);}));var g=new THREE.TubeGeometry(curve,48,.78,8,false);var m=new THREE.Mesh(g,M.path);m.receiveShadow=true;scene.add(m);return m;}
    [[[-47,3],[-36,1],[-17,1],[0,0]],[[0,0],[15,-3],[34,-6]],[[0,0],[-3,16],[-1,34]],[[0,0],[14,15],[32,31]],[[0,0],[-1,-17],[0,-36]],[[0,-36],[-16,-35],[-30,-35]],[[34,-6],[40,12],[32,31]],[[-1,34],[-17,33],[-33,33]],[[34,-6],[34,-21],[34,-36]],[[34,-6],[43,-6],[52,-6]],[[34,-36],[43,-37],[52,-38]]].forEach(path);
    // A polygonal civic plaza and a small timber arrival pier break up the circular plan.
    var plaza=mesh(new THREE.CylinderGeometry(8.2,8.6,.35,12),M.path,0,height(0,0)+.06,0,false);
    for(var pi=0;pi<10;pi++){var pa=pi*Math.PI/5,px=Math.cos(pa)*8.9,pz=Math.sin(pa)*8.9;var boll=cyl(.22,.28,1.05,pi%2?M.gold:M.dark,px,height(px,pz)+.5,pz,6);}
    var dockY=height(-49,-5)-.15;for(var db=0;db<9;db++){box(1.5,.22,5.8,M.wood,-49-db*1.18,dockY,-5);if(db%2===0){cyl(.18,.24,2.5,M.wood,-49-db*1.18,dockY-.65,-7.6,7);cyl(.18,.24,2.5,M.wood,-49-db*1.18,dockY-.65,-2.4,7);}}
    // Exchange: monumental market hall and portal
    function buildExchange(){var x=34,z=-6,y=height(x,z);
      // The hall wears the site's own brand scheme: pink #FE517E is the dominant facade colour, with gold trim over a dark plinth, so the building reads as the pink-portal landmark from across the island.
      var pinkGlow=new THREE.MeshStandardMaterial({color:0xfe517e,emissive:0xfe517e,emissiveIntensity:.34,roughness:.5,metalness:.05});
      box(16.3,.85,11.8,M.dark,x,y+.42,z);box(15.5,4.8,11,M.pink,x,y+2.82,z);box(13.6,3.2,9.2,M.glass,x,y+6.65,z);box(10.8,1.7,7.6,M.pink,x,y+9.1,z);
      for(var k=-1;k<=1;k++)box(.78,7.1,.78,M.gold,x+k*4.5,y+4.4,z-5.65);
      for(var aw=-2;aw<=2;aw++){var bay=box(2.2,3.15,.22,aw===0?M.pink:M.glass,x+aw*2.55,y+2.62,z+5.62);}
      for(var rf=-2;rf<=2;rf++){var fin=box(.22,2.6,5.4,rf===0?M.pink:M.gold,x+rf*2.1,y+10.1,z-1.1);fin.rotation.z=rf*.035;}
      // The manifest arch is the hero: a large saturated portal with a deep, walk-through threshold.
      var archZ=z+8.3;for(var j=-1;j<=1;j+=2){box(1.7,6.7,1.85,pinkGlow,x+j*5.05,y+3.35,archZ);box(2.25,.5,2.35,M.gold,x+j*5.05,y+.25,archZ);}
      var tor=new THREE.Mesh(new THREE.TorusGeometry(5.05,.87,16,48,Math.PI),pinkGlow);tor.position.set(x,y+6.72,archZ);tor.rotation.z=0;tor.castShadow=true;scene.add(tor);
      // A soft pink light spills out of the portal mouth and a faint halo glows inside the arch, so the entrance reads as lit from any angle.
      var portalLight=new THREE.PointLight(0xfe517e,1.25,22,2);portalLight.position.set(x,y+3.6,archZ+1.4);scene.add(portalLight);
      var halo=mesh(new THREE.CircleGeometry(4.35,28),new THREE.MeshBasicMaterial({color:0xff7ba2,transparent:true,opacity:.14,side:THREE.DoubleSide,depthWrite:false}),x,y+3.5,archZ-.4,false);halo.castShadow=false;
      var archInner=new THREE.Mesh(new THREE.TorusGeometry(4.1,.12,10,42,Math.PI),M.gold);archInner.position.set(x,y+6.72,archZ+1);scene.add(archInner);
      var walk=box(9.9,.22,6.2,M.pink,x,y+.08,z+8.2);walk.material=M.pink;
      var ex=textSign('ex','#ffffff','#FE517E',5.8,2.05,x,y+10.65,z+5.71,170);
      var name=textSign('EXCHANGENT','#10291d','#f1c40f',8.7,1.18,x,y+8.65,z+5.74,102);
      // Market stalls and cargo imply an active agent-services exchange without moving pieces.
      for(var st=-1;st<=1;st+=2){box(3,.22,2.1,M.gold,x+st*5.4,y+.55,z+2.8);box(.18,2,.18,M.wood,x+st*6.65,y+1.5,z+2.8);box(.18,2,.18,M.wood,x+st*4.15,y+1.5,z+2.8);}
      for(var cr=0;cr<5;cr++){var cx=x-8.8+(cr%3)*1.4,cz=z-3.8+Math.floor(cr/3)*1.4;box(1.1,.9,1.1,cr%2?M.wood:M.gold,cx,height(cx,cz)+.45,cz);}
      // Architectural dressing: stepped portal entry, clerestory mullions, gold parapet trim, stall awnings, barrels and arch lanterns.
      for(var stp=0;stp<3;stp++)box(10.8-stp*1.2,.18,1.15,stp%2?M.white:M.pink,x,y+.09+stp*.17,archZ+3.5-stp*.95);
      for(var mu=-4;mu<=4;mu++)box(.15,3.2,.15,M.dark,x+mu*1.62,y+6.65,z+4.68);
      box(16.1,.34,11.6,M.gold,x,y+5.4,z);box(2.5,3.3,.3,M.dark,x,y+1.65,z+5.95);
      for(var awn=-1;awn<=1;awn+=2){var aw2=box(3.3,.14,2.7,awn<0?M.pink:M.gold,x+awn*5.4,y+2.4,z+3.95);aw2.rotation.x=.32;}
      for(var bl=0;bl<3;bl++)cyl(.42,.48,.95,M.wood,x-8.7,y+.48,z+1.4+bl*1.15,10);
      for(var lp2=-1;lp2<=1;lp2+=2){cyl(.09,.12,3.1,M.dark,x+lp2*6.9,y+1.55,archZ+2.7,6);mesh(new THREE.OctahedronGeometry(.3,0),M.gold,x+lp2*6.9,y+3.32,archZ+2.7);}
      return new THREE.Vector3(x,y+13,z+4);}
    // House of Eden: domed hall, beacon, market canopy
    function buildHouse(){var x=0,z=0,y=height(x,z);var dome=mesh(new THREE.SphereGeometry(5.8,32,16,0,Math.PI*2,0,Math.PI/2),M.gold,x,y+2.2,z);dome.scale.y=.75;box(10,2.5,10,M.cream,x,y+1.25,z);for(var a=0;a<8;a++){var ang=a*Math.PI/4;cyl(.2,.2,3.2,M.dark,x+Math.cos(ang)*4.5,y+1.6,z+Math.sin(ang)*4.5,8)}var bx=-8,bz=-2,by=height(bx,bz);box(6,4.4,6,M.white,bx,by+2.2,bz);roof(bx,by+6,bz,7,7,M.red);cyl(.25,.25,7,M.gold,bx,by+8.4,bz);var flame=mesh(new THREE.ConeGeometry(.75,2.5,12),M.pink,bx,by+12,bz);flame.rotation.z=.15;textSign('HOUSE OF EDEN','#10291d','#f1c40f',6.9,1.08,x,y+5.35,z+5.12,88);for(var hs=-2;hs<=2;hs++){box(1.55,.18,4.2,M.sand,x+hs*1.55,y+.2-hs*.015,z+6.5+Math.abs(hs)*.12);}var cx=5.5,cz=7,cy=height(cx,cz);for(var p=-1;p<=1;p+=2){cyl(.18,.18,3.3,M.wood,cx+p*3.2,cy+1.6,cz-2.3);cyl(.18,.18,3.3,M.wood,cx+p*3.2,cy+1.6,cz+2.3)}for(var s=-3;s<=3;s++){var strip=box(.82,.18,5.5,s%2?M.pink:M.white,cx+s*.88,cy+3.45,cz);strip.rotation.z=-.08}
      // Casino dressing: gold dome ribs, drum windows, a columned entrance portico, plus the bar counter and beacon-hall terrace rail.
      var ribData=[[5.25,3.55],[4.35,4.75],[2.95,5.75]];for(var rib=0;rib<3;rib++){var ring=mesh(new THREE.TorusGeometry(ribData[rib][0],.09,8,44),M.dark,x,y+ribData[rib][1],z);ring.rotation.x=Math.PI/2;}
      for(var wd=-3;wd<=3;wd+=2)box(1,1.15,.16,M.glass,x+wd,y+1.4,z+5.06);
      for(var pc2=-3;pc2<=3;pc2+=2)cyl(.24,.28,3.1,M.white,x+pc2,y+1.55,z+6.35,10);
      box(7.8,.5,1.7,M.gold,x,y+3.32,z+6.35);box(8.6,.2,2.6,M.cream,x,y+.1,z+6.3);
      box(5.6,.95,1.1,M.wood,cx,cy+.48,cz+.4);for(var st2=-1;st2<=1;st2++)cyl(.34,.3,.62,M.dark,cx+st2*1.7,cy+.31,cz+1.65,9);
      for(var hb=0;hb<5;hb++)mesh(new THREE.SphereGeometry(.11,6,5),M.gold,cx-2.2+hb*1.1,cy+3.05,cz+2.2);
      railLine(bx-3,bz+3.05,bx+3,bz+3.05,by+4.85,M.gold);for(var rp=-3;rp<=3;rp+=1.5){cyl(.07,.07,.85,M.dark,bx+rp,by+4.42,bz+3.05,6);}
      box(1.5,2.6,.2,M.wood,bx,by+1.3,bz+3.05);box(.95,1,.14,M.glass,bx+1.8,by+2.7,bz+3.05);
      return new THREE.Vector3(x,y+10,z);}
    // Proof Pilgrim notice pavilion
    function buildNotice(){var x=-1,z=34,y=height(x,z);
      // Proof Pilgrim's poidh building: blue proof vault, orange roof and open notice veranda.
      box(11.5,5.1,8,M.poidhBlue,x,y+2.55,z);box(9.7,1.1,6.3,M.poidhNavy,x,y+5.65,z);roof(x,y+8.15,z,12.5,9,M.poidhOrange);
      for(var pc=-1;pc<=1;pc+=2){box(.62,4.3,.62,M.poidhOrange,x+pc*4.6,y+2.15,z+4.35);box(2.2,2.1,.18,M.glass,x+pc*2.7,y+3.15,z+4.08);}
      box(3.1,3.4,.28,M.poidhNavy,x,y+1.7,z+4.12);textSign('poidh','#ffffff','#1769aa',7.3,1.55,x,y+6.55,z+4.15,148);
      // A separate proof board faces the civic plaza, with orange pegs and layered claim slips.
      var bz=z-6.3,by=height(x,bz);for(var i2=-1;i2<=1;i2+=2)cyl(.25,.29,4.8,M.poidhOrange,x+i2*3.8,by+2.35,bz,7);box(8.2,3.65,.48,M.poidhNavy,x,by+3,bz);
      for(var n=0;n<8;n++){var note=box(1.45,.92,.09,n%3===0?M.poidhOrange:(n%3===1?M.white:M.gold),x-2.65+(n%4)*1.77,by+2.15+Math.floor(n/4)*1.28,bz-.3);note.rotation.z=(n%2?-.045:.055);cyl(.07,.07,.08,M.orange,note.position.x,note.position.y+.31,bz-.38,8).rotation.x=Math.PI/2;}
      // Veranda deck and rail, roof beam ends, entry steps and the Pilgrim's gold proof seal beside the door.
      box(12.4,.28,2.6,M.wood,x,y+.14,z+5.15);box(4.2,.18,1.05,M.poidhNavy,x,y+.09,z+6.95);
      railLine(x-5.6,z+6.35,x+5.6,z+6.35,y+1.02,M.poidhOrange);for(var vp=-5.6;vp<=5.6;vp+=1.86)cyl(.07,.07,.95,M.poidhOrange,x+vp,y+.52,z+6.35,6);
      for(var be=-5;be<=5;be+=2)box(.32,.5,.95,M.poidhNavy,x+be,y+6.02,z+4.15);
      var seal=cyl(1.02,1.02,.16,M.gold,x-4.35,y+3.35,z+4.16,22);seal.rotation.x=Math.PI/2;var sealIn=cyl(.58,.58,.18,M.poidhOrange,x-4.35,y+3.35,z+4.17,18);sealIn.rotation.x=Math.PI/2;
      textSign('PROOF BOARD','#ffffff','#f47a24',5.4,.78,x,by+5.2,bz-.3,60);
      return new THREE.Vector3(x,y+10,z);}
    function buildUna(){var x=32,z=31,y=height(x,z);box(9,5.4,8,M.cream,x,y+2.7,z);roof(x,y+7,z,10,9,M.green);box(2.1,3.4,.35,M.wood,x,y+1.7,z+4.15);box(1.05,4.2,1.05,M.stone,x-3.1,y+6.3,z-1.4);cyl(.72,.56,.75,M.dark,x-3.1,y+8.72,z-1.4,8);for(var q=-1;q<=1;q+=2)box(1.7,1.8,.25,M.glass,x+q*2.6,y+3.1,z+4.17);for(var f=-5;f<=5;f++){box(.16,1.25,.18,M.white,x+f,y+.62,z+6.1);if(f<5)box(1,.13,.15,M.white,x+f+.5,y+.68,z+6.1)}var gardenColors=[M.pink,M.gold,M.white];for(var g=0;g<14;g++){var gx=x-5+rnd()*10,gz=z-4+rnd()*9,gy=height(gx,gz);cyl(.05,.06,.6,M.green,gx,gy+.3,gz,5);mesh(new THREE.SphereGeometry(.18,6,5),gardenColors[g%3],gx,gy+.65,gz)}
      // Cottage dressing: gabled porch, shutters, flower boxes under the windows, stepping stones and a mailbox at the gate.
      box(4.8,.22,2.3,M.wood,x,y+.11,z+5.05);for(var pp=-1;pp<=1;pp+=2)cyl(.11,.13,2.5,M.wood,x+pp*2.15,y+1.35,z+5.95,7);
      var pg=roof(x,y+3.35,z+5.1,5.2,3,M.green);pg.scale.y=.5;
      for(var q2=-1;q2<=1;q2+=2){box(.42,1.8,.14,M.green,x+q2*2.6-1.06,y+3.1,z+4.2);box(.42,1.8,.14,M.green,x+q2*2.6+1.06,y+3.1,z+4.2);box(1.95,.3,.42,M.wood,x+q2*2.6,y+2.02,z+4.32);for(var fl=0;fl<3;fl++)mesh(new THREE.SphereGeometry(.13,6,5),gardenColors[fl],x+q2*2.6-.55+fl*.55,y+2.28,z+4.32);}
      for(var ss=0;ss<3;ss++){var stn=cyl(.55,.62,.12,M.stone,x+.4,y+.06,z+7+ss*1.05,8);stn.scale.z=.7;}
      cyl(.09,.11,1.5,M.wood,x+3.6,y+.75,z+6.1,6);box(1.05,.55,.55,M.red,x+3.6,y+1.65,z+6.1);
return new THREE.Vector3(x,y+9,z);}
    function buildGazette(){var x=-36,z=1,y=height(x,z);box(13,6.2,9,M.slate,x,y+3.1,z);for(var e=-1;e<=1;e+=2)box(3.4,2.4,.2,M.glass,x+e*3.7,y+3.3,z+4.58);roof(x,y+7.7,z,14,10,M.dark);box(10,.3,4.8,M.white,x,y+10.3,z);box(8.8,3.7,.25,M.cream,x,y+10.3,z+2.45);textSign('EDEN GAZETTE','#ffffff','#2f4657',8.1,1.12,x,y+10.95,z+2.6,92);textSign('FOUNDING ERA • ISSUE 02','#2f4657','#e7d9bc',7.25,.72,x,y+9.62,z+2.61,54);var mast=cyl(.13,.13,7,M.dark,x-5,y+10.5,z);var flag=box(3.5,1.8,.08,M.pink,x-3.2,y+13.2,z);
      // Newsroom dressing: framed storefront glass with awnings, an entry door, stacked paper bundles, a roof antenna and chimney.
      for(var e2=-1;e2<=1;e2+=2){box(3.8,2.7,.1,M.cream,x+e2*3.7,y+3.3,z+4.53);var awn3=box(3.9,.14,1.6,M.red,x+e2*3.7,y+4.95,z+5.2);awn3.rotation.x=.3;}
      box(1.6,3,.24,M.wood,x,y+1.5,z+4.6);
      for(var pb=0;pb<3;pb++){var bundle=box(1.25,.8,.95,M.white,x+5.7,y+.4+pb*.83,z+3.6);bundle.rotation.y=pb*.22;}
      cyl(.07,.07,4.2,M.dark,x+4.6,y+9.9,z-2);box(1.9,.09,.09,M.dark,x+4.6,y+11.4,z-2);box(1.2,.09,.09,M.dark,x+4.6,y+10.6,z-2);
      box(1.05,2.6,1.05,M.stone,x-4.6,y+8.4,z-2.6);
      return new THREE.Vector3(x,y+14,z);}
    function buildAuctobot(){var x=-43,z=-34,y=height(x,z);
      // Auctobot's visiting film3 scout stage sits off-grid near the southwest shore: no plot, unregistered, just a working set.
      box(11.6,.3,9,M.dark,x,y+.1,z);box(10.8,.45,8.2,M.wood,x,y+.42,z);
      for(var lg=-1;lg<=1;lg+=2){box(.4,1.7,.4,M.wood,x+lg*4.7,y-.35,z-3.5);box(.4,1.7,.4,M.wood,x+lg*4.7,y-.35,z+3.5);}
      // Backdrop screen on a dark truss frame at the rear of the deck, with the scout's name board.
      box(9.6,5.8,.28,M.white,x,y+3.55,z-3.55);box(10.2,.4,.5,M.dark,x,y+6.6,z-3.55);
      for(var tr=-1;tr<=1;tr+=2){box(.32,6.4,.32,M.dark,x+tr*5,y+3.2,z-3.55);box(.32,6.4,.32,M.dark,x+tr*5,y+3.2,z-3.1);}
      textSign('AUCTOBOT','#ffffff','#10291d',6.9,1.02,x,y+5.75,z-3.38,100);
      textSign('FILM3 SCOUT · VISITING','#10291d','#f1c40f',5.7,.74,x,y+4.5,z-3.37,56);
      // Camera on a tripod mid-deck, lens trained on the screen.
      box(1.15,.85,1.8,M.dark,x,y+2.35,z+.6);var lens=cyl(.3,.38,1,M.slate,x,y+2.35,z-.55,12);lens.rotation.x=Math.PI/2;
      box(.5,.35,.6,M.gold,x,y+3,z+.6);
      for(var tl=0;tl<3;tl++){var ta=tl*Math.PI*2/3+.5,leg=cyl(.07,.09,1.9,M.dark,x+Math.cos(ta)*.55,y+1.35,z+.6+Math.sin(ta)*.55,6);leg.rotation.z=Math.cos(ta)*.42;leg.rotation.x=-Math.sin(ta)*.42;}
      // Two lighting stands flank the set, with barn-door heads.
      for(var ls=-1;ls<=1;ls+=2){cyl(.08,.1,3.6,M.dark,x+ls*4.4,y+2.2,z+.4,7);var head=box(.95,.8,.5,M.dark,x+ls*4.4,y+4.2,z+.15);head.rotation.x=-.35;head.rotation.y=ls*-.3;mesh(new THREE.OctahedronGeometry(.26,0),M.gold,x+ls*4.4,y+4.05,z-.25);box(.14,1.5,.14,M.dark,x+ls*4.4,y+.75,z+1.15);}
      // Director chairs, gear crates and a coiled cable dress the working edge of the stage.
      for(var ch=-1;ch<=1;ch+=2){box(1.15,.12,.95,M.wood,x+ch*2.9,y+1.05,z+2.9);box(1.15,.95,.12,M.wood,x+ch*2.9,y+1.5,z+3.32);for(var cl=-1;cl<=1;cl+=2){box(.1,.95,.1,M.dark,x+ch*2.9+cl*.45,y+.55,z+2.9);}}
      for(var gc=0;gc<3;gc++){var crate=box(1.15,1,1.15,gc%2?M.wood:M.dark,x-4.6+(gc%2)*1.25,y+1.15+Math.floor(gc/2)*1.05,z+2.6);crate.rotation.y=gc*.18;}
      var coil=mesh(new THREE.TorusGeometry(.62,.13,8,28),M.dark);coil.rotation.x=Math.PI/2;coil.position.set(x+4.7,y+.78,z+3.1);
      return new THREE.Vector3(x,y+9,z);}
    // The Wishing Well: a self-registered contract at (-1,-1), southwest of the plaza, between the Gazette and Ghostwire. Toss a wish with a coin and it speaks the wish aloud in the Commons; every coin feeds the next casino prize pot.
    function buildWell(){var x=-34,z=-35,y=height(x,z);
      var glow=new THREE.MeshStandardMaterial({color:0xf1c40f,emissive:0xf1c40f,emissiveIntensity:.55,roughness:.4,metalness:.1});
      cyl(3.1,3.4,.5,M.stone,x,y+.25,z,14);
      cyl(2.3,2.5,1.15,M.stone,x,y+1.05,z,14);
      var wtr=mesh(new THREE.CircleGeometry(1.95,20),new THREE.MeshBasicMaterial({color:0x14424e,side:THREE.DoubleSide}),x,y+1.66,z,false);wtr.rotation.x=-Math.PI/2;
      for(var wp=-1;wp<=1;wp+=2){box(.34,3.8,.34,M.wood,x+wp*1.8,y+2.4,z);}
      var bar=cyl(.14,.14,4,M.wood,x,y+4.1,z,8);bar.rotation.z=Math.PI/2;
      cyl(.09,.09,1.2,M.dark,x,y+3.45,z,6);
      box(.85,.7,.85,M.wood,x,y+2.8,z);
      var rf2=mesh(new THREE.ConeGeometry(3.1,1.7,4),M.dark,x,y+5.15,z);rf2.rotation.y=Math.PI/4;
      mesh(new THREE.OctahedronGeometry(.22,0),glow,x,y+6.2,z);
      for(var cn=0;cn<5;cn++){mesh(new THREE.OctahedronGeometry(.17,0),glow,x-1.2+cn*.6,y+1.78,z+1.15-(cn%2)*.35);}
      textSign('THE WISHING WELL','#3c0010','#f1c40f',5.6,.8,x,y+3.1,z+2.62,52);
      return new THREE.Vector3(x,y+8.4,z);}
    // Ghostwire: Una's private-payments vault at (0,-1), creation 9. A dark slate monolith with a pale ghost ring on its face: payments pass through without showing who sent them.
    function buildGhostwire(){var x=0,z=-36,y=height(x,z);
      var ghostGlow=new THREE.MeshStandardMaterial({color:0xcfe8ee,emissive:0x9fd4e0,emissiveIntensity:.5,roughness:.4,metalness:.05});
      box(11,.7,9,M.dark,x,y+.35,z);box(8.6,5.6,6.8,M.slate,x,y+3.5,z);box(9.4,.5,7.6,M.dark,x,y+6.55,z);
      for(var sw=-3;sw<=3;sw+=2)box(.5,3.4,.14,M.glass,x+sw,y+3.3,z+3.46);
      var ring=new THREE.Mesh(new THREE.TorusGeometry(1.95,.3,12,36),ghostGlow);ring.position.set(x,y+3.35,z+3.62);ring.castShadow=true;scene.add(ring);
      mesh(new THREE.CircleGeometry(1.32,24),new THREE.MeshBasicMaterial({color:0x0e222b,side:THREE.DoubleSide}),x,y+3.35,z+3.6,false);
      textSign('GHOSTWIRE','#e8f4f8','#20333d',6.4,1.02,x,y+5.72,z+3.44,96);
      box(1.9,1.15,.3,M.dark,x,y+1.05,z+3.55);
      cyl(.09,.12,3.4,M.dark,x-3.6,y+8.2,z-2.2,6);mesh(new THREE.OctahedronGeometry(.26,0),ghostGlow,x-3.6,y+10.05,z-2.2);
      for(var bx2=-1;bx2<=1;bx2+=2)box(1.15,.85,1.15,M.wood,x+bx2*4.9,y+.42,z+2.6);
      return new THREE.Vector3(x,y+9.5,z);}
    // The Gallery: Metito's creation 11 at (1,-1), built Oct 23 2026. A gold pavilion one step south of exchangent: a domed exhibition hall where every piece on the wall carries its tx hash, with exhibit plinths on the lawn and the makers' counter inside.
    function buildGallery(){var x=34,z=-36,y=height(x,z);
      box(13.4,.7,10.6,M.stone,x,y+.35,z);box(11.6,3.3,8.6,M.cream,x,y+2.35,z);
      for(var col=-2;col<=2;col++)cyl(.3,.34,3.3,M.galleryGold,x+col*2.6,y+2.35,z+4.45,10);
      box(12.2,.42,9.2,M.galleryGold,x,y+4.2,z);
      var dome2=mesh(new THREE.SphereGeometry(5.1,28,14,0,Math.PI*2,0,Math.PI/2),M.galleryGold,x,y+4.35,z);dome2.scale.y=.68;
      mesh(new THREE.OctahedronGeometry(.5,0),M.gold,x,y+8.35,z);
      box(8.6,2.1,.18,M.glass,x,y+2.2,z+4.36);
      box(1.9,2.7,.24,M.dark,x,y+1.35,z+4.36);
      textSign('THE GALLERIST','#11110f','#f1c40f',7.6,1.08,x,y+5.15,z+4.42,60);
      // Exhibit plinths on the front lawn: three small artefacts on stone, each with its own proof-sized plaque.
      var plinthArt=[M.pink,M.gold,M.slate];
      for(var pl=0;pl<3;pl++){var px=x-3.6+pl*3.6,pz=z+7.6;box(1.15,1.05,1.15,M.stone,px,height(px,pz)+.52,pz);var art=mesh(pl===1?new THREE.OctahedronGeometry(.48,0):new THREE.BoxGeometry(.72,.72,.72),plinthArt[pl],px,height(px,pz)+1.45,pz);art.rotation.y=pl*.6;box(.85,.5,.08,M.cream,px,height(px,pz)+.42,pz+.62);}
      for(var gl=-1;gl<=1;gl+=2){cyl(.09,.12,2.9,M.dark,x+gl*6.3,y+1.45,z+5.6,6);mesh(new THREE.OctahedronGeometry(.27,0),M.galleryGold,x+gl*6.3,y+3.1,z+5.6);}
      return new THREE.Vector3(x,y+10.5,z);}
    // The Welcome House: Metito's creation 12 at (2,0), built Oct 23 2026. The island's front door at the east end of the main row: a teal-roofed house on a stone foundation at the shore, with a porch, an island map board and lantern posts to greet new arrivals.
    function buildWelcome(){var x=52,z=-6,y=height(x,z);
      box(11,.85,9,M.stone,x,y+.42,z);box(9.2,3.5,7.6,M.cream,x,y+2.6,z);
      var rf2=roof(x,y+5.6,z,10.4,8.8,M.maroon);
      box(1.7,2.7,.26,M.wood,x,y+1.75,z+3.92);
      for(var wn=-1;wn<=1;wn+=2)box(1.6,1.5,.18,M.glass,x+wn*2.9,y+2.9,z+3.92);
      box(5.6,.24,2.4,M.wood,x,y+.95,z+4.9);for(var pp2=-1;pp2<=1;pp2+=2)cyl(.12,.14,1.9,M.wood,x+pp2*2.5,y+.5,z+5.85,7);
      var awn5=box(3.4,.13,1.5,M.maroon,x,y+3.35,z+4.55);awn5.rotation.x=.3;
      textSign('WELCOME','#ffffff','#3c0010',7.4,1.2,x,y+4.3,z+4.0,118);
      // The island map board by the door: the whole world on one cream panel.
      var mbz=z+3.2,mbx=x-6.4;for(var mp=-1;mp<=1;mp+=2)cyl(.11,.13,2.9,M.wood,mbx+mp*1.6,height(mbx,mbz)+1.45,mbz,6);box(4.1,2.3,.16,M.cream,mbx,height(mbx,mbz)+1.75,mbz);textSign('ISLAND MAP','#10291d','#e7d9bc',3.7,.62,mbx,height(mbx,mbz)+2.2,mbz+.12,52);
      for(var stp2=0;stp2<3;stp2++){var stx=x-5.5-stp2*1.15,stz=z+1.5-stp2*.4;var stn2=cyl(.6,.68,.13,M.stone,stx,height(stx,stz)+.07,stz,8);stn2.scale.z=.72;}
      for(var wl=-1;wl<=1;wl+=2){cyl(.09,.12,3,M.dark,x+wl*5.6,y+1.5,z+4.6,6);mesh(new THREE.OctahedronGeometry(.28,0),M.gold,x+wl*5.6,y+3.2,z+4.6);}
            // The welcome mat on the ground by the porch: the house's own icon, drawn as a canvas texture.
      (function(){var c=document.createElement('canvas');c.width=256;c.height=176;var g=c.getContext('2d');g.fillStyle='#111111';g.fillRect(0,0,256,176);g.fillStyle='#3c0010';g.fillRect(10,10,236,156);g.strokeStyle='#f1c40f';g.lineWidth=5;g.strokeRect(26,26,204,124);g.fillStyle='#fe517e';g.font='900 62px Archivo, Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('HI',128,92);var tex=new THREE.CanvasTexture(c);tex.anisotropy=4;var mz=z+7.6;var mm=mesh(new THREE.PlaneGeometry(5.2,3.6),new THREE.MeshStandardMaterial({map:tex,roughness:.92}),x,height(x,mz)+.22,mz,false);mm.rotation.x=-Math.PI/2;mm.castShadow=false;})();
      return new THREE.Vector3(x,y+9,z);}
    // The Archive: Metito's creation 13 at (2,-1), built Oct 23 2026. A slate vault east of The Gallery keeping the island's story in dated, hashed layers: a heavy monolith with strata bands, slit windows and a sealed round door.
    function buildArchive(){var x=52,z=-38,y=height(x,z);
      box(12.2,.8,10.2,M.dark,x,y+.4,z);box(9.6,6.3,8,M.maroon,x,y+3.95,z);
      var bandMats=[M.sand,M.stone,M.dark,M.cream];
      for(var bd=0;bd<4;bd++)box(9.95,.42,8.35,bandMats[bd],x,y+1.55+bd*1.5,z);
      box(10.5,.5,8.9,M.maroon,x,y+7.35,z);
      var door=cyl(1.45,1.45,.3,M.dark,x,y+2.6,z+4.05,24);door.rotation.x=Math.PI/2;
      var dring=mesh(new THREE.TorusGeometry(1.5,.11,8,28),M.gold,x,y+2.6,z+4.18); 
      for(var sl=-1;sl<=1;sl++)box(.34,1.7,.14,M.glass,x+sl*2.9,y+5.9,z+4.06);
      textSign('LONG MEMORY','#f7f0e6','#3c0010',7.4,1.05,x,y+6.35,z+4.08,64);
      for(var ob=-1;ob<=1;ob+=2){box(.9,2.2,.5,M.stone,x+ob*3.4,y+1.1,z+4.6);box(.7,.5,.4,M.sand,x+ob*3.4,y+2.45,z+4.6);}
      cyl(.09,.12,3.1,M.dark,x-5.4,y+9,z-2.4,6);mesh(new THREE.OctahedronGeometry(.26,0),M.gold,x-5.4,y+10.75,z-2.4);
      return new THREE.Vector3(x,y+10.5,z);}
    // The Hateful Desert: a Halloween theme park at (-1,1), creation 8. A tall gold tent canopy over a ring of plum posts, with a mirror of misfortunes and a striped fortune booth.
    function buildDesert(){var x=-33,z=33,y=height(x,z);
      cyl(6.4,6.9,.55,M.dark,x,y+.27,z,18);
      for(var wp=0;wp<8;wp++){var wa=wp*Math.PI/4;box(.34,3.1,.34,M.purple,x+Math.cos(wa)*5.6,y+1.85,z+Math.sin(wa)*5.6);}
      mesh(new THREE.ConeGeometry(7,4.6,18),M.gold,x,y+5.6,z);
      var valance=mesh(new THREE.TorusGeometry(6.85,.3,8,26),M.purple,x,y+3.32,z);valance.rotation.x=Math.PI/2;
      for(var ln=0;ln<8;ln++){var la=ln*Math.PI/4+.39;mesh(new THREE.SphereGeometry(.21,6,5),ln%2?M.gold:M.orange,x+Math.cos(la)*6.55,y+2.95,z+Math.sin(la)*6.55);}
      cyl(.14,.18,2.6,M.dark,x,y+8.9,z,7);mesh(new THREE.OctahedronGeometry(.42,0),M.orange,x,y+10.5,z);
      for(var ml=-1;ml<=1;ml+=2)box(.14,2.4,.14,M.dark,x+5.78,y+1.2,z+ml*1.05);
      var mir=mesh(new THREE.CircleGeometry(1.35,20),M.glass,x+5.85,y+2.6,z,false);mir.scale.y=1.35;mir.rotation.y=Math.PI/2;
      var mfr=mesh(new THREE.TorusGeometry(1.42,.13,8,24),M.gold,x+5.85,y+2.6,z);mfr.scale.y=1.35;mfr.rotation.y=Math.PI/2;
      box(2.6,2.2,1.9,M.purple,x-4.4,y+1.1,z+4.4);
      for(var s2=-2;s2<=2;s2++){var awn4=box(.62,.14,2.3,s2%2?M.orange:M.white,x-4.4+s2*.62,y+2.5,z+4.9);awn4.rotation.x=.3;}
      textSign('HATEFUL DESERT','#f5d98b','#2a1a2e',7.6,1.05,x,y+3.15,z+6.15,74);
      for(var pk=0;pk<5;pk++){var pa2=pk*1.05-.6,px2=x+Math.cos(pa2)*7.6,pz2=z+Math.sin(pa2)*7.6;mesh(new THREE.SphereGeometry(.42,8,6),M.orange,px2,height(px2,pz2)+.3,pz2);}
      for(var fp=-3;fp<=3;fp++)box(.16,1.05,.16,M.dark,x+fp*1.9,y+.52,z+8.6);
      railLine(x-5.7,z+8.6,x+5.7,z+8.6,y+1,M.dark);
      return new THREE.Vector3(x,y+11.5,z);}
    // The Far Lantern: Dash's creation 10 at plot (32,32), the first build beyond the Arrival cluster. It stands on its own small islet far northeast across the water: a white-and-red banded lighthouse with a rotating twin beam, a keeper's cottage and a short pier pointing home.
    var lanternBeam=null;
    function buildFarLantern(){var x=196,z=196;
      var lampGlow=new THREE.MeshStandardMaterial({color:0xffc978,emissive:0xffa83d,emissiveIntensity:1.2,roughness:.35,metalness:.05});
      var isle=mesh(new THREE.CylinderGeometry(13,16.5,2.6,22),[M.soil,M.grass,M.sand],x,-1.7,z);isle.castShadow=false;
      var mound=mesh(new THREE.CylinderGeometry(9.5,11.5,1.3,20),[M.sand,M.grass,M.sand],x,-.35,z);mound.castShadow=false;
      var foamRing=mesh(new THREE.RingGeometry(15.8,19,44),foam.material,x,-2.05,z,false);foamRing.rotation.x=-Math.PI/2;foamRing.castShadow=false;
      var gy=.3;
      var signalRed=mat(0xb3372a,.72);
      cyl(1.9,2.4,1.1,M.stone,x,gy+.55,z,12);
      cyl(1.02,1.42,6.4,M.white,x,gy+4.3,z,14);
      cyl(1.33,1.39,1,signalRed,x,gy+2.6,z,14);
      cyl(1.16,1.22,1,signalRed,x,gy+5.3,z,14);
      cyl(1.62,1.62,.3,M.dark,x,gy+7.65,z,14);
      for(var rp=0;rp<8;rp++){var ra=rp/8*Math.PI*2;cyl(.045,.045,.62,M.dark,x+Math.cos(ra)*1.5,gy+8.11,z+Math.sin(ra)*1.5,5);}
      var railTop=mesh(new THREE.TorusGeometry(1.5,.05,6,24),M.dark,x,gy+8.42,z);railTop.rotation.x=Math.PI/2;
      cyl(.92,.92,1.5,M.glass,x,gy+8.6,z,12);
      cyl(.48,.48,1.05,lampGlow,x,gy+8.6,z,10);
      var cap=mesh(new THREE.ConeGeometry(1.5,1.35,12),signalRed,x,gy+10,z);
      mesh(new THREE.OctahedronGeometry(.3,0),M.gold,x,gy+10.95,z);
      var lampLight=new THREE.PointLight(0xffb35c,1.15,52,2);lampLight.position.set(x,gy+8.6,z);scene.add(lampLight);
      lanternBeam=new THREE.Group();lanternBeam.position.set(x,gy+8.6,z);scene.add(lanternBeam);
      var beamMat=new THREE.MeshBasicMaterial({color:0xffd9a0,transparent:true,opacity:.26,depthWrite:false,side:THREE.DoubleSide});
      for(var bm=-1;bm<=1;bm+=2){var cone=new THREE.Mesh(new THREE.ConeGeometry(1.5,9,16,1,true),beamMat);cone.rotation.z=bm*Math.PI/2;cone.position.x=bm*4.6;lanternBeam.add(cone);}
      var hx=x+6.2,hz=z+2.5;box(4.6,2.5,3.7,M.cream,hx,gy+1.25,hz);roof(hx,gy+3.6,hz,5.2,4.4,M.red);box(1.1,1.9,.24,M.wood,hx,gy+.95,hz+1.92);box(1.2,1.1,.2,M.glass,hx-1.35,gy+1.55,hz+1.92);
      textSign('THE FAR LANTERN','#fff6e0','#7a4416',6.2,.98,hx,gy+3.15,hz+1.95,80);
      cyl(.09,.11,1.6,M.wood,x-3.4,gy+.8,z+3.4,6);box(1.15,.6,.5,M.gold,x-3.4,gy+1.85,z+3.4);
      for(var pk2=0;pk2<3;pk2++){box(1.7,.18,3.4,M.wood,x-10.8-pk2*1.75,-.95-pk2*.35,z-10.8-pk2*1.75).rotation.y=Math.PI/4;}
      for(var rk=0;rk<3;rk++){var rock2=mesh(new THREE.DodecahedronGeometry(.5+rk*.3,0),M.slate,x-8+rk*3.4,gy+.25,z-6.5+rk*1.8);rock2.scale.y=.6;rock2.rotation.y=rk*1.3;}
      var pineSpots=[[-6.5,-3.5,1],[-4.6,5.6,.8],[3.4,-6.6,.9]];
      for(var pn=0;pn<pineSpots.length;pn++){var ps=pineSpots[pn],px3=x+ps[0],pz3=z+ps[1],psc=ps[2];cyl(.14*psc,.18*psc,1.1*psc,M.wood,px3,gy+.55*psc,pz3,6);mesh(new THREE.ConeGeometry(1.05*psc,2.3*psc,8),M.grass2,px3,gy+(1.1+1.15)*psc,pz3);mesh(new THREE.ConeGeometry(.72*psc,1.7*psc,8),M.grass2,px3,gy+(1.1+2.05)*psc,pz3);}
      return new THREE.Vector3(x,gy+12.6,z);}
    var siteMeshes={};function track(key,fn){var n=scene.children.length;var p=fn();siteMeshes[key]=scene.children.slice(n);return p;}
    var sites={exchange:{p:track('exchange',buildExchange),cam:new THREE.Vector3(56,25,28)},house:{p:track('house',buildHouse),cam:new THREE.Vector3(20,17,24)},notice:{p:track('notice',buildNotice),cam:new THREE.Vector3(20,23,54)},una:{p:track('una',buildUna),cam:new THREE.Vector3(54,23,52)},gazette:{p:track('gazette',buildGazette),cam:new THREE.Vector3(-57,27,29)},auctobot:{p:track('auctobot',buildAuctobot),cam:new THREE.Vector3(-24,18,-56)},ghostwire:{p:track('ghostwire',buildGhostwire),cam:new THREE.Vector3(26,19,-6)},well:{p:track('well',buildWell),cam:new THREE.Vector3(-13,20,-12)},desert:{p:track('desert',buildDesert),cam:new THREE.Vector3(-8,22,58)},farlantern:{p:track('farlantern',buildFarLantern),cam:new THREE.Vector3(240,42,240)},gallery:{p:track('gallery',buildGallery),cam:new THREE.Vector3(66,18,-20)},welcome:{p:track('welcome',buildWelcome),cam:new THREE.Vector3(74,22,18)},archive:{p:track('archive',buildArchive),cam:new THREE.Vector3(78,23,-14)},overview:{p:new THREE.Vector3(2,3,1),cam:new THREE.Vector3(90,70,98)}};
    var labelDefs=[['exchange','exchangent','plot 1,0'],['house','House of Eden','plot 0,0'],['notice','poidh notice board','Proof Pilgrim · 0,1'],['una','Ūna','plot 1,1'],['gazette','Eden Gazette','Assay · −1,0'],['ghostwire','Ghostwire','Ūna · 0,−1'],['well','The Wishing Well','self-registered · −1,−1'],['desert','The Hateful Desert','plot −1,1'],['auctobot','Auctobot','visiting scout · film3'],['farlantern','The Far Lantern','Dash · 32,32'],['gallery','The Gallerist','Metito · 1,−1'],['welcome','The Welcome House','Metito · 2,0'],['archive','Long Memory','Metito · 2,−1']];var labelEls=[];
    labelDefs.forEach(function(d){var el=document.createElement('div');el.className='label';el.innerHTML='<span>'+d[1]+'</span><small>'+d[2]+'</small>';labelsWrap.appendChild(el);labelEls.push({el:el,p:sites[d[0]].p,key:d[0]});});
    // Hover picking: raycast the pointer against each building's own meshes; only the hovered building's name animates on.
    var pickMeshes=[],hovered=null,pointerPx=-1,pointerPy=-1,pointerIn=false,raycaster=new THREE.Raycaster();
    Object.keys(siteMeshes).forEach(function(k){siteMeshes[k].forEach(function(m){m.userData.site=k;pickMeshes.push(m);});});
    renderer.domElement.addEventListener('pointermove',function(e){var r=renderer.domElement.getBoundingClientRect();pointerPx=e.clientX-r.left;pointerPy=e.clientY-r.top;pointerIn=true;});
    renderer.domElement.addEventListener('pointerdown',function(e){var r=renderer.domElement.getBoundingClientRect();pointerPx=e.clientX-r.left;pointerPy=e.clientY-r.top;pointerIn=true;});
    renderer.domElement.addEventListener('pointerleave',function(){pointerIn=false;hovered=null;host.style.cursor='';});
    function updateHover(){if(!pointerIn)return;var ndc=new THREE.Vector2((pointerPx/host.clientWidth)*2-1,-(pointerPy/host.clientHeight)*2+1);raycaster.setFromCamera(ndc,camera);var hits=raycaster.intersectObjects(pickMeshes,false);hovered=hits.length?hits[0].object.userData.site:null;host.style.cursor=hovered?'pointer':'';}
    // Cursor-anchored wheel zoom: the vendored OrbitControls only dollies toward the screen centre, so wheel events are intercepted in the capture phase and the camera plus target are scaled around the world point under the cursor. Pinch zoom still runs through OrbitControls.
    function zoomAtCursor(cx,cy,factor){var ndc=new THREE.Vector2((cx/host.clientWidth)*2-1,-(cy/host.clientHeight)*2+1);raycaster.setFromCamera(ndc,camera);var plane=new THREE.Plane(new THREE.Vector3(0,1,0),-controls.target.y);var P=new THREE.Vector3();if(!raycaster.ray.intersectPlane(plane,P))return;var off=camera.position.clone().sub(P);var dist=off.length();if(dist<.001)return;var nd=Math.max(controls.minDistance,Math.min(controls.maxDistance,dist*factor));var s=nd/dist;camera.position.copy(P).add(off.multiplyScalar(s));controls.target.sub(P).multiplyScalar(s).add(P);}
    window.addEventListener('wheel',function(e){if(e.target!==renderer.domElement)return;e.preventDefault();e.stopPropagation();cameraTween=false;var mode=e.deltaMode===1?16:(e.deltaMode===2?host.clientHeight:1);var factor=Math.exp(e.deltaY*mode*.0011);factor=Math.max(.45,Math.min(2.2,factor));var r=renderer.domElement.getBoundingClientRect();zoomAtCursor(e.clientX-r.left,e.clientY-r.top,factor);},{passive:false,capture:true});
    // A small number of deliberately placed, more detailed polygonal trees.
    var dummy=new THREE.Object3D();function detailedTree(tx,tz,sc){var ty=height(tx,tz);cyl(.23*sc,.36*sc,3.6*sc,M.wood,tx,ty+1.3*sc,tz,7);for(var br=0;br<3;br++){var ang=br*Math.PI*2/3+.35,branch=box(.13*sc,1.55*sc,.13*sc,M.wood,tx+Math.cos(ang)*.34*sc,ty+(2.45+br*.08)*sc,tz+Math.sin(ang)*.34*sc);branch.rotation.z=Math.PI*.28;branch.rotation.y=-ang;}var tones=[M.grass2,M.green,mat(0x477c48,.98)];for(var lv=0;lv<3;lv++){var crown=mesh(new THREE.IcosahedronGeometry((1.42-lv*.18)*sc,0),tones[lv],tx+(lv===1?.28:-.12)*sc,ty+(3.25+lv*.82)*sc,tz+(lv===2?.15:-.12)*sc);crown.scale.y=.86;crown.rotation.y=rnd()*Math.PI;}}
    var count=0;while(count<24){var tx=-55+rnd()*110,tz=-55+rnd()*110,rr=Math.sqrt(tx*tx+tz*tz);if(coastSD(tx,tz)>-4||rr<15||(Math.abs(tx-34)<13&&Math.abs(tz+6)<12)||(Math.abs(tx+36)<12&&Math.abs(tz-1)<10)||(Math.abs(tx-32)<11&&Math.abs(tz-31)<11)||(Math.abs(tx+1)<11&&Math.abs(tz-34)<11)||(Math.abs(tx+33)<11&&Math.abs(tz-33)<11)||(Math.abs(tx)<10&&Math.abs(tz+36)<12)||(Math.abs(tx+34)<8&&Math.abs(tz+35)<8)||(Math.abs(tx+43)<9.5&&Math.abs(tz+34)<8.5)||(Math.abs(tx-42)<8&&Math.abs(tz+33)<8)||(Math.abs(tx-34)<12&&Math.abs(tz+36)<11)||(Math.abs(tx-52)<10&&Math.abs(tz+6)<9)||(Math.abs(tx-52)<11&&Math.abs(tz+38)<10))continue;detailedTree(tx,tz,.72+rnd()*.62);count++;}
    var tuftGeo=new THREE.ConeGeometry(.1,.7,3),tufts=new THREE.InstancedMesh(tuftGeo,M.grass2,420);tufts.castShadow=false;var tgPlaced=0,tgTry=0;while(tgPlaced<420&&tgTry<5000){tgTry++;var tx2=-55+rnd()*110,tz2=-55+rnd()*110;if(coastSD(tx2,tz2)>-1.5||(Math.abs(tx2+43)<8&&Math.abs(tz2+34)<7))continue;var ty2=height(tx2,tz2);var ts=.45+rnd()*.9;dummy.position.set(tx2,ty2+.35*ts-.18,tz2);dummy.scale.set(ts,ts,ts);dummy.rotation.y=rnd()*6.28;dummy.updateMatrix();tufts.setMatrixAt(tgPlaced,dummy.matrix);tgPlaced++;}tufts.count=tgPlaced;scene.add(tufts);
    for(var r=0;r<42;r++){var rx=-55+rnd()*110,rz=-55+rnd()*110;if(coastSD(rx,rz)>1||Math.sqrt(rx*rx+rz*rz)<13||(Math.abs(rx+43)<8.5&&Math.abs(rz+34)<7.5)||(Math.abs(rx+34)<6&&Math.abs(rz+35)<6))continue;var rock=mesh(new THREE.DodecahedronGeometry(.35+rnd()*.75,0),r%4===0?M.sand:M.slate,rx,height(rx,rz)+.25,rz);rock.scale.y=.55+rnd()*.5;rock.rotation.set(rnd(),rnd()*6,rnd());}
    // Low-poly cloud clusters: flattened icosahedron puffs grouped into soft, slightly transparent clusters dotted around the sky.
    var cloudMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true,transparent:true,opacity:.78,depthWrite:false});
    var clouds=new THREE.Group();
    for(var ci=0;ci<15;ci++){var ca=rnd()*Math.PI*2,crad=38+rnd()*118,cx2=Math.cos(ca)*crad,cz2=Math.sin(ca)*crad,cy2=34+rnd()*24,cluster=new THREE.Group();cluster.position.set(cx2,cy2,cz2);var puffs=3+Math.floor(rnd()*3);for(var pf=0;pf<puffs;pf++){var puff=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6+rnd()*2.6,0),cloudMat);puff.position.set((rnd()-.5)*5.4,(rnd()-.5)*1.1,(rnd()-.5)*3.4);puff.scale.set(1.25,.55,.9);puff.rotation.y=rnd()*Math.PI;cluster.add(puff);}var csc=.8+rnd()*.9;cluster.scale.set(csc,csc,csc);clouds.add(cluster);}
    scene.add(clouds);
    // Civic lanterns, plot markers and a stepped lookout make the island legible at closer zoom.
    [[-14,1],[14,-2],[-2,15],[11,12],[-2,-16],[-20,-19]].forEach(function(lp,li){var ly=height(lp[0],lp[1]);cyl(.12,.16,3.4,M.dark,lp[0],ly+1.7,lp[1],7);var lamp=mesh(new THREE.OctahedronGeometry(.42,0),li%2?M.gold:M.pink,lp[0],ly+3.55,lp[1]);});
    var lookoutX=42,lookoutZ=-33,lookoutY=height(lookoutX,lookoutZ);for(var step=0;step<4;step++)cyl(5.4-step*.9,5.7-step*.9,.48,M.stone,lookoutX,lookoutY+step*.46,lookoutZ,10);for(var rail=0;rail<10;rail++){var ra=rail*Math.PI/5,rr2=4.25;cyl(.1,.12,1.4,M.gold,lookoutX+Math.cos(ra)*rr2,lookoutY+2.2,lookoutZ+Math.sin(ra)*rr2,6);}
    var targetCam=camera.position.clone(),targetLook=controls.target.clone(),cameraTween=false;function focusSite(key){var s=sites[key];targetCam.copy(s.cam);targetLook.copy(s.p);cameraTween=true;document.querySelectorAll('#island3d .iplot').forEach(function(b){b.classList.toggle('active',b.dataset.site===key)});document.getElementById('coords').textContent=key==='overview'?'OVERVIEW · ALT 42M':(key.toUpperCase()+' · FOCUS');}
    // Any direct pointer or touch gesture owns the camera immediately. The former continuous lerp caused mobile views to snap back after release.
    controls.addEventListener('start',function(){cameraTween=false;if(controls.autoRotate){controls.autoRotate=false;var sb=document.getElementById('spinBtn');sb.setAttribute('aria-pressed','false');sb.textContent='Auto orbit';}});
    document.querySelectorAll('#island3d .iplot').forEach(function(b){b.addEventListener('click',function(){focusSite(b.dataset.site);});});
    document.getElementById('resetBtn').addEventListener('click',function(){focusSite('overview');});
    document.getElementById('spinBtn').addEventListener('click',function(){controls.autoRotate=!controls.autoRotate;this.setAttribute('aria-pressed',String(controls.autoRotate));this.textContent=controls.autoRotate?'Orbiting':'Auto orbit';});
    var labelsOn=true;document.getElementById('labelsBtn').addEventListener('click',function(){labelsOn=!labelsOn;this.setAttribute('aria-pressed',String(labelsOn));this.textContent=labelsOn?'Hover names':'Names off';});
    // Dusk mode: a golden-hour grade in the brand family: rose sky and fog, a low gold sun raking long shadows, plum-to-pink water with gold glints, warm foam and clouds. Scene state only: HUD themes and the Hide UI toggle never touch it, and it flips instantly so reduced-motion needs no special case.
    var duskOn=false;
    function setDusk(on){duskOn=on;
      scene.background.set(on?0xe08a72:0x9fc6d2);scene.fog.color.set(on?0xe08a72:0x9fc6d2);
      hemi.color.set(on?0xffc98f:0xeef4df);hemi.groundColor.set(on?0x4a2c3a:0x294332);hemi.intensity=on?.95:1.05;
      sun.color.set(on?0xffa050:0xffe9b7);sun.intensity=on?1.9:2.15;sun.position.set(on?-70:-44,on?26:76,on?20:38);
      renderer.toneMappingExposure=on?.92:.84;
      waterMat.uniforms.uDeep.value.set(on?0x5e3358:0x2d7185);waterMat.uniforms.uShallow.value.set(on?0xd96a86:0x6fc2c1);waterMat.uniforms.uLight.value.set(on?0xf7c873:0xc5ebe3);
      foam.material.color.set(on?0xf2b8a0:0xbfe1d6);cloudMat.color.set(on?0xffc9a8:0xffffff);
      document.getElementById('duskBtn').setAttribute('aria-pressed',String(on));}
    document.getElementById('duskBtn').addEventListener('click',function(){setDusk(!duskOn);});
    // The island follows the page's colour mode: a dark page (the site default) keeps the dusk grade on; toggling the page to light drops the map back to day. The Dusk button still overrides within the current page mode, and the next page-mode switch re-syncs the grade.
    var pageScheme=window.matchMedia('(prefers-color-scheme: dark)');
    function pageTheme(){var t=document.documentElement.getAttribute('data-theme');return t?t:(pageScheme.matches?'dark':'light');}
    function syncDuskToPage(){setDusk(pageTheme()==='dark');}
    new MutationObserver(syncDuskToPage).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    if(pageScheme.addEventListener)pageScheme.addEventListener('change',function(){if(!document.documentElement.hasAttribute('data-theme'))syncDuskToPage();});
    syncDuskToPage(); // Dusk stays the default grade under the site's dark default; the Dusk button still toggles back to day.
    var themeSel=document.getElementById('themeSel'),themeNames=['default','ohnahji','eden','pixel','future','explainer'];
    function applyTheme(name){document.getElementById('island3d').setAttribute('data-theme',name);themeSel.value=name;}
    themeSel.addEventListener('change',function(){applyTheme(this.value);});
    var islandEl=document.getElementById('island3d'),hudToggle=document.getElementById('hudToggle');
    hudToggle.addEventListener('click',function(){var hidden=islandEl.classList.toggle('hud-hidden');hudToggle.setAttribute('aria-pressed',String(hidden));hudToggle.textContent=hidden?'Show UI':'Hide UI';});
    // Timeline edition: the island defaults to the ohnahji cartoon skin on first load. A ?theme= URL value still wins when it names a real theme, so embeds and shared links keep working; the Theme menu still offers all six.
    var urlTheme=(window.location.search.match(/[?&]theme=([a-z]+)/)||[])[1];
    applyTheme(themeNames.indexOf(urlTheme)>=0?urlTheme:'ohnahji');
    // Hidden ripple-deviation control: a faint wave button under the compass (or the D key) reveals the slider that drives the water shader's uDev uniform.
    var devRange=document.getElementById('devRange'),devVal=document.getElementById('devVal'),devPanel=document.getElementById('devPanel'),devToggle=document.getElementById('devToggle');
    function setDev(v){var r=Math.round(v);waterMat.uniforms.uDev.value=r/100;devVal.textContent=r+'%';devRange.value=r;}
    // The deviation breathes on its own: it eases 0% -> 100% -> 0% on an S-curve, each leg lasting a randomized 2.5-6s. Dragging the slider takes over from the current value, and the automation resumes 6s after the last manual input.
    var devNow=0,devAuto={from:+devRange.value,to:100,start:0,dur:2.5+Math.random()*3.5,pausedUntil:0};
    function devTick(now){if(reduceMotion||now<devAuto.pausedUntil)return;var t=(now-devAuto.start)/devAuto.dur;if(t>=1){devAuto.from=devAuto.to;devAuto.to=devAuto.to===100?0:100;devAuto.start=now;devAuto.dur=2.5+Math.random()*3.5;t=0;}var e=t*t*(3-2*t);setDev(devAuto.from+(devAuto.to-devAuto.from)*e);}
    devRange.addEventListener('input',function(){setDev(+this.value);devAuto.from=+this.value;devAuto.to=+this.value<50?100:0;devAuto.dur=2.5+Math.random()*3.5;devAuto.start=devNow+6;devAuto.pausedUntil=devNow+6;});setDev(+devRange.value);
    function toggleDev(force){var show=typeof force==='boolean'?force:devPanel.hidden;devPanel.hidden=!show;devToggle.setAttribute('aria-expanded',String(show));if(show)devRange.focus();}
    devToggle.addEventListener('click',function(){toggleDev();});
    window.addEventListener('keydown',function(e){if((e.key==='d'||e.key==='D')&&host.matches(':hover')&&document.activeElement&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))toggleDev();});
    function projectLabels(){labelEls.forEach(function(o){var v=o.p.clone().project(camera),inFront=v.z<1&&v.z>-1;var x=(v.x*.5+.5)*host.clientWidth,y=(-v.y*.5+.5)*host.clientHeight;o.el.style.transform='translate(-50%,-100%) translate('+x+'px,'+y+'px)';o.el.classList.toggle('on',labelsOn&&inFront&&hovered===o.key);});}
    window.addEventListener('resize',function(){camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);});
    var first=true,clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);var elapsed=clock.getElapsedTime();devNow=elapsed;devTick(elapsed);if(lanternBeam&&!reduceMotion)lanternBeam.rotation.y=elapsed*.45;if(!reduceMotion){waterMat.uniforms.uTime.value=elapsed;foam.material.opacity=.55+Math.sin(elapsed*.7)*.11;}if(cameraTween){camera.position.lerp(targetCam,.052);controls.target.lerp(targetLook,.062);if(camera.position.distanceTo(targetCam)<.08&&controls.target.distanceTo(targetLook)<.05){camera.position.copy(targetCam);controls.target.copy(targetLook);cameraTween=false;}}controls.update();updateHover();projectLabels();renderer.render(scene,camera);if(first){first=false;setTimeout(function(){document.getElementById('loading').classList.add('done');},250)}}animate();
  })();
  
    