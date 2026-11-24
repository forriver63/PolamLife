"""Rebuild original PolamLife pixel artwork with Pillow.

Run after draw-world-sprites.py. Uses the bundled assets/items illustrations. Outputs replace the existing generated images in assets/.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)

from PIL import Image, ImageDraw, ImageFont
import random, math
rng=random.Random(911)
out=Path('assets/world')
ink='#354a47'; cream='#f2e2bc'; ivory='#ffefd0'; pale='#fff8dc'; peach='#d99b80'; salmon='#bd8070'; cold='#829b94'; glass='#8fbeb9'; teal='#417e7a'; gold='#d4ad71'; brown='#855c49'
def rect(x,y,X,Y,c): d.rectangle((int(x),int(y),int(X),int(Y)),fill=c)
def line(points,c,w=1):d.line([(int(x),int(y)) for x,y in points],fill=c,width=w)
def poly(points,c):d.polygon([(int(x),int(y)) for x,y in points],fill=c)
def ell(x,y,X,Y,c): d.ellipse((int(x),int(y),int(X),int(Y)),fill=c)
def arc(x,y,X,Y,begin,end,c,w=1):d.arc((x,y,X,Y),begin,end,fill=c,width=w)
def box(x,y,w,h,c,th=1):
 rect(x,y,x+w-1,y+h-1,ink);rect(x+th,y+th,x+w-th-1,y+h-th-1,c)
def arch(x,y,w,h,c):
 ell(x,y,x+w,y+w*.45,c);rect(x,y+w*.23,x+w,y+h,c)
def leaf(x,y,length,angle,c,width=2):
 dx=length*math.cos(angle);dy=length*math.sin(angle)
 poly([(x,y),(x+dx*.56-dy/length*width,y+dy*.56+dx/length*width),(x+dx,y+dy),(x+dx*.46+dy/length*width,y+dy*.46-dx/length*width)],c)
def foliage(x,y,w,h):
 for i in range(int(w*h*.062)):
  a=rng.random()*6.28;rr=rng.random()**.55;xx=x+math.cos(a)*rr*w/2; yy=y+math.sin(a)*rr*h/2
  c=rng.choice(['#275d4d','#36725a','#498768','#709c6b','#87ae75','#a6ba7a'] if yy<y+2 else ['#2e6352','#39715a','#539067'])
  poly([(xx-3,yy),(xx-1,yy-2),(xx+3,yy-1),(xx+4,yy+1),(xx+1,yy+3),(xx-3,yy+2)],c)
def plant(x,y,s=1,palms=False):
 # y is foot of planter
 ww=11*s;hh=16*s
 ell(x-ww-3,y-3,x+ww+5,y+3,'#989b82')
 poly([(x-ww,y-hh),(x+ww,y-hh),(x+ww*.73,y),(x-ww*.67,y)],'#9a7660');poly([(x-ww+2,y-hh+2),(x+ww-2,y-hh+2),(x+ww*.65,y-2),(x-ww*.6,y-2)],'#d4a481')
 ell(x-ww-1,y-hh-3,x+ww+1,y-hh+3,'#dcb899');ell(x-ww+1,y-hh-2,x+ww-1,y-hh+1,'#665c46')
 for i in range(4):
  l=rng.uniform(15,29)*s;xx=x+rng.uniform(-3,3)*s;top=y-hh-l
  line([(xx,y-hh),(xx-1,top)],'#8d7951',max(1,int(2*s)))
  if palms:
   for k in range(9):
    ang=k*.69+rng.uniform(-.2,.2);length=rng.uniform(13,21)*s; tipx=xx+math.cos(ang)*length; tipy=top+math.sin(ang)*length*.55
    line([(xx,top),(xx+(tipx-xx)*.53,top+(tipy-top)*.55-4*s),(tipx,tipy)],'#54845b',max(1,int(2*s)))
    for v in range(1,8):
     u=v/9; lx=xx+(tipx-xx)*u;ly=top+(tipy-top)*u-math.sin(u*3.14)*4*s
     leaf(lx,ly,(1-u*.6)*9*s,ang+.9,['#417652','#669361','#829d62'][v%3],1.7*s)
     leaf(lx,ly,(1-u*.6)*7*s,ang-.6,'#67975f',1.5*s)
  else:foliage(xx,top,15*s,12*s)
def brasslight(x,y,scale=1):
 line([(x,y),(x,y+8*scale)],'#6d6857',2);ell(x-5*scale,y+7*scale,x+5*scale,y+13*scale,'#e6bb75');ell(x-3*scale,y+10*scale,x+3*scale,y+15*scale,'#fff4b3')
def bench(x,y,s=1):
 for tx in [0,39]:rect(x+tx*s,y,x+(tx+3)*s,y+9*s,'#53675c')
 for i in range(3):
  poly([(x-3*s,y-(i+1)*2*s),(x+38*s,y-(i+1)*2*s),(x+43*s,y-i*2*s),(x+2*s,y-i*2*s)],['#b58c62','#ccab80','#b58f6a'][i])
 for tx in [1,36]:line([(x+tx*s,y-9*s),(x+tx*s,y+2*s)],'#475f55',max(2,int(2*s)))
 rect(x-2*s,y-12*s,x+39*s,y-9*s,'#ae8768');rect(x-2*s,y-12*s,x+39*s,y-11*s,'#e8c39b')
# Start with a fully illustrated, perspective-correct mall section.
W,H=1152,672
im=Image.new('RGB',(W,H));d=ImageDraw.Draw(im)
# Air outside the barrel-vault skylight
for y in range(146):
 t=y/146;rect(0,y,W,y,tuple(round(a*(1-t)+b*t) for a,b in zip((146,202,205),(223,229,188))))
poly([(0,66),(76,27),(124,51),(205,28),(278,62),(343,17),(427,54),(552,33),(692,53),(781,29),(883,56),(967,22),(1091,57),(1152,32),(1152,152),(0,152)],'#9fbba5')
for i in range(27):
 x=12+i*44+rng.randint(-4,4);y=rng.randint(55,94);w=rng.randint(13,29)
 rect(x,y,x+w,143,'#bccbc0');rect(x+w-4,y+2,x+w,143,'#a2b4ac')
 for j in range(0,40,5):
  for k in range(1,w-4,5):rect(x+k,y+3+j,x+k+2,y+4+j,'#94ada9')
# Skylight panels with glazing and an arched grid.
def roofY(x,distance):
 a=abs((x-W/2)/(W/2));return 5+distance**1.68*122+a**1.7*(37-distance*8)
for j in range(1,7):
 y=j/6
 pts=[(x,roofY(x,y)) for x in range(-12,W+15,6)]
 line(pts,'#47837e',4 if j%2==0 else 2);line([(x,yy-1) for x,yy in pts],'#d6e2c9',2)
for i in range(-2,17):
 x0=i*94-77
 x1=576+(x0-576)*.81
 poly([(x0-3,0),(x0+2,0),(x1+2,roofY(x1,1)),(x1-3,roofY(x1,1))],'#6b9e94')
 line([(x0-3,0),(x1-3,roofY(x1,1))],'#e9e7ca',2)
for x in [30,320,576,832,1122]:
 tx=576+(x-576)*.81;ty=roofY(tx,1)
 line([(x,0),(tx,ty)],'#728c7a',12);line([(x-2,0),(tx-2,ty)],'#f0e5c8',8)
# Architectural cornices, apricot mosaic soffits and glazed back wall
for y,c in [(139,'#8d9783'),(143,'#d2bea0'),(147,'#b09b82'),(150,'#f1dfba'),(154,'#d7b594')]:rect(0,y,W,y+4,c)
rect(0,158,W,469,'#d6b89d')
for floor,(top,bottom) in enumerate([(159,292),(333,469)]):
 for y in range(top+3,bottom,7):
  line([(0,y),(W,y)],'#c9a98c')
  for x in range((y%14)*2,W,23):line([(x,y),(x,y+6)],'#e0c4a4')
 for idx,cx in enumerate([235,576,917]):
  bx=cx-115;by=top+6;bw=230;bh=bottom-by-7
  box(bx-5,by-3,bw+10,bh+7,'#b3987d',2);box(bx-2,by,bw+4,bh+1,'#d6c5a6',2)
  rect(bx+2,by+3,bx+bw-2,by+bh-2,'#66746a')
  for xx in [bx-6,bx+bw+1]:
   rect(xx,by+2,xx+5,bottom-5,'#cab39c');rect(xx+1,by+2,xx+2,bottom-5,'#e9d7b8')
  for tx in [cx-135,cx+135]:brasslight(tx,by+15,1.2)
# glass parapet, upper walkway and band of jade ceramic
rect(0,284,W,300,'#e4d5b6');rect(0,298,W,321,'#bf957c');rect(0,304,W,311,'#debba0')
for x in range(0,W,11):line([(x,305),(x,311)],'#ba8d77')
rect(0,315,W,318,'#60877c');rect(0,319,W,323,'#a2bb9d');rect(0,324,W,328,'#eddabd');rect(0,329,W,333,'#947c67')
for left,right in [(0,84),(356,443),(709,794),(1064,W)]:
 rect(left,271,right,284,'#a3c4b5');line([(left,267),(right,267)],'#4a776d',3);line([(left,266),(right,266)],'#e4e1bd',2)
 for xx in range(left+2,right,22):line([(xx,267),(xx,285)],'#758e81',2)
# column pilasters, mint tile rings, lamps, roof struts.
for x in [68,404,749,1084]:
 for top,bottom in [(148,292),(326,470)]:
  poly([(x-10,top),(x+11,top),(x+7,bottom-7),(x+9,bottom),(x-10,bottom),(x-8,bottom-8)],'#b38977')
  rect(x-7,top+4,x+4,bottom-5,'#ecc8ab');rect(x-7,top+4,x-4,bottom-5,'#f4d8b9');rect(x+3,top+3,x+6,bottom-6,'#dba88b')
  for oy,c in [(top,'#9fb4a1'),(top+3,'#628e81'),(top+7,'#f3d6b5'),(bottom-7,'#698d7d'),(bottom-4,'#aab79b')]:rect(x-11,oy,x+11,oy+2,c)
# Lower promenade in receding perspective, patterned stone tiles
rect(0,469,W,H,'#e8d4b5')
for j in range(0,15):
 y=469+int(3*j+.78*j*j)
 if y>H:break
 rect(0,y,W,y,'#c6b69b')
 if j in [3,8,12]:rect(0,y+1,W,y+max(2,j//2),'#a8b5a0');rect(0,y+2+j//2,W,y+3+j//2,'#c2b797')
for i in range(-27,28):
 x=W/2+i*47
 line([(x,469),(W/2+i*71,H)],'#c8b79b')
# oval central terrazzo compass medallion
for w,h,c in [(172,27,'#bcc1a6'),(168,25,'#65958b'),(161,22,'#e5d3a9'),(148,19,'#a4b9a0'),(139,17,'#e5d5b0')]:ell(576-w,552-h,576+w,552+h,c)
for a in range(0,360,45):
 rad=math.radians(a);left=rad+.42;right=rad-.42
 poly([(576,552),(576+34*math.cos(left),552+6*math.sin(left)),(576+98*math.cos(rad),552+14*math.sin(rad)),(576+34*math.cos(right),552+6*math.sin(right))],'#839f90')
# Escalator with metal handrail at far right, tucked clear of shop fronts
def escalator(x,y,dx,dy):
 pts=[(x,y),(x+dx,y+dy),(x+dx+25,y+dy+3),(x+25,y+4)]
 poly(pts,'#7c9185')
 for step in range(0,46):
  t=step/46;xx=x+dx*t;yy=y+dy*t
  line([(xx+1,yy),(xx+23,yy+3)],'#d5c7a9',2)
 for k in [0,23]:
  poly([(x+k,y),(x+dx+k,y+dy),(x+dx+k,y+dy-12),(x+k,y-12)],'#8daca3')
  line([(x+k,y-12),(x+dx+k,y+dy-12)],'#3f605a',4);line([(x+k,y-14),(x+dx+k,y+dy-14)],'#d4d6b8',2)
escalator(1120,492,-66,-187)
# Upper balcony gardens and ground planters
for x in [42,397,749,1096]:plant(x,286,1)
for x in [52,401,752]:plant(x,475,1.25,True)
bench(332,507,.89);bench(715,506,.9);bench(943,586,1.2)
for x,y,s in [(22,574,1.7),(935,593,1.12),(1135,623,1.8),(342,512,.93)]:plant(x,y,s,True)
# Pendant lighting, hung from the glass trusses
for x,top in [(92,79),(404,82),(748,82),(1061,79)]:
 line([(x,top),(x,151)],'#68796b',2);poly([(x-12,158),(x-8,152),(x+8,152),(x+12,158)],'#638f82');ell(x-12,156,x+12,161,'#fae2a3');line([(x-11,159),(x+11,159)],'#ac9976')
im.save('assets/mall.webp',quality=93,method=6)
# Individual glazed shopfronts slot into the six recessed bays across the atrium.
colors={'donut':('#a95362','#e6a4a6','#ecc6ac'),'tea':('#32766c','#9fbfa1','#ddc99d'),'game':('#575876','#a5a3c7','#86869b'),'cafe':('#7d5946','#bd946e','#caba9b'),'sushi':('#405f69','#cfc8ab','#cda878'),'market':('#5c7856','#b2be86','#dbd2a8'),'hotpot':('#9b5348','#d2a378','#c3a37e'),'renovating':('#777e72','#c3b791','#a59f8a')}
def tray(x,y,w,h):
 poly([(x+3,y),(x+w,y),(x+w-2,y+h),(x,y+h)],'#7d7f71');line([(x+2,y+1),(x+w-1,y+1)],'#dfcfad');line([(x,y+h),(x+w-2,y+h)],'#c9b99e')
def cup(x,y,c=cream):
 poly([(x,y),(x+6,y),(x+5,y+8),(x+1,y+8)],c);rect(x,y-1,x+6,y,'#edded0')
def lamp(x,y):
 line([(x,27),(x,y)],ink);poly([(x-5,y+4),(x-3,y),(x+3,y),(x+5,y+4)],gold);line([(x-4,y+5),(x+4,y+5)],'#fff0ad',2)
def frame(x,y,w,h,c):box(x,y,w,h,c);line([(x+1,y+1),(x+w-2,y+1)],ivory)
for typ,(trim,stripe,wall) in colors.items():
 im=Image.new('RGB',(230,116),wall);d=ImageDraw.Draw(im)
 rect(0,0,229,28,trim);rect(2,2,227,3,stripe);rect(3,25,226,26,stripe)
 # Receding vestibule; highlights on mullions and shop threshold.
 poly([(0,28),(12,33),(12,101),(0,115)],'#776f60')
 poly([(230,28),(217,33),(217,101),(230,115)],'#8d7f67')
 rect(11,33,217,101,wall);poly([(0,114),(12,101),(217,101),(230,114)],'#beab91')
 line([(2,112),(227,112)],'#8e8a77');line([(1,114),(228,114)],'#e3d7b8',2)
 # Door frame located differently for the tenant, drawn into its own wall.
 if typ!='renovating':
  for x in range(14,216,6):line([(x,34),(x,97)],'#ead6b2' if typ in ['donut','market'] else wall,1)
  for x in [32,87,148,195]:lamp(x,37+(x%4))
  # counter staff, varied face and apron
  px={'donut':116,'tea':109,'cafe':163,'sushi':106,'market':68,'game':137,'hotpot':144}[typ]
  ell(px-4,52,px+3,60,'#a36f55');rect(px-4,53,px+2,58,'#d2a181');rect(px-5,51,px+3,54,'#5b5144')
  poly([(px-4,60),(px+3,60),(px+7,70),(px-8,70)],cream);rect(px-3,62,px+3,70,trim)
 if typ=='donut':
  for y in [50,61]:
   rect(19,y,86,y+2,'#9f795d');line([(20,y),(85,y)],'#efcc9a')
   for x in range(24,85,13):ell(x,y-6,x+9,y-1,'#d99476');rect(x+4,y-4,x+5,y-3,'#bf9e78')
  frame(32,70,135,30,'#cb9a86');rect(36,73,163,91,'#e1c4a8');rect(36,81,162,82,'#ad9982')
  for row in range(2):
   for c in range(11):
    x=39+11*c;y=74+9*row;ell(x,y,x+7,y+4,['#b77153','#d99496','#e2b678'][c%3]);rect(x+3,y+2,x+4,y+2,'#b9a389')
  for x in [37,100,160]:line([(x,72),(x,92)],'#eee3c9',2)
  for x in [174,191]:cup(x,78);rect(x-3,88,x+11,89,'#976f58')
 elif typ=='tea':
  rect(16,53,89,55,brown);rect(16,64,89,66,brown)
  for j in [0,1]:
   for x in range(20,85,11):
    box(x,42+j*11,8,10,'#ae9b6c');rect(x+1,42+j*11,x+6,44+j*11,ivory);rect(x+2,47+j*11,x+5,49+j*11,'#e6cd95')
  frame(27,74,169,26,'#b89565')
  for x in range(29,193,5):line([(x,76),(x,98)],'#977a51')
  rect(24,72,198,75,'#e6d1a9')
  for x in [65,74,83,126,135,144]:cup(x,63,'#c38d5d');rect(x+3,61,x+3,63,'#e5b4aa');rect(x+2,68,x+4,69,'#685946')
  for x in [160,173]:box(x,52,10,20,'#a3aaa0');rect(x+2,55,x+8,58,'#d8d8ba');rect(x+3,62,x+7,69,'#6d766c')
  plant(209,103,.55)
 elif typ=='game':
  for x in [24,55,84,153,183]:
   rect(x,56,x+21,88,'#565772');frame(x-1,50,24,17,'#394c61');rect(x+2,53,x+19,62,'#59928f')
   for u in range(8):rect(x+rng.randint(3,17),55+rng.randint(0,5),x+17,59+rng.randint(1,2),'#7cb0a7')
   poly([(x-2,71),(x+19,71),(x+22,75),(x-4,75)],'#9996ac');rect(x+2,71,x+3,73,'#d29790');rect(x+14,73,x+17,73,gold);rect(x+2,78,x+19,87,'#404c64')
  frame(107,78,37,21,'#867b92');rect(113,73,126,77,'#494e64');rect(117,70,129,72,'#577475')
 elif typ=='cafe':
  for y in [51,63]:
   rect(23,y,90,y+2,brown)
   for x in range(27,85,11):cup(x,y-8,'#e6dac4')
  frame(68,75,135,24,'#966e54')
  for x in range(70,199,6):line([(x,77),(x,98)],'#775e48')
  rect(65,72,206,76,'#e6d8ba');frame(100,58,34,14,'#70857b');rect(106,62,128,66,'#d3cfad')
  for x in [105,119]:cup(x,65)
  for x in [24,43]:rect(x,84,x+2,104,brown)
  ell(16,79,54,86,'#825e46');ell(16,78,54,84,'#b08d65');plant(212,101,.58)
 elif typ=='sushi':
  for x in range(24,213,22):
   rect(x,27,x+18,48,'#526e76');line([(x+2,29),(x+2,45)],'#81928e');line([(x+9,35),(x+10,39)],'#cfc6a8',2)
  frame(17,73,194,27,'#b78d60');rect(15,69,212,73,'#e2c59a')
  for x in range(23,205,12):
   tray(x,65,10,4);ell(x+2,62,x+8,66,'#efe5c5');ell(x+1,61,x+8,64,'#d48a67')
  for x in [31,71,112,152,193]:rect(x,92,x+2,105,ink);ell(x-4,90,x+8,94,'#724b3c');ell(x-4,88,x+8,92,'#b07b58')
 elif typ=='market':
  for start in [19,149]:
   frame(start,41,61,49,'#8da89b')
   for y in [52,64,76,87]:
    rect(start+3,y,start+56,y+1,'#c4b299')
    for x in range(start+5,start+55,6):
     col=rng.choice(['#c58f69','#759f8d','#e3be82','#d69b91','#e3d1aa']);rect(x,y-6,x+3,y-1,col);rect(x+1,y-8,x+2,y-7,'#d5d2be')
  frame(77,77,69,22,'#9c9d75');rect(78,75,145,78,ivory);frame(92,67,15,10,'#667a6e')
  for x in [24,153,181]:
   frame(x,90,23,13,'#a38663')
   for i in range(7):xx=x+3+rng.randint(0,15); yy=90+rng.randint(-3,2);ell(xx,yy,xx+5,yy+3,rng.choice(['#b8795d','#dcab67','#7ca16c']))
 elif typ=='hotpot':
  for x in [28,77,158,202]:
   line([(x,30),(x,41)],ink);ell(x-6,40,x+6,51,'#ba6a4f');rect(x-4,46,x+4,47,'#e19e69');rect(x-2,51,x+2,53,'#ddb36f')
  for x in [37,97,168]:
   rect(x+6,83,x+9,99,brown);ell(x-14,79,x+29,86,'#9e7052');ell(x-14,76,x+29,83,'#cda478');ell(x-4,71,x+13,79,'#585d50');ell(x-3,71,x+12,74,'#cb9969');rect(x+2,69,x+6,71,'#869e73')
   for bx in [x-11,x+20]:rect(bx,86,bx+2,101,ink);rect(bx-3,84,bx+6,87,'#93654f')
 else:
  for y in range(31,106,5):rect(7,y,222,y+4,'#869085');rect(7,y,222,y+1,'#a5aa98');rect(7,y+4,222,y+4,'#626e66')
  for x in [10,113,215]:rect(x,30,x+2,107,'#737e71')
  for x in [24,184]:
   line([(x,105),(x+6,83),(x+13,106)],brown,3);rect(x-3,89,x+17,95,'#d5b16f')
   for x2 in [x,x+8]:line([(x2,95),(x2+4,89)],'#45554a',3)
 # exterior threshold and projecting canopy, distinctive to each tenant
 if typ in ['donut','cafe','tea','market']:
  for x in range(0,229,14):
   col=stripe if x%28==0 else '#ebdabc'
   poly([(x+1,24),(x+14,24),(x+15,32),(x,32)],col)
   rect(x,32,x+13,35,trim if x%28==0 else '#c6b99e');ell(x+1,32,x+12,38,trim if x%28==0 else '#d2c9ab')
 elif typ!='sushi':rect(0,26,229,29,stripe);rect(0,30,229,31,trim)
 for x in [0,226]:rect(x,31,x+3,112,trim);rect(x+1,32,x+1,111,stripe)
 im.save(out/('front-'+typ+'.webp'),quality=96,method=6)

from PIL import ImageEnhance
r=random.Random(492);w=Path('assets/world')
fonts=['/System/Library/Fonts/Avenir Next Condensed.ttc','/System/Library/Fonts/Helvetica.ttc']
def font(size):
 for f in fonts:
  try:return ImageFont.truetype(f,size,index=5 if 'Avenir' in f else 0)
  except OSError:pass
 return ImageFont.load_default()
def label(draw,xy,text,size,ink,anchor='mm'):draw.text(xy,text,font=font(size),fill=ink,anchor=anchor)
im=Image.open('assets/mall.webp').convert('RGBA');im=ImageEnhance.Color(im).enhance(1.14)
film=Image.new('RGBA',im.size);s=ImageDraw.Draw(film)
# angled sunlit glazing and a broken reflection of the atrium roof on the terrazzo
for x in [70,265,488,730,932]:
 s.polygon([(x,0),(x+32,0),(x-80,132),(x-122,132)],fill=(255,247,203,28))
for x in [-80,106,402,615,891,1070]:
 s.polygon([(x,471),(x+81,471),(x-99,672),(x-239,672)],fill=(255,246,192,33))
 s.line([(x+4,471),(x-146,672)],fill=(99,131,117,20),width=5)
for y in [481,499,533,595,662]:
 s.line([(-5,y),(1155,y-6)],fill=(237,242,205,25),width=2)
im=Image.alpha_composite(im,film);d=ImageDraw.Draw(im)
def plank(x,y,ww,hh,fill,stroke='#3b665e'):
 d.rectangle([x,y,x+ww,y+hh],fill=stroke);d.rectangle([x+1,y+1,x+ww-1,y+hh-1],fill=fill)
def flowerpot(x,y):
 d.line((x-9,y-25,x,y),fill='#776f58',width=1);d.line((x+9,y-25,x,y),fill='#776f58')
 d.ellipse((x-12,y-8,x+12,y+6),fill='#927658');d.ellipse((x-12,y-10,x+12,y-2),fill='#487455')
 for i in range(71):
  xx=x+r.randint(-11,11); yy=y+r.randint(-9,1);sz=r.randrange(1,4);d.ellipse((xx,yy,xx+sz,yy+sz),fill=r.choice(['#447659','#5e8c5f','#89ae73','#96b87a','#cfa597','#df9e93','#d6b578']))
 for off in [-9,6]:
  d.line((x+off,y-4,x+off*1.3,y+11),fill='#48775a',width=1)
  for i in range(0,13,3):d.rectangle((x+off-1,y+i-4,x+off+1,y+i-3),fill='#7ea36a')
for x in [96,372,779,1056]:
 d.line((x,98,x,120),fill='#7a8170',width=1);flowerpot(x,138)
# Real in-world wayfinding and floor bands, printed onto architecture.
for x in [406,752]:
 d.line((x-13,165,x+13,165),fill='#7f705c',width=3)
 d.polygon([(x-10,166),(x+10,166),(x+10,213),(x,207),(x-10,213)],'#577d70')
 d.polygon([(x-6,171),(x,168),(x+6,171),(x,176)],'#dbc68d')
 label(d,(x,188),'L1',12,'#fff1ca')
 d.line((x-4,198,x+4,198),fill='#d3cba1',width=1)
 d.line((x-13,345,x+13,345),fill='#7f705c',width=3)
 d.polygon([(x-10,345),(x+10,345),(x+10,391),(x,386),(x-10,391)],'#a26e55')
 label(d,(x,365),'G',13,'#fff1ca');d.line((x-4,375,x+4,375),fill='#e8cda3')
# Freestanding doubled-sided notice board near the station escalator
d.polygon([(843,472),(847,475),(843,499),(839,499)],'#786a57');d.polygon([(817,471),(820,472),(824,497),(820,497)],'#83745a')
plank(815,456,32,31,'#d0ad85','#836e56');plank(818,459,26,23,'#e2caa0','#ae8661')
for i,(x,y) in enumerate([(820,462),(833,461),(825,473)]):
 d.rectangle((x,y,x+8,y+8),fill=['#d9a193','#88a998','#bcbbd0'][i]);d.line((x+1,y+2,x+6,y+2),fill='#ece4ca')
# Upper level glass balcony rail, continuous and in front of each unit's sill.
for x in range(13,1147,50):
 d.line((x,293,x+2,300),fill='#859689',width=2)
d.line((0,294,1152,294),fill='#aebfae',width=2);d.line((0,292,1152,292),fill='#f2e6bf',width=2)
# Central hanging arcade clock and title, physically suspended under the roof.
for x in [508,644]:d.line((x,98,x,124),fill='#747e6d',width=2)
plank(499,121,154,23,'#487567','#687d67');d.line((501,123,650,123),fill='#cfcb9b')
label(d,(578,133),'M C P   C E N T R A L',12,'#f7e8bd')
# Mall fountain, glazed turquoise ceramic bowl, small upward water jet.
cx,cy=879,551
for rx,ry,col in [(60,17,'#acaa90'),(58,16,'#898e7c'),(57,15,'#bec5a9')]:
 d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=col)
for ox,oy,rx,ry,col in [(0,-5,56,15,'#e0cfaa'),(0,-5,51,12,'#648e83'),(0,-6,48,10,'#97bcb0'),(0,-7,42,8,'#91b7ac')]:
 d.ellipse((cx+ox-rx,cy+oy-ry,cx+ox+rx,cy+oy+ry),fill=col)
for i in range(35):
 x=cx+r.randint(-39,38);y=cy+r.randint(-11,-5);d.line((x,y,x+r.randrange(1,5),y),fill=r.choice(['#c7d8bd','#b1ccbb','#7da69e']))
for k in range(6):
 a=k*math.pi/3
 pts=[(cx+int(math.cos(a)*t*29),cy-7+int(math.sin(a)*t*6-23*4*t*(1-t)))for t in [i/16 for i in range(17)]]
 d.line(pts,fill='#caded0',width=2)
d.line((cx,cy-7,cx,cy-40),fill='#d7e4d5',width=2);d.line((cx+2,cy-9,cx+1,cy-30),fill='#aecdc0',width=2)
# A handful of shoppers occupy both promenades.
for x,y,key,sz in [(143,297,'jo',24),(639,303,'mei',23),(886,305,'kit',23),(118,486,'mei',29),(660,477,'jo',28),(1035,495,'kit',29)]:
 s=Image.open(w/(key+'.png')).resize((sz,sz),Image.Resampling.NEAREST).convert('RGBA');im.alpha_composite(s,(x,y-sz))
im.convert('RGB').save('assets/mall.webp',quality=95)
for p in sorted(w.glob('front-*.webp')):
 typ=p.stem[6:]
 if typ=='renovating':continue
 im=Image.open(p).convert('RGB');im=ImageEnhance.Color(im).enhance(1.16);d=ImageDraw.Draw(im)
 # Printed tenant menu board using the same illustrated items as the player's ballot.
 item=Image.open('assets/items/'+typ+'.webp').convert('RGB');item.thumbnail((30,24),Image.Resampling.LANCZOS)
 x,y={'donut':(175,40),'tea':(16,38),'game':(104,35),'cafe':(22,38),'sushi':(173,48),'market':(98,34),'hotpot':(89,35)}[typ]
 d.rectangle((x-2,y-2,x+33,y+29),fill='#796d55');d.rectangle((x-1,y-1,x+32,y+28),fill='#dfc496');d.rectangle((x,y,x+31,y+27),fill='#f5e5be')
 im.paste(item,(x+16-item.width//2,y+11-item.height//2))
 d.line((x+4,y+24,x+13,y+24),fill='#9e795b');d.line((x+17,y+24,x+25,y+24),fill='#c4a880')
 # warm reflected tile, menu tickets, till and highlighted glass edges.
 for i in range(4):d.line((63+i*6,105,62+i*6,107),fill='#ccb99b')
 if typ in ['donut','tea','cafe','market','sushi']:
  d.rectangle((146,78,154,83),fill='#c2a57a');d.rectangle((147,79,153,81),fill='#e1d2b4')
 im.save(p,quality=96)
