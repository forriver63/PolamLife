from PIL import Image, ImageDraw, ImageFont, ImageColor
from pathlib import Path
from math import sin,cos,pi
from functools import lru_cache
from collections import deque
import random
# Run from any directory. Requires Pillow and NumPy. This script rebuilds the
# eight retail interiors from original geometry and the project's item illustrations.
ROOT = Path(__file__).resolve().parents[1]
@lru_cache(maxsize=96)
def font(face, size):
    # Pillow uses the named system face on macOS, with free alternatives elsewhere.
    for name in (face, 'DejaVuSansCondensed-Bold.ttf', 'LiberationSans-Bold.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)

W,H=768,432
paper='#fff1d1'
ink='#3f453d'
def rgb(c): return ImageColor.getrgb(c) if isinstance(c,str) else tuple(c[:3])
def mix(a,b,f): return tuple(int(x+(y-x)*f) for x,y in zip(rgb(a),rgb(b)))
def tone(a,f): return mix(a,'#282b31',f) if f>0 else mix(a,'#fff1d7',-f)
def rect(box,c,o=None,w=1): d.rectangle(box,fill=c,outline=o,width=w)
def poly(pts,c,o=None): d.polygon(pts,fill=c,outline=o)
def line(pts,c,w=1): d.line(pts,fill=c,width=w)
def ell(box,c,o=None,w=1): d.ellipse(box,fill=c,outline=o,width=w)
def rr(box,r,c,o=None,w=1): d.rounded_rectangle(box,r,fill=c,outline=o,width=w)
def txt(x,y,s,size,col=ink,face='DIN Condensed Bold.ttf',anchor='la',sw=0,stroke=None):
 d.text((x,y),s,anchor=anchor,font=font(face,size),fill=col,stroke_width=sw,stroke_fill=stroke)
products={}
for p in (ROOT/'assets/items').glob('*.webp'):
 im=Image.open(p).convert('RGBA');pix=im.load();q=deque([(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]);seen=set()
 while q:
  x,y=q.popleft()
  if (x,y) in seen or not(0<=x<im.width and 0<=y<im.height):continue
  seen.add((x,y));r,g,b,a=pix[x,y]
  if r<220 or g<202 or b<157 or max(r,g,b)-min(r,g,b)>85:continue
  pix[x,y]=(0,0,0,0);q.extend(((x-1,y),(x+1,y),(x,y-1),(x,y+1)))
 products[p.stem]=im.crop(im.getbbox())
def item(k,x,y,size):
 im=products[k];r=size/max(im.size);z=im.resize((max(1,int(im.width*r)),max(1,int(im.height*r))),Image.Resampling.LANCZOS)
 scene.paste(z,(int(x-z.width/2),int(y-z.height)),z)
def shadow(x,y,w=26):
 ell((x-w,y-w*.16,x+w,y+w*.16),tone(floor,.24))
def person(x,y,s,shirt,hair='#4b3833',hat=False,back=False):
 # Individual silhouettes, aprons and faces with a warm two-value pixel palette.
 def xy(a,b): return (round(x+a*s),round(y+b*s))
 def b(a,c,e,f): return (*xy(a,c),*xy(e,f))
 def R(bb,color): rect(b(*bb),color)
 def P(pts,color,o=None):poly([xy(*a) for a in pts],color,o)
 def E(bb,color,o=None):ell(b(*bb),color,o)
 shadow(x,y,18*s)
 R((-8,-17,-2,-2),'#455357');R((3,-17,9,-2),'#3d454a');R((-10,-4,-2,0),'#3c3d3b');R((3,-3,13,0),'#353b39')
 P([(-12,-36),(-6,-41),(4,-40),(12,-36),(15,-20),(9,-17),(-9,-17),(-15,-21)],shirt,ink)
 R((-14,-23,-11,-17),'#ca906b');R((11,-23,15,-17),'#dfa478')
 if hat:
  R((-7,-33,7,-17),'#f2ddbe');R((-7,-38,-5,-30),'#e4cfab');R((5,-37,7,-31),'#e4cfab')
 E((-10,-60,10,-37),'#d39d78',ink);E((-8,-56,9,-38),'#edbf96')
 P([(-11,-52),(-10,-59),(-4,-64),(4,-63),(10,-58),(11,-50),(7,-51),(4,-56),(1,-53),(-4,-54),(-8,-47),(-10,-47)],hair)
 if not back:
  R((-5,-49,-4,-47),'#533c31');R((4,-49,5,-47),'#533c31');R((0,-43,3,-43),'#ad7262')
 else:E((-10,-61,10,-42),hair)
 if hat:
  R((-11,-61,10,-56),'#f4e2c1');E((-10,-66,10,-57),'#f7edda',ink);R((-12,-58,12,-56),shirt)
def plant(x,y,s=1):
 def P(points,c,o=None):poly([(x+a*s,y+b*s) for a,b in points],c,o)
 shadow(x,y,17*s);P([(-13,-20),(13,-20),(9,0),(-9,0)],'#b87959',ink);P([(-16,-22),(15,-22),(14,-17),(-15,-17)],'#d9ae82',ink)
 for i in range(14):
  ang=i*2*pi/14+.2;dx=cos(ang)*random.uniform(8,25);dy=-random.uniform(14,32)+sin(ang)*4
  P([(0,-21),(dx*.35-3,dy-23),(dx,dy-24),(dx*.67+3,dy-21)],random.choice(['#55795a','#6b8c60','#78965f','#90aa73','#3c6350']))
def lamp(x,end,kind=0):
 line([(x,0),(x,end-13)],'#524b41',2)
 if kind==1:
  rr((x-15,end-26,x+15,end+1),8,'#c66c57','#6d463c',2)
  for dy in [-20,-13,-6]:line([(x-14,end+dy),(x+14,end+dy)],'#e28d67')
  rect((x-7,end-29,x+7,end-26),'#926449');line([(x,end+1),(x,end+9)],'#ba854e',2)
 elif kind==2:
  rect((x-31,end-13,x+31,end-3),'#3c414d');rect((x-29,end-10,x+29,end-6),'#b4a4eb');line([(x-25,end-5),(x+26,end-5)],'#d4cafa')
 else:
  poly([(x-5,end-18),(x+5,end-18),(x+18,end-1),(x+17,end+2),(x-17,end+2),(x-18,end)],'#b69160',ink)
  ell((x-17,end-2,x+17,end+4),'#ffe3a0','#94754f');rect((x-3,end-20,x+3,end-16),'#796c58')
def poster(x,y,w,h,hero,caption):
 rect((x+2,y+3,x+w+2,y+h+3),tone(wall,.22));rect((x,y,x+w,y+h),wood,ink,2);rect((x+4,y+4,x+w-4,y+h-4),paper)
 item(hero,x+w/2,y+h-18,min(w*.76,h*.70))
 txt(x+w/2,y+h-9,caption,9,trim,'DIN Alternate Bold.ttf','mm')
def jars(x,y,n,h=16):
 for j in range(n):
  xx=x+j*13;hh=h+(j%3)*2
  rr((xx,y-hh,xx+9,y-1),2,['#b58360','#788e6f','#b99a72','#8d715d'][j%4],ink)
  rect((xx+1,y-hh-2,xx+8,y-hh+1),'#b9a582',ink);rect((xx+1,y-hh+5,xx+8,y-5),'#e7d4ad');rect((xx+2,y-hh+7,xx+6,y-hh+8),trim)
def shelf(x,y,w):
 rect((x+2,y+2,x+w+2,y+7),tone(wall,.28));rect((x,y,x+w,y+4),wood,ink);rect((x+3,y,x+w-2,y),tone(wood,-.35))
def counter(x,y,w,h,kind='flute'):
 rect((x+4,y+6,x+w+6,y+h+7),tone(floor,.3));rect((x,y,x+w,y+h),trim,ink,2)
 rect((x+2,y+4,x+w-2,y+10),tone(trim,.23));rect((x+2,y+h-6,x+w-2,y+h-2),tone(trim,.3))
 if kind=='flute':
  for xx in range(x+6,x+w-3,7):
   line([(xx,y+10),(xx,y+h-7)],tone(trim,.14),2);line([(xx+2,y+10),(xx+2,y+h-7)],tone(trim,-.14))
 elif kind=='panels':
  for xx in range(x+5,x+w-40,50):
   rect((xx,y+13,xx+44,y+h-11),tone(trim,.10),tone(trim,-.28),1);rect((xx+3,y+16,xx+41,y+h-14),trim,tone(trim,.2))
 elif kind=='bricks':
  for yy in range(y+11,y+h-6,10):
   line([(x+2,yy),(x+w-2,yy)],tone(trim,-.3));offset=12 if (yy-y)//10%2 else 0
   for xx in range(x+4+offset,x+w-2,24):line([(xx,yy),(xx,min(yy+9,y+h-6))],tone(trim,-.25))
 poly([(x-3,y),(x+7,y-11),(x+w-2,y-11),(x+w+3,y)],tone(wood,-.28),ink);rect((x-3,y,x+w+3,y+4),wood,ink);line([(x-2,y),(x+w+2,y)],tone(wood,-.55))
def till(x,y):
 poly([(x-14,y),(x-10,y-5),(x+8,y-5),(x+13,y)],'#555e58',ink);rect((x-2,y-13,x+2,y-4),ink)
 poly([(x-13,y-26),(x+10,y-26),(x+14,y-12),(x-9,y-12)],'#4a5954',ink);poly([(x-10,y-23),(x+8,y-23),(x+10,y-16),(x-8,y-16)],'#b2c9ae')
def stool(x,y,c):
 shadow(x,y,14);line([(x-6,y-17),(x-10,y)],ink,2);line([(x+6,y-17),(x+10,y)],ink,2);line([(x-7,y-8),(x+7,y-8)],wood,2)
 ell((x-13,y-24,x+13,y-15),tone(c,.2),ink);ell((x-14,y-26,x+13,y-18),c,ink)
def display_case(x,y,w,k):
 # Glazed pastry/refrigerated counter, two stocked tiers and diagonal window reflections.
 rect((x,y-44,x+w,y), '#9fbbb1',ink,2);rect((x+4,y-40,x+w-4,y-3),'#d7c4a6')
 for yy in [y-23,y-3]:
  for xx in range(x+13,x+w-5,21): item(k,xx,yy,18)
  rect((x+2,yy,x+w-2,yy+2),'#b8aca0',ink)
 for xx in (x,x+w//2,x+w):
  line([(xx,y-43),(xx,y)],'#e3e1cd',3)
 for xx in [x+5,x+w//2+6]:
  line([(xx,y-9),(xx+18,y-40)],'#e5e9d5',2);line([(xx+8,y-11),(xx+24,y-39)],'#d7ddd1')
 rect((x-2,y-48,x+w+2,y-44),'#bcb7a3',ink)
def fridge(x,y,w,h):
 rect((x,y,x+w,y+h),'#8e9a8b',ink,2);rect((x+3,y+5,x+w-3,y+16),trim,ink)
 for j in range(2):
  xx=x+4+j*(w//2-2);ww=w//2-4
  rect((xx,y+19,xx+ww,y+h-6),'#769494',ink)
  for row in range(4):
   yy=y+24+row*17
   for u in range(max(1,ww//7)):
    X=xx+3+u*7;rect((X,yy+2,X+4,yy+12),random.choice(['#ead299','#c68161','#9abb94','#d99c81']),ink)
   line([(xx+1,yy+13),(xx+ww-1,yy+13)],'#b7b9aa')
  line([(xx+3,y+57),(xx+ww-4,y+29)],'#d4eae0');rect((xx+ww-4,y+54,xx+ww-2,y+65),'#505c59')
def arcade(x,y,c):
 shadow(x+22,y+1,28)
 pts=[(x,y),(x+43,y),(x+45,y-35),(x+41,y-39),(x+40,y-51),(x+46,y-64),(x+43,y-93),(x+2,y-93),(x-1,y-66),(x+2,y-43),(x-2,y-36)]
 poly(pts,c,ink);rect((x+3,y-88,x+39,y-77),'#cfbde7',ink)
 for n in range(7):rect((x+5+n*5,y-86+(n%2)*2,x+7+n*5,y-80),'#735e93')
 poly([(x+4,y-74),(x+39,y-74),(x+37,y-48),(x+6,y-48)],'#384052',ink)
 rect((x+8,y-69,x+34,y-54),'#598d95')
 for j in range(8):rect((x+9+j*3,y-60-(j%3)*2,x+11+j*3,y-57-(j%3)*2),['#c2d27b','#e2bb99'][j%2])
 poly([(x+4,y-46),(x+39,y-46),(x+45,y-37),(x,y-37)],'#a49baa',ink);line([(x+11,y-42),(x+11,y-49)],ink,2);ell((x+9,y-51,x+13,y-47),'#da8976',ink)
 for j in [0,1]:ell((x+26+j*6,y-43,x+29+j*6,y-40),'#d5bd78',ink)
 rect((x+5,y-32,x+38,y-4),tone(c,.22),ink);rect((x+18,y-25,x+26,y-13),'#4a5057',ink)
def lampTable(x,y,w,k):
 shadow(x,y+25,w//2);rect((x-4,y,x+4,y+23),wood,ink);ell((x-14,y+21,x+14,y+26),ink)
 ell((x-w//2,y-8,x+w//2,y+5),wood,ink);ell((x-w//2,y-11,x+w//2,y+1),tone(wood,-.27),ink);item(k,x+2,y,25)
def urn(x,y):
 rr((x-10,y-32,x+10,y),5,'#b9a578',ink);ell((x-10,y-35,x+10,y-29),'#d5c798',ink);rect((x-3,y-37,x+3,y-34),ink);line([(x+2,y-6),(x+9,y-6),(x+9,y-1)],ink,2);rect((x-7,y-26,x-5,y-10),'#e1d8ab')
def chalkboard(x,y,w,h,s):
 rect((x,y,x+w,y+h),wood,ink,2);rect((x+4,y+4,x+w-4,y+h-4),'#34564c')
 txt(x+w/2,y+11,s,10,'#f3e1b7',anchor='mm')
 for j in range(3):
  yy=y+19+j*6;line([(x+9,yy),(x+16+j*5,yy)],'#bec7a8');line([(x+w-16,yy),(x+w-10,yy)],'#e5c490')
def canopy(y,colors):
 for xx in range(130,638,17):rect((xx,y,min(xx+16,637),y+10),colors[(xx//17)%2],None)
 line([(130,y+10),(637,y+10)],tone(wood,.2),2)
styles={
 'donut':('#d5948d','#f0dad1','#be9375','#ddc8a6','Glaze Lane','DONUT KITCHEN','Ring bakery'),
 'tea':('#4b9282','#c8ded1','#b99a6d','#d4cdb5','Pearl Club','MILK TEA LAB','Pearl milk'),
 'game':('#73698e','#b6b5c6','#827c8b','#b6b4bd','Pixel Port','GAMES & REPAIRS','Playroom'),
 'cafe':('#97775d','#d5c6a9','#a67b57','#ccba9f','Sunday Coffee','COFFEE ROASTERY','Roasted daily'),
 'sushi':('#556f81','#d5d9ce','#b7946f','#c7bda8','Roll Call','SUSHI BAR','Fresh nigiri'),
 'market':('#759364','#d4dabe','#b29368','#ccd0b5','Neighbour Mart','COMMUNITY GROCER','Daily goods'),
 'hotpot':('#b76450','#e1bd98','#9e7455','#c6aa86','Little Steam','HOTPOT HOUSE','Soup kitchen'),
 'renovating':('#828379','#c3bdaa','#9b8464','#c8b99d','MCP Central','SHOP REFIT','Crew at work')}
out=ROOT/'assets/interiors';out.mkdir(parents=True,exist_ok=True)
for k,(trim,wall,wood,floor,name,tag,short) in styles.items():
 random.seed(k)
 scene=Image.new('RGB',(W,H),rgb(wall));d=ImageDraw.Draw(scene)
 # A continuous perspective room. Joinery and ceiling coves frame the retail counter.
 poly([(0,0),(W,0),(639,49),(129,49)],tone(wall,.16))
 for j in [5,23,38]:
  line([(j*2,j),(W-j*2,j)],tone(wall,-.25),2)
 for x in range(-180,1001,63):line([(x,0),(round((x-384)*.63+384),48)],tone(wood,.24),3)
 poly([(0,0),(129,49),(129,228),(0,302)],tone(wall,.12),tone(wall,.25))
 poly([(W,0),(639,49),(639,228),(W,302)],tone(wall,-.08),tone(wall,.2))
 rect((129,48,639,228),wall)
 # Tile/board wall with consistent courses and a warm rim of reflected daylight.
 for row,y in enumerate(range(53,229,13)):
  line([(130,y),(638,y)],tone(wall,.10))
  for x in range(131+(row%2)*13,637,27):line([(x,y),(x,y+12)],tone(wall,.10))
 rect((129,45,639,51),wood,ink);rect((130,50,638,51),tone(wood,-.5))
 poly([(0,302),(129,228),(639,228),(768,302),(768,432),(0,432)],floor)
 dy=[228,239,253,271,294,324,361,406,463]
 vp=(384,141)
 for j in range(len(dy)-1):
  yy,zz=dy[j:j+2]
  for i in range(-22,23):
   def X(n,y):return 384+(n*32)*(y-141)/87
   c=tone(floor, (.065 if (j+i)%2 else -.025)+(random.random()-.5)*.035)
   poly([(X(i,yy),yy),(X(i+1,yy),yy),(X(i+1,zz),zz),(X(i,zz),zz)],c,tone(floor,.13))
 for x0,x1 in [(0,128),(768,640)]:
  poly([(x0,302),(x1,228),(x1,217),(x0,287)],tone(wood,.10),ink)
  poly([(x0,104),(x1,105),(x1,110),(x0,110)],tone(wood,.05),ink)
 # Side windows with green views and Hong Kong tower balconies.
 for side in [0,1]:
  x=10 if side==0 else 657
  rect((x,110,x+99,214),wood,ink,2);rect((x+4,114,x+95,209),'#afd0ca',ink)
  for n in range(4):
   xx=x+6+n*22;yy=126+random.randrange(0,34);bw=random.randrange(13,20)
   rect((xx,yy,xx+bw,204),random.choice(['#c4c5aa','#c8bbad','#b6c2b0']), '#8c9e91');rect((xx+2,yy-3,xx+bw-3,yy),'#adb5a3')
   for wy in range(yy+5,201,7):
    for wx in range(xx+2,xx+bw-1,5):rect((wx,wy,wx+2,wy+3),'#849f99')
  for z in range(20):
   xx=x+4+random.randrange(88);yy=197+random.randrange(9);ell((xx,yy,xx+7,yy+6),random.choice(['#729773','#85a07b','#9dad80']))
  for off in [31,65]:rect((x+off,112,x+off+3,211),wood,ink)
  line([(x+3,150),(x+96,150)],wood,3);line([(x+7,149),(x+25,119)],'#d9e7d6',2)
  rect((x-3,213,x+102,218),tone(wood,-.17),ink,2)
 # Backbar fitted cabinetry.
 counter(145,202,479,33,'panels')
 if k!='renovating':
  # Painted typographic sign as the scene anchor, with decorative product medallion.
  rr((244,62,525,113),2,tone(wall,.19));rr((241,59,522,109),2,trim,ink,2);rect((245,63,518,105),None,tone(trim,-.47),1)
  txt(383,78,name,29,paper,'Arial Rounded Bold.ttf','mm');txt(383,98,tag,9,'#fff0c6','DIN Alternate Bold.ttf','mm')
  poster(153,71,56,70,k,short)
  chalkboard(550,72,68,55,'TODAY')
  for n in [0,1]:shelf(153+n*292,173,137)
  jars(160,172,9,12);jars(456,172,9,15)
  if k=='donut':
   # A striped scalloped kitchen valance hangs above the bake ovens.
   for ai,xx in enumerate(range(239,527,16)):
    c=paper if ai%2 else trim
    poly([(xx,115),(xx+15,115),(xx+16,126),(xx+14,130),(xx+2,130),(xx,127)],c,tone(trim,.32))
    line([(xx+2,116),(xx+13,116)],tone(c,-.35))
   shelf(244,135,278)
   for x in (144,216,532,625):
    rect((x,63,x+2,110),tone(wall,-.48))

   for j in range(3):
    x=304+j*48;rr((x,143,x+41,200),4,'#9c9f92',ink,2)
    for z in range(2):
     rect((x+4,149+z*23,x+36,165+z*23),'#564f48',ink);item(k,x+19,164+z*23,16)
   person(513,253,.9,'#cf797d',hat=True)
   counter(193,251,382,64,'panels');display_case(204,248,206,k);till(543,240)
   item(k,463,241,37)
   rr((481,220,497,239),2,'#d29883',ink);rect((480,220,498,224),'#f1d6b9',ink)
   for xx in (420,446):
    rr((xx,212,xx+21,225),1,paper,tone(wood,.3))
    txt(xx+10,218,'BAKED' if xx==420 else 'DAILY',6,trim,anchor='mm')

   for x in [231,379,532]:lamp(x,58)
   lampTable(599,333,65,k);stool(603,370,trim)
  elif k=='tea':
   # Bamboo ceiling lattice and tea canisters frame the bar.
   for bx in range(0,769,23):
    line([(bx,0),(int((bx-384)*.68+384),42)],wood,4)
    line([(bx+1,0),(int((bx-384)*.68+385),42)],tone(wood,-.32))
   for x in (246,263,280,485,502,519):
    rr((x,142,x+13,161),2,'#7f9580',ink);rect((x,140,x+13,143),'#bcaa77',ink);rect((x+2,147,x+11,154),'#e1d3ab')
   shelf(242,162,58);shelf(481,162,56)
   for j in range(4):urn(304+j*31,194)
   person(467,252,1,'#4a8b7f',hat=True)
   counter(226,247,362,58,'flute')
   for j in range(3):
    x=238+j*32;rr((x,209,x+25,238),3,'#b5b4a1',ink);ell((x+1,205,x+23,213),'#dfcda6',ink);rect((x+4,217,x+20,230),'#738e7e',ink)
   for j in range(4): item(k,365+j*23,238,25+j%2*4)
   till(548,235)
   for x in [222,384,562]:lamp(x,49 if x==384 else 72)
   for x in [356,419,482]:stool(x,336,'#b89b70')
  elif k=='game':
   for j in range(5):arcade(178+j*54,241+(j%2)*4,['#7d7294','#668492','#ad7d85'][j%3])
   person(558,250,.94,trim);counter(463,245,139,58,'panels');till(572,233);item(k,515,234,45)
   arcade(79,296,'#7977a2');arcade(131,287,'#5c8592')
   for x in [215,370,562]:lamp(x,55,2)
   stool(199,271,'#8c7ca4');stool(350,271,'#8c7ca4')
  elif k=='cafe':
   rr((297,152,399,195),4,'#818e83',ink,2);rect((302,159,394,178),'#626d64',ink);rect((303,186,395,192),'#b6ae93',ink)
   for j in range(3):item(k,318+j*28,189,17)
   person(442,251,1.03,trim,hat=True);counter(189,249,353,60,'panels');item(k,321,239,36);till(511,237);display_case(202,245,82,'donut')
   for x in [571,657]:lampTable(x,309,62,k);stool(x,345,'#ab8770')
   for x in [233,380,539]:lamp(x,67)
  elif k=='sushi':
   for x in range(249,520,45):poly([(x,118),(x+41,118),(x+41,144),(x+2,146)],trim,ink);line([(x+20,124),(x+17,136)],'#d4cdb7',2)
   person(399,249,1.05,'#667d89',hat=True);counter(186,245,393,62,'panels');display_case(205,240,204,k)
   for j in range(4):item(k,439+j*27,238,26)
   till(558,236)
   for x in [284,336,388,440,492]:stool(x,338,trim)
   for x in [235,532]:lamp(x,70,1)
  elif k=='market':
   fridge(192,122,82,116);fridge(280,122,82,116);fridge(368,122,82,116)
   person(557,243,.95,'#80976d');counter(465,238,143,55,'panels');till(563,228)
   for i in range(2):
    for j in range(4):
     x=184+55*j;y=258+38*i;rect((x,y,x+50,y+30),wood,ink,2);rect((x+3,y+2,x+47,y+18),'#6e795e',ink)
     for v in range(10):
      xx=x+5+v%5*8;yy=y+3+v//5*7;ell((xx,yy,xx+9,yy+8),['#d79861','#b6b679','#ba7961','#98ad78'][(i+j)%4],tone(wood,.25));rect((xx+4,yy-1,xx+6,yy+1),'#718868')
     rect((x+18,y+20,x+32,y+27),paper);txt(x+25,y+24,'HK',6,ink,anchor='mm')
   for x in [221,401,545]:lamp(x,52,2)
  elif k=='hotpot':
   person(455,250,.97,trim,hat=True);counter(230,234,287,47,'bricks')
   for j in range(4):item(k,269+j*51,225,32)
   for x in [166,338,548,693]:
    yy=333-(x%3)*7;stool(x-28,yy-8,trim);lampTable(x,yy,75,k);stool(x+4,yy+36,trim)
   for x in [188,279,482,576]:lamp(x,70,1)
  # Apron on the sales counter, central in product-rich foreground.
  if k in ('donut','tea','cafe','sushi'):
   xx={'donut':470,'tea':491,'cafe':415,'sushi':501}[k];yy={'donut':281,'tea':275,'cafe':279,'sushi':276}[k]
   rr((xx-25,yy-10,xx+25,yy+9),5,tone(trim,-.38),tone(trim,.25));txt(xx,yy,tag.split()[0],9,tone(trim,.55),'DIN Alternate Bold.ttf','mm')
  plant(76,294,1.1);plant(688,280,1)
  # A tactile floor strip and intermittent flecks pick up the hand-painted tile variation.
  for j in range(220):
   fx=random.randrange(5,W-5);fy=random.randrange(349,H-1)
   line([(fx,fy),(fx+random.choice([1,2]),fy)],tone(floor,random.uniform(.09,.16)))
  person(630,295,1.04,'#8f9db3',back=True);person(593,305,1.12,'#c58169',back=True)
  # A small chalk sandwich board at the entrance.
  x,y=673,336;poly([(x-12,y-50),(x+18,y-54),(x+26,y+2),(x-17,y+5)],wood,ink)
  poly([(x-9,y-45),(x+15,y-48),(x+20,y-5),(x-13,y-2)],'#39594e',ink);txt(x+3,y-35,'OPEN',11,'#ecdbad',anchor='mm')
  for j in range(3):line([(x-6,y-25+j*6),(x+11-j*2,y-26+j*6)],'#b3bd9b')
 else:
  rect((139,57,630,243),'#727970',ink,3)
  for y in range(62,241,7):rect((143,y,626,y+2),'#a6aaa0');line([(143,y+3),(626,y+3)],'#686e69')
  rect((161,96,398,245),'#bd9e76',ink,2)
  for xx in range(165,400,29):
   line([(xx,97),(xx,244)],'#988266',2);line([(xx+3,102),(xx+1,236)],'#c6ad86')
  rr((294,77,492,139),2,trim,ink,2);rect((298,81,488,135),None,paper)
  txt(393,98,'COMING SOON',23,paper,anchor='mm');txt(393,122,'MCP CENTRAL   /   SHOP REFIT',10,'#f4ce92',anchor='mm')
  for xx in [182,237,455,536]:
   rect((xx,141,xx+5,271),'#cbaa76',ink)
  for yy in [151,198,242]:
   rect((173,yy,551,yy+5),'#ba9f70',ink)
  for x in [182,236,454]:
   line([(x,150),(x+67,241)],'#827d58',4);line([(x,150),(x+67,241)],'#d4bc87',2)
  for xx in [600,611]:line([(xx,158),(xx-32,278)],'#a18f75',5)
  for j in range(7):line([(599-j*4,169+j*15),(611-j*4,169+j*15)],'#bcaa8b',4)
  for x,y in [(200,277),(242,277),(221,248),(524,288),(561,288)]:
   rect((x,y-25,x+37,y+3),'#bd9870',ink);rect((x+15,y-25,x+20,y+3),'#e2c69a');rect((x+3,y-6,x+11,y-2),'#7a715f')
  person(475,303,1.12,'#daaa56',hat=True);item('tools',430,306,66)
  for x in [156,610]:
   rect((x-6,300,x+6,308),ink);rect((x-2,243,x+2,301),'#d4b264',ink)
  for x in range(150,612,14):poly([(x,251),(x+12,251),(x+15,259),(x+3,259)],'#d9ad60' if x//14%2 else '#53564c')
 # Color falloff and a small, deterministic paper grain, with a diffuse warm window splash.
 import numpy as np
 a=np.array(scene,dtype=np.float32);yy,xx=np.mgrid[:H,:W]
 edges=(abs(xx-W*.5)/(W*.5))**2*.07 + (abs(yy-H*.54)/(H*.56))**2*.04
 sun=np.exp(-(((xx-115)/175)**2+((yy-160)/120)**2))*.045
 rnd=np.random.default_rng(14).normal(0,1.1,(H,W,1))
 a=(a*(1-edges[:,:,None])+np.array([55,46,40])*edges[:,:,None])*(1-sun[:,:,None])+np.array([255,230,181])*sun[:,:,None]+rnd
 scene=Image.fromarray(np.clip(a,0,255).astype('uint8')).resize((1536,864),Image.Resampling.NEAREST)
 scene.save(out/(k+'.webp'),quality=92,method=5)
