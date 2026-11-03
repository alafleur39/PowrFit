import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.varLib import instancer

FONTS = sys.argv[1]; OUT = sys.argv[2]
WHITE = "#FFFFFF"; YELLOW = "#FFD60A"

def load(name, axes=None):
    f = TTFont(f"{FONTS}/{name}")
    if axes: f = instancer.instantiateVariableFont(f, axes)
    return f

def word(font, text, colors, tracking=0, kern=None, skew=0.0):
    """Outlines `text`; returns (paths, width, ascent) in font units, y down."""
    gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font["hmtx"]
    upm = font["head"].unitsPerEm
    cap = getattr(font["OS/2"], "sCapHeight", 0) or int(upm * 0.7)
    x = 0; paths = []
    for i, ch in enumerate(text):
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        # flip y, put the cap height at y=0..cap, slant by `skew`
        tp = TransformPen(pen, (1, 0, -skew, -1, x + skew * cap, cap))
        gs[g].draw(tp)
        paths.append((pen.getCommands(), colors[i]))
        x += hmtx[g][0] + tracking
        if kern and i + 1 < len(text): x += kern.get(ch + text[i + 1], 0)
    return paths, x - tracking, cap

def svg(paths, w, h, pad=0, extra=""):
    body = "".join(f'<path fill="{c}" d="{d}"/>' for d, c in paths)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {w + 2*pad:.0f} {h + 2*pad:.0f}">{body}{extra}</svg>'

two = [WHITE]*4 + [YELLOW]*3
mono = [WHITE]*7
opts = {}

f1 = load("BigShouldersDisplay[wght].ttf", {"wght": 900})
p, w, cap = word(f1, "POWRFIT", two, tracking=10, kern={"WR": 6, "OW": -4, "RF": 10})
opts["1-condensed"] = svg(p, w, cap)

f2 = load("Archivo[wdth,wght].ttf", {"wdth": 125, "wght": 800})
p, w, cap = word(f2, "POWRFIT", mono, tracking=0, kern={"WR": -40, "OW": -30, "PO": -10, "FI": -10})
opts["2-wide"] = svg(p, w, cap)

f3 = load("BarlowCondensed-ExtraBoldItalic.ttf")
p, w, cap = word(f3, "POWRFIT", two, tracking=6, kern={"WR": -24, "OW": -14, "RF": 10})
opts["3-italic"] = svg(p, w, cap)

# 4: Barlow Condensed ExtraBold Italic in white, with a yellow bolt in the
# same slant standing between POWR and FIT.
f4 = f3
gs = f4.getGlyphSet(); cmap = f4.getBestCmap(); hmtx = f4["hmtx"]
cap = f4["OS/2"].sCapHeight
skew = 0.2126  # Barlow's italic angle, 12 degrees
track = 6; kern4 = {"WR": -24, "OW": -14, "PO": 0}
gap = cap * 0.07; bw = cap * 0.50
paths4 = []; x = 0
for i, ch in enumerate("POWRFIT"):
    if i == 4:
        x0 = x - track + gap
        def pt(px, py):
            return f"{x0 + px + skew * (cap - py):.1f},{py:.1f}"
        bolt = [(0.66,0),(0.04,0.60),(0.46,0.60),(0.30,1.0),(0.96,0.36),(0.56,0.36),(0.76,0)]
        paths4.append(("M" + " L".join(pt(bx * bw, by * cap) for bx, by in bolt) + " Z", YELLOW))
        x = x0 + bw + gap
    g = cmap[ord(ch)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, x, cap)))
    paths4.append((pen.getCommands(), WHITE))
    x += hmtx[g][0] + track
    if i + 1 < 7: x += kern4.get(ch + "POWRFIT"[i + 1], 0)
opts["4-bolt"] = svg(paths4, x - track + skew * cap * 0.3, cap)
bolt = [(0.66,0),(0.04,0.60),(0.46,0.60),(0.30,1.0),(0.96,0.36),(0.56,0.36),(0.76,0)]

for k, v in opts.items():
    open(f"{OUT}/wordmark-{k}.svg", "w").write(v)
print(json.dumps(list(opts)))

# App-icon tiles: the option's mark on yellow, near-black glyph.
DARK = "#0A0A0A"
def tile(paths, w, cap):
    s = 1024; scale = 560 / cap
    body = "".join(f'<path fill="{DARK}" d="{d}"/>' for d, c in paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {s} {s}"><rect width="{s}" height="{s}" fill="{YELLOW}"/>'
            f'<g transform="translate({(s - w*scale)/2:.0f},{(s - cap*scale)/2:.0f}) scale({scale:.4f})">{body}</g></svg>')
for k, f, sk in [("1-condensed", f1, 0), ("2-wide", f2, 0), ("3-italic", f3, 0)]:
    p, w, cap = word(f, "P", [DARK])
    open(f"{OUT}/icon-{k}.svg", "w").write(tile(p, w, cap))
# 4: the slanted bolt alone.
bw4 = cap4 = 1.0
pts = " L".join(f"{(bx*0.62 + skew*(1-by)):.3f},{by:.3f}" for bx, by in bolt)
open(f"{OUT}/icon-4-bolt.svg", "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="{YELLOW}"/>'
    f'<g transform="translate(312,212) scale(600)"><path fill="{DARK}" d="M{pts} Z"/></g></svg>')
