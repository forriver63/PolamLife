"""Rebuild the fifteen regional product illustrations and their transparent map pins.

Run with Python 3 and Pillow. The larger scene, architecture and interior
illustrations are separate original raster assets in the game.
"""
from pathlib import Path
from math import cos, sin, tau

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets"
INK = "#383044"
SHADOW = "#715760"
PAPER = "#fff1cf"
GLASS = "#b8e1d8"
RED = "#df675b"
GOLD = "#f7c35b"
LEAF = "#538558"

def illustration(kind):
    im = Image.new("RGBA", (80, 80))
    d = ImageDraw.Draw(im)

    def shape(points, fill, outline=INK):
        d.polygon(points, fill, outline)
    def rect(bounds, fill, outline=None, width=1):
        d.rectangle(bounds, fill, outline, width)
    def ellipse(bounds, fill, outline=INK, width=1):
        d.ellipse(bounds, fill, outline, width)
    def line(points, color, width=1):
        d.line(points, color, width, joint="curve")
    def blossom(x, y, size, colors):
        for a in range(5):
            dx, dy = (size * .54 * f(tau*a / 5) for f in (cos, sin))
            ellipse((x+dx-size*.43, y+dy-size*.43, x+dx+size*.43, y+dy+size*.43), colors[0], colors[1])
        ellipse((x-2, y-2, x+2, y+2), GOLD, None)
    def plate(x, y, width):
        ellipse((x-width,y-7,x+width,y+7), "#8ea4a9")
        ellipse((x-width+2,y-7,x+width-2,y+4), "#fcf2cf", "#748c99")
        d.arc((x-width+6,y-6,x+width-6,y+2), 0, 175, "#6892aa", 2)

    if kind == "lemonade":
        shape([(15,21),(51,21),(47,65),(22,65)], "#85bcc0")
        shape([(19,31),(48,31),(44,61),(24,61)], "#f6cb57", "#cf9537")
        shape([(25,36),(31,34),(33,40),(27,43)], "#fff0b3")
        shape([(37,44),(43,44),(42,50),(36,50)], "#ffe6a5")
        line([(20,26),(24,55)], PAPER, 2)
        line([(35,34),(44,11),(52,9)], "#ae565a", 4)
        line([(36,33),(45,12),(52,10)], "#ffb5a2")
        ellipse((43,16,66,37), GOLD, "#b58135", 2)
        ellipse((46,19,63,34), "#ffdd79", PAPER)
        for a in range(6):
            line([(54.5,26),(54.5+8*cos(a*tau/6),26+6*sin(a*tau/6))], PAPER)
        shape([(45,18),(47,9),(57,5),(54,15)], LEAF)
    elif kind == "kite":
        line([(40,51),(36,59),(41,64),(36,72),(33,74)], "#776d65", 2)
        shape([(40,7),(66,27),(39,54),(14,27)], "#e96557")
        shape([(40,7),(40,29),(14,27)], "#f9cd65")
        shape([(40,29),(66,27),(39,54)], "#52979b")
        line([(15,27),(40,30),(65,27)], "#7d6263")
        line([(40,8),(40,30),(39,52)], PAPER)
        for x,y in [(37,60),(39,66),(34,72)]:
            shape([(x-5,y-3),(x,y),(x+4,y-2),(x+3,y+3),(x,y+1),(x-5,y+2)], RED)
    elif kind == "skate":
        for x,y in [(22,57),(46,61),(59,57)]:
            ellipse((x-5,y-1,x+5,y+8), "#cb6955", INK, 2)
            ellipse((x-1,y+2,x+2,y+5), "#ffe3a2", None)
        shape([(16,45),(24,24),(24,13),(43,16),(44,32),(51,39),(63,42),(66,48),(59,53),(29,54),(17,50)], "#587f9b")
        shape([(21,42),(27,18),(40,20),(40,32),(48,40),(38,42)], "#a7c8cf")
        shape([(24,15),(26,10),(43,13),(45,17),(41,21),(25,19)], "#de795c")
        line([(18,48),(38,51),(60,48),(66,45)], PAPER, 3)
        for x,y in [(37,24),(38,28),(41,33),(44,36)]:
            line([(x-3,y+2),(x+4,y-1)], "#f7e7bc", 2)
    elif kind == "ticketpress":
        shape([(11,29),(52,16),(66,46),(24,62)], "#d98c6e")
        shape([(14,24),(54,14),(67,43),(27,56)], PAPER)
        shape([(19,28),(43,21),(51,40),(28,47)], "#7cb7cb")
        shape([(22,39),(27,31),(33,36),(39,27),(48,39),(28,47)], "#688f77")
        shape([(28,44),(46,35),(49,39),(28,47)], "#eac775")
        shape([(45,22),(52,20),(55,26),(48,29)], RED)
        for dx,dy in [(0,0),(2,4),(3,8)]: line([(48+dx,32+dy),(57+dx,29+dy)], "#9c7d74")
        d.arc((48,24,61,37), 20, 315, "#785c70")
    elif kind == "onigiri":
        plate(41,60,29)
        shape([(18,49),(22,38),(34,21),(39,17),(45,18),(51,25),(64,48),(63,56),(53,59),(25,58),(18,55)], "#e6d9bd", INK)
        shape([(20,49),(27,35),(38,21),(43,21),(49,28),(59,49),(53,53),(25,54)], "#fff6d7", None)
        for x,y in [(29,40),(40,26),(50,39),(27,48),(52,44),(32,34),(45,31),(55,49)]: line([(x,y),(x+2,y-1)], "#cfb999")
        shape([(34,43),(46,41),(50,55),(47,59),(34,58)], "#35574f")
        for x in [36,39,44]: line([(x,46),(x+2,55)], "#678069")
    elif kind == "umbrella":
        line([(40,29),(42,61),(46,65),(51,62),(51,58)], "#755049", 3)
        line([(39,29),(41,60)], "#e8bf84")
        shape([(10,38),(14,28),(21,20),(31,15),(39,12),(51,15),(60,20),(67,28),(71,37),(62,34),(54,39),(47,35),(39,40),(32,35),(24,39),(19,35)], "#d96b6a")
        shape([(13,34),(22,22),(39,13),(29,23),(24,37),(19,34)], "#f3a07e")
        shape([(40,14),(48,22),(54,38),(47,34),(40,38)], "#b35873")
        shape([(43,14),(57,21),(66,28),(70,36),(62,33),(56,36),(50,22)], "#e38678")
        line([(39,9),(40,14)], INK, 2)
    elif kind == "florist":
        for x,y,col in [(20,25,RED),(31,18,"#ef9d96"),(43,16,"#eee4aa"),(55,23,"#ab88bc"),(39,30,"#eab779"),(53,34,RED)]:
            line([(x,y),(36,62)], LEAF, 2)
            blossom(x,y,8,(col,SHADOW))
        shape([(15,32),(25,32),(39,47),(29,42)], LEAF)
        shape([(56,36),(65,32),(56,46),(42,53)], "#689969")
        shape([(15,39),(35,48),(61,38),(43,69),(34,70)], "#edbc8a")
        shape([(17,40),(39,51),(35,68)], "#f5d6a5", None)
        line([(31,55),(48,53)], "#aa5965", 3)
    elif kind == "repair":
        shape([(20,61),(34,43),(49,27),(47,19),(51,12),(59,10),(55,19),(60,23),(67,17),(67,26),(61,32),(54,33),(29,64),(24,67)], "#98a5ab")
        line([(23,60),(49,30)], "#d8d9c9", 2)
        ellipse((23,59,28,64), "#68717a")
        line([(18,17),(34,35),(48,48)], "#b2b3ae", 5)
        shape([(40,50),(47,44),(66,59),(68,63),(62,68),(57,65)], "#cb7150")
        line([(47,49),(61,62)], "#efb16e", 2)
        shape([(15,11),(20,13),(23,19),(18,21),(13,15)], "#a9a8a2")
    elif kind == "bakery":
        plate(41,55,30)
        ellipse((14,25,65,57), "#cd853e", INK, 2)
        ellipse((16,20,64,53), "#edab4e", "#996434", 2)
        for x,y in [(30,24),(41,22),(51,25),(21,33),(33,32),(45,33),(55,34),(28,42),(40,42),(51,44)]:
            shape([(x-4,y+1),(x,y-3),(x+5,y),(x+6,y+4),(x+2,y+7),(x-3,y+5)], "#f5c667", "#d08c42")
        line([(17,49),(23,54),(44,57),(59,52)], "#ab692f")
    elif kind == "record":
        shape([(9,23),(45,16),(54,50),(19,58)], "#c29279")
        shape([(13,26),(43,20),(49,47),(20,53)], "#4a8095")
        shape([(16,43),(29,27),(30,48)], GOLD)
        ellipse((30,22,69,60), "#353947", INK, 2)
        for inset in [4,7,10]:
            d.arc((30+inset,22+inset,69-inset,60-inset), 205,282,"#858599")
            d.arc((30+inset,22+inset,69-inset,60-inset), 23,79,"#575b6b")
        ellipse((43,34,57,48), "#de8364");ellipse((49,40,51,42), PAPER)
    elif kind == "ceramics":
        shape([(28,11),(48,11),(47,16),(44,20),(45,29),(55,36),(61,46),(59,56),(52,63),(32,65),(22,60),(18,52),(19,42),(25,35),(31,29),(33,20)], "#76aaa6")
        ellipse((27,9,49,15), "#a8c6b6");ellipse((31,10,46,13), "#507776")
        d.arc((43,28,69,52),238,119,INK,6); d.arc((43,28,66,50),238,119,"#9abdaf",3)
        line([(25,41),(32,36),(35,30)], "#d0debd", 3)
        for x in range(22,55,9):
            line([(x,49),(x+3,46),(x+7,50)], "#3e747f", 2)
        line([(26,58),(34,61),(48,60)], "#609596")
    elif kind == "camera":
        shape([(12,28),(25,26),(28,20),(43,19),(48,25),(62,24),(66,28),(66,54),(20,60),(12,54)], "#555564", INK)
        shape([(13,29),(26,27),(30,22),(42,21),(46,26),(63,25),(63,32),(17,38),(13,34)], "#c6cdca")
        rect((16,27,23,30), "#a4abae", INK)
        ellipse((30,28,59,54), "#a1acae", INK, 2)
        ellipse((33,31,56,51), "#535e72");ellipse((37,34,53,48), "#4c8090")
        ellipse((40,35,46,40), "#a6d4d0",None);ellipse((47,43,50,46),"#849bad",None)
        rect((17,39,24,43), "#d2aa70", INK)
    elif kind == "noodles":
        line([(43,34),(62,9)], "#7d5b43", 3);line([(48,35),(68,13)], "#926d4b", 3)
        shape([(10,37),(68,37),(63,51),(53,60),(30,63),(19,58),(13,49)], "#9abac1")
        ellipse((10,27,68,45), "#eee5bf", INK, 2);ellipse((14,30,64,41), "#b2754c", "#839caa")
        for x in range(19,53,7): d.arc((x,32,x+15,39), 150,360, GOLD, 2)
        for x,y in [(24,32),(54,34),(42,37)]:ellipse((x,y,x+4,y+2),LEAF,None)
        for x in range(20,59,8): line([(x,46),(x+2,48),(x+4,46)], "#4e7794", 2)
        d.arc((14,32,64,57),20,140,PAPER,2)
    elif kind == "sewing":
        rect((20,24,42,56),"#c76367",INK,2);ellipse((17,17,45,26),"#d7ae89",INK,2)
        ellipse((18,51,45,61),"#d7ae89",INK,2);rect((20,26,42,52),"#ba575c")
        for y in range(27,51,3):line([(21,y),(41,y-3)],"#ec9b82")
        ellipse((27,19,35,23),"#856057")
        line([(41,47),(50,51),(52,59),(59,61),(65,57)],"#b7515e",2)
        line([(41,58),(61,16)],"#94aaae",3);ellipse((59,13,65,21),"#dae0d4",INK);ellipse((61,15,63,18),INK,None)
    elif kind == "books":
        for x,y,cover in [(12,46,"#6c9c95"),(17,37,"#b96f66"),(12,26,"#696f94")]:
            shape([(x,y),(x+30,y-9),(x+52,y+1),(x+20,y+12)],cover,INK)
            shape([(x,y),(x+20,y+10),(x+51,y),(x+51,y+6),(x+20,y+17),(x,y+6)],"#e7d6ae",INK)
            shape([(x,y),(x+20,y+10),(x+20,y+17),(x,y+6)],cover,INK)
            line([(x+22,y+12),(x+47,y+4)],"#a99882")
        shape([(24,24),(40,20),(50,24),(34,29)],GOLD,SHADOW)
    return im

KINDS = [
    "lemonade","kite","skate","ticketpress","onigiri","umbrella","florist","repair",
    "bakery","record","ceramics","camera","noodles","sewing","books",
]
for kind in KINDS:
    product = illustration(kind)
    item = Image.new("RGB", (160,160), "#f8ebd1")
    item.paste(product.resize((160,160),Image.Resampling.NEAREST), (0,0), product.getchannel("A").resize((160,160),Image.Resampling.NEAREST))
    item.save(ROOT/"items"/(kind+".webp"), lossless=True)
    crop = product.crop(product.getbbox())
    crop.thumbnail((46,46),Image.Resampling.NEAREST)
    pin = Image.new("RGBA",(48,48)); pin.alpha_composite(crop,((48-crop.width)//2,(48-crop.height)//2))
    pin.save(ROOT/"world"/(kind+".png"), optimize=True)

# An independent roll-down steel shutter used while a regional booth is closed.
im=Image.new("RGBA",(272,162))
d=ImageDraw.Draw(im)
d.ellipse((17,134,259,156), fill=(57,47,66,65))
d.polygon([(18,57),(43,32),(238,32),(256,48),(256,140),(42,150),(18,136)],"#615e66","#393742")
d.polygon([(18,57),(42,42),(42,149),(20,138)],"#78787b","#3e4245")
d.polygon([(43,49),(250,42),(250,140),(43,150)],"#a9a8a4","#3e4245")
for y in range(58,139,5):
    d.line([(46,y),(246,y-8)],fill="#747e81",width=2)
    d.line([(46,y+2),(246,y-6)],fill="#c5c3b2")
d.polygon([(16,55),(40,28),(239,22),(258,37),(251,47),(41,57)],"#7e8995","#414951")
d.polygon([(18,55),(41,52),(252,41),(252,49),(41,59),(18,62)],"#aaa69a","#555762")
d.polygon([(108,91),(158,88),(158,110),(108,113)],"#f2d39a","#76604c")
for x in range(112,152,8): d.line([(x,109),(x+8,91)],fill="#976e59",width=3)
im.save(ROOT/"world/front-regional-shutter.webp",lossless=True)
