"""Render the earlier procedural district study with Python and Pillow.
The live game uses the authorized Agentopia district map."""
from PIL import Image, ImageDraw
from random import Random
from math import sin, cos, pi, hypot
from pathlib import Path

W,H=1680,1080
im=Image.new('RGB',(W,H),'#8bab77')
draw=ImageDraw.Draw(im)
r=Random(2011)
def shade(c,f):
    return tuple(min(255,int(int(c[i:i+2],16)*f)) for i in (1,3,5))
def xy(u,v,z=0):
    return (round(W*.53+(u-v)*.91),round(H*.48+(u+v)*.45-z))
def poly(vertices,fill,edge=None):
    draw.polygon([xy(*p) for p in vertices],fill,outline=edge)
def line(vertices,c,width=1):
    draw.line([xy(*p) for p in vertices],fill=c,width=width)
def floor(u,v,w,d,z,col,edge=None):
    poly([(u,v,z),(u+w,v,z),(u+w,v+d,z),(u,v+d,z)],col,edge)
def box(u,v,w,d,z,h,col,roof=None,ink='#5f655d'):
    top=z+h
    poly([(u,v+d,z),(u+w,v+d,z),(u+w,v+d,top),(u,v+d,top)],shade(col,.92),ink)
    poly([(u+w,v,z),(u+w,v+d,z),(u+w,v+d,top),(u+w,v,top)],shade(col,.72),ink)
    floor(u,v,w,d,top,roof or shade(col,1.09),ink)
def tree(u,v,sz=1,flower=False):
    x,y=xy(u,v);n=sz;draw.ellipse((x-9*n,y-3*n,x+9*n,y+4*n),fill='#748d65');draw.rectangle((x-1*n,y-18*n,x+1*n,y),fill='#80634b')
    palette=('#6d705c','#ab8583','#d9999b','#efb3ac','#f5ccba') if flower else ('#315d49','#4a7952','#669356','#86aa5a','#a9c372')
    rings=[(0,-17,12,0),(-5,-19,9,1),(5,-23,9,2),(-3,-28,8,2),(-5,-29,5,3),(1,-32,4,4)]
    for dx,dy,rr,c in rings:
        cx,cy=x+dx*n,y+dy*n
        pts=[(round(cx+cos(i*pi/4)*rr*n),round(cy+sin(i*pi/4)*rr*n*.85))for i in range(8)]
        draw.polygon(pts,fill=palette[c])
    for _ in range(int(9*n)):
        xx=x+r.uniform(-8,8)*n;yy=y+r.uniform(-26,-15)*n
        draw.line((xx,yy,xx+2*n,yy),fill=r.choice(palette[1:4]))
def windows(u,v,w,d,z,h,col,step=9,storey=10):
    for j in range(round(h//storey)):
        zz=z+j*storey+2
        for k in range(2,int(w)-3,step):
            c=r.choice(['#536c87','#7189a1','#82a9ad','#586b83','#b3ada5','#e4c388'])
            poly([(u+k,v+d,zz),(u+k+5,v+d,zz),(u+k+5,v+d,zz+5),(u+k,v+d,zz+5)],c)
            if j%3==0:line([(u+k-1,v+d,zz-1),(u+k+5,v+d,zz-1)],'#baaea0')
        for k in range(2,int(d)-4,step):
            c=r.choice(['#5d7481','#687a8b','#72898d','#889797'])
            poly([(u+w,v+k,zz),(u+w,v+k+5,zz),(u+w,v+k+5,zz+5),(u+w,v+k,zz+5)],c)
    for k in range(11,int(w),21):line([(u+k,v+d,z),(u+k,v+d,z+h)],shade(col,1.03),2)
    for k in range(13,int(d),23):line([(u+w,v+k,z),(u+w,v+k,z+h)],shade(col,.8),2)
def tower(u,v,w,d,h,col):
    poly([(u+w,v,0),(u+w+h*.32,v+h*.28,0),(u+w+h*.32,v+d+h*.28,0),(u+h*.32,v+d+h*.28,0),(u,v+d,0)],'#83967b')
    box(u-3,v-3,w+6,d+6,0,8,col)
    box(u,v,w,d,8,h,col);windows(u,v,w,d,8,h,col,8,9)
    if h>85:
        for side in [8,w-10]:
            box(u+side,v+d-1,5,3,8,h, r.choice(['#d19e8b','#9baab2','#c5a0a5']))
        box(u+w*.33,v-1,w*.33,d*.38,h+9,9,col)
    # Top parapets, plant rooms, rooftop stair towers and ventilation.
    box(u-1,v-1,w+2,d+2,h+8,3,col,'#ead9c6')
    floor(u+3,v+3,w-6,d-6,h+11,r.choice(['#abaeba','#c2aeaa','#9ca6a2','#c6b9b1']))
    box(u+6,v+6,w*.5,d*.54,h+11,7,col)
    box(u+9,v+8,w*.27,d*.28,h+18,5,'#c2beb3')
    for k in range(2): box(u+w-9,v+5+k*10,6,6,h+11,3,'#d3c6b2')
def shopbase(u,v,w,d,h,col):
    box(u,v,w,d,0,h,col)
    # Accessible sunshades sit above the pavement shops.
    for i in range(3,int(w)-8,13):
        cc=r.choice(['#5f8786','#b57667','#bb9962','#748b9b'])
        poly([(u+i,v+d,2),(u+i+10,v+d,2),(u+i+10,v+d,h-7),(u+i,v+d,h-7)],'#6d8586')
        box(u+i-1,v+d,12,3,h-9,4,cc)
    for k in range(4,int(d)-8,12):
        poly([(u+w,v+k,3),(u+w,v+k+9,3),(u+w,v+k+9,h-7),(u+w,v+k,h-7)],'#536f75')
    box(u-1,v-1,w+2,d+2,h,3,'#ebd3ad','#d1c2ad')
    floor(u+3,v+3,w-6,d-6,h+3,'#b6b7af')
    for k in range(max(1,int(w//25))):
        box(u+6+k*20,v+6,7,7,h+3,2,'#c4c8bd')
        line([(u+7+k*20,v+8,h+5),(u+10+k*20,v+8,h+5)],'#6d8381')
    if w>40:box(u+8,v+d-15,w*.39,7,h+3,3,'#8badaa')
def mall(u,v,w,d,central):
    h=38 if central else 25
    shopbase(u,v,w,d,h,'#e0ad79')
    ww,dd=w-12,d-12
    box(u+6,v+6,ww,dd,h+3,17,'#dfad94','#f3dcb3')
    windows(u+6,v+6,ww,dd,h+3,16,'#d3bf9a',13,10)
    for k in range(4,int(ww)-12,17):
        poly([(u+6+k,v+dd+6,h+6),(u+18+k,v+dd+6,h+6),(u+18+k,v+dd+6,h+17),(u+6+k,v+dd+6,h+17)],r.choice(['#62a8aa','#d59072','#cc807c','#92afb6']))
    for t in range(4):box(u+12+t*17,v+8,9,12,h+20,4,'#aaada2')
    # Segmented barrel-vaulted roof made of translucent glass panels.
    a,b=u+11,v+d*.44;length=w-26;depth=d*.32;base=h+21
    for i in range(9):
        v0=b+depth*i/9;v1=b+depth*(i+1)/9
        z0=base+sin(pi*i/9)*14;z1=base+sin(pi*(i+1)/9)*14
        poly([(a,v0,z0),(a+length,v0,z0),(a+length,v1,z1),(a,v1,z1)],['#71a2aa','#84b9ba','#b4d8ce','#b2d4ca','#9bc7c4','#80babb','#68a5ae','#6194a0','#527c8c'][i])
        for k in range(0,int(length)+1,14):line([(a+k,v0,z0),(a+k,v1,z1)],'#577d80',1)
    # Planting beds and bright shop signs break up the commercial podium.
    for k in range(14,int(w)-16,17):
        box(u+k,v+d-13,10,7,h+20,2,'#aa8660','#7e9c67')
    for k in range(8,int(w)-8,19):
        box(u+k,v+d,15,3,12,6,r.choice(['#aa6460','#578b84','#c69b54','#a96d80']))
    if central:
        shopbase(u+w-23,v+d-19,34,28,31,'#d6937f')
        box(u+w-24,v+d-20,36,30,34,2,'#b3b9a7')
        box(u+w-20,v+d-15,23,14,36,3,'#7baaaa')
        for row in range(2):
            for k in range(3):
                col=['#e3ae6b','#96bcb1','#e8b59a','#779ca1','#e9c47c','#a49ab4'][row*3+k]
                box(u+w-59+k*14,v+d+1,12,2,14+row*12,11,col)
    for k in [0,4,8]:line([(a,b+depth*k/9,base+sin(pi*k/9)*14),(a+length,b+depth*k/9,base+sin(pi*k/9)*14)],'#779a94')
def traffic(u,v,axis):
    bus=r.random()<.18
    w,d=(25 if bus else 12),6
    if axis:w,d=d,w
    col=r.choice(['#c86e55','#f2e3b5','#b99e6b','#66827d','#719ca0']) if not bus else r.choice(['#bb664e','#dcbb79'])
    ht=9 if bus else 4
    box(u,v,w,d,0,ht,col,ink='#555b58')
    if bus:windows(u,v,w,d,0,ht,'#c9a478',5,5)
    else:floor(u+2,v+1,max(2,w-4),max(2,d-2),ht+.3,'#92aca9')
def pitches(u,v):
    floor(u,v,129,132,0,'#9bb27a')
    for a in (8,68):
        floor(u+a,v+9,54,102,0,'#80a968')
        for k in range(5):floor(u+a,v+10+k*20,54,10,0,'#87b16c')
        for k in [1,100]:line([(u+a+1,v+9+k),(u+a+52,v+9+k)],'#d7dca4',2)
        for k in [1,52]:line([(u+a+k,v+10),(u+a+k,v+109)],'#d7dca4',2)
        line([(u+a+1,v+60),(u+a+52,v+60)],'#d7dca4',2)
        line([(u+a+27+12*cos(k*pi/18),v+60+12*sin(k*pi/18)) for k in range(37)],'#d7dca4',2)
        for z in [0,85]:
            line([(u+a+15,v+10+z),(u+a+15,v+24+z),(u+a+40,v+24+z),(u+a+40,v+10+z)],'#d7dca4')
def leisure(u,v,mode):
    if mode=='court':
        floor(u+9,v+6,95,84,0,'#c08467')
        for n in range(2):
            x=u+12+n*45;floor(x,v+8,42,78,0,'#638f9c')
            line([(x+4,v+12),(x+39,v+12),(x+39,v+82),(x+4,v+82),(x+4,v+12)],'#e2dfc1')
            line([(x+1,v+46,2),(x+41,v+46,2)],'#ecdaa8',2)
    if mode=='garden':
        floor(u+9,v+9,112,113,0,'#92ad70')
        line([(u+14,v+12),(u+43,v+48),(u+81,v+60),(u+116,v+114)],'#d7c59b',9)
        for n in range(4):
            bx=u+18+n*24;bv=v+r.randint(37,90);box(bx,bv,9,3,1,3,'#b58459')
    for n in range(17 if mode=='woods' else 9):
        tree(u+r.randint(9,122),v+r.randint(8,119),r.uniform(.85,1.6),r.random()<.19)
def market(u,v):
    for row in range(2):
        for k in range(3):
            x=u+10+k*40;y=v+14+row*56
            col=r.choice(['#d59e7d','#b6b5a1','#deb1a0','#b9bea8'])
            ht=r.choice([21,30,37]);shopbase(x,y,32,35,ht,col)
            box(x+3,y+4,8,9,ht+3,4,'#b3b5a6')
            for j in range(4):
                c=r.choice(['#bd755b','#91a582','#d8b87f','#829da1'])
                box(x+j*8,y+35,8,5,9,2,c)
def bridge(u,v):
    box(u+51,v+129,18,6,0,20,'#baa88d')
    box(u+55,v+127,15,58,19,4,'#b7beb0')
    for side in (0,14):
        line([(u+55+side,v+127,29),(u+55+side,v+185,29)],'#b0a994',2)
        for k in range(0,58,10):line([(u+55+side,v+127+k,23),(u+55+side,v+127+k,29)],'#8d9587')
    box(u+54,v+126,18,60,30,2,'#e3c9a4')
S=178
tiles=[(i,j)for i in range(-12,13)for j in range(-12,13)if -380<xy(i*S,j*S)[0]<W+390 and -230<xy(i*S,j*S)[1]<H+510]
tiles.sort(key=lambda ij:sum(ij))
def which(x,y):
    return min(tiles,key=lambda ij: (xy(ij[0]*S+80,ij[1]*S+80)[0]-x*W)**2+(xy(ij[0]*S+80,ij[1]*S+80)[1]-y*H)**2)
special={which(.68,.51):'central',which(.5,.72):'discovery',which(.38,.88):'one',which(.72,.68):'station',which(.17,.42):'park'}
# Ground pass can cross lot boundaries without overwriting foregound structures.
for i,j in tiles:
    u,v=i*S,j*S
    floor(u,v,S,S,0,'#848a90')
    floor(u+3,v+3,143,143,0,'#d7c6a4')
    floor(u+7,v+7,135,135,0,'#a2b27f')
    for k in range(2,141,19):
        line([(u+k,v+158),(u+k+10,v+158)],'#e3dbc7')
        line([(u+158,v+k),(u+158,v+k+10)],'#ddd8c5')
    for k in (146,168):
        line([(u,v+k),(u+140,v+k)],'#e8c26e')
        line([(u+k,v),(u+k,v+140)],'#e4bd6d')
    for k in range(0,20,4):
        line([(u+136,v+147+k),(u+142,v+147+k)],'#e6dfcb',2)
        line([(u+147+k,v+136),(u+147+k,v+142)],'#e3ddcc',2)
    line([(u+147,v+147),(u+168,v+168)],'#f1c36b',2)
    line([(u+147,v+168),(u+168,v+147)],'#f1c36b',2)
    if r.random()<.82:traffic(u+r.randrange(12,123),v+151,False)
    if r.random()<.85:traffic(u+162,v+r.randrange(12,123),True)
# Main arterial roads form a wider junction near the station and central mall.
for i,j in tiles:
    u,v=i*S,j*S
    if j==0 or i==1:
        across=j==0
        if across:floor(u,v+140,S,37,0,'#777e88')
        else:floor(u+140,v,37,S,0,'#777e88')
        for off in [142,158,160,175]:
            c='#efc571' if off in (158,160) else '#ece2c5'
            verts=[(u,v+off),(u+142,v+off)] if across else [(u+off,v),(u+off,v+142)]
            line(verts,c)
        for k in range(5,140,22):
            for off in [150,168]:
                line([(u+k,v+off),(u+k+10,v+off)] if across else [(u+off,v+k),(u+off,v+k+10)],'#dfdcd3')
        for k in range(0,34,7):
            line([(u+142+k,v+142),(u+176,v+176-k)],'#edc177')
            line([(u+142,v+142+k),(u+176-k,v+176)],'#edc177')
            line([(u+142+k,v+176),(u+176,v+142+k)],'#edc177')
        for k in [18,70,114]:
            if r.random()<.65:traffic(u+k if across else u+162,v+162 if across else v+k,not across)
for i,j in tiles:
    u,v=i*S,j*S;style=special.get((i,j))
    xx,yy=xy(u+75,v+75);xx/=W;yy/=H
    if not style and ((xx<.32 and .28<yy<.59) or (.81<xx and .0<yy<.23)):
        style='garden' if (i+j)%2 else 'woods'
    if not style and (7*i+11*j)%17 in (0,2):style='court' if i%2 else 'garden'
    if not style and (i-j*3)%6==0:style='market'
    for k in range(5):tree(u+r.randrange(6,135),v+r.randrange(5,20),r.uniform(.7,1.13),r.random()<.18)
    if style=='park':pitches(u+6,v+6)
    elif style in ['garden','woods','court']:leisure(u,v,style)
    elif style=='market':market(u,v)
    elif style in ['central','one','discovery']:
        mall(u+3,v+5,143 if style=='central' else 123,117 if style=='central' else 96,style=='central')
        bridge(u,v)
    elif style=='station':
        box(u+4,v+35,135,56,0,14,'#c0baa5')
        for n in range(8):
            box(u+5+n*16,v+34,15,61,14,5,'#dad6bc')
            box(u+5+n*16,v+40,15,49,19,5,'#e3ddc3')
            box(u+5+n*16,v+50,15,29,24,4,'#eee8d3')
        box(u+33,v+93,64,16,0,9,'#91a7a0')
    else:
        height=r.choice([45,63,80,94,105,126,152]);col=r.choice(['#edc7b7','#f1dabc','#e3d8c7','#e9bdaa','#e8dfd2'])
        if .05<xx<.41 and yy<.29:
            # The estate uses tall pink-and-cream cruciform public-housing slabs.
            for tu,tv in [(17,12),(82,42)]:
                tower(u+tu,v+tv,38,47,height+29,col)
                tower(u+tu+7,v+tv+31,24,31,height+27,'#ecc6b4')
        elif (i-j)%4==1:
            shopbase(u+12,v+12,93,67,19,'#dba78e')
            tower(u+23,v+17,39,41,height+11,col);tower(u+76,v+43,32,40,height-2,col)
            shopbase(u+20,v+100,94,24,13,'#d7be95')
        elif (i+j)%4==0:
            shopbase(u+12,v+25,78,57,22,'#c9b29d')
            tower(u+80,v+22,33,57,height,col)
            shopbase(u+19,v+89,98,29,15,'#c79278')
        else:
            tower(u+14,v+14,48,44,height+9,col)
            tower(u+77,v+23,40,45,height-8,col)
            if (i+j)%3: tower(u+35,v+83,49,36,height*.64,col)
            else: shopbase(u+19,v+88,87,28,16,'#cbb298')
    if style is None and (i+j*3)%7==0:bridge(u,v)
    for k in range(4):
        tree(u+13+k*29,v+125+r.randrange(-2,8),r.uniform(.7,1.12),r.random()<.21)
    for k in range(4):
        x,y=xy(u+r.randrange(5,135),v+140)
        draw.line((x,y,x,y-4),fill=r.choice(['#a05c48','#648a81','#dfb16e']),width=2);draw.point((x,y-5),fill='#6f5848')
out=Path('test-results')/'procedural-district.webp'
out.parent.mkdir(exist_ok=True)
im.save(out,quality=92,method=6)
print(out)
