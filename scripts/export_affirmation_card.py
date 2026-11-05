#!/usr/bin/env python3
"""Export approved KINDELORA affirmation cards as print-size, self-contained SVG.
Requires: pip install Pillow qrcode
Example: python scripts/export_affirmation_card.py --id calm-01 --photo licensed-photo.jpg --out card.svg
Only approved scripts may be exported. Input photography must be rights-cleared.
"""
import argparse,base64,html,io,json,math,textwrap
from pathlib import Path
from PIL import Image
import qrcode
from qrcode.constants import ERROR_CORRECT_H

ROOT=Path(__file__).resolve().parents[1]
URL="https://kindelora.pages.dev/"
W,H=2400,3000

def load_approved(ident):
    for path in sorted((ROOT/"content").glob("affirmations-v*.json")):
        for item in json.loads(path.read_text(encoding="utf-8"))["scripts"]:
            if item["id"]==ident:
                if item.get("approved") is not True or item.get("status")!="approved":
                    raise ValueError("Export blocked: affirmation has not passed editorial approval")
                return item
    raise ValueError("Affirmation ID not found")

def qr_svg(x,y,size):
    qr=qrcode.QRCode(error_correction=ERROR_CORRECT_H,box_size=1,border=4)
    qr.add_data(URL);qr.make(fit=True)
    matrix=qr.get_matrix();step=size/len(matrix)
    cells=[f'<rect x="{x+c*step:.2f}" y="{y+r*step:.2f}" width="{step+.05:.2f}" height="{step+.05:.2f}"/>' for r,row in enumerate(matrix) for c,v in enumerate(row) if v]
    return '<g fill="#302239">'+''.join(cells)+'</g>'

def wrap_quote(value,max_chars=36):
    words=value.split();lines=[];current=""
    for word in words:
        trial=(current+" "+word).strip()
        if len(trial)>max_chars and current:
            lines.append(current);current=word
        else:current=trial
    if current:lines.append(current)
    if len(lines)>9:raise ValueError("Quote too long for approved print layout")
    return lines

def build(ident,photo,out,license_ref):
    item=load_approved(ident)
    if not license_ref.strip():raise ValueError("Rights clearance reference required")
    with Image.open(photo) as im:
        if im.width<2400 or im.height<3000:raise ValueError("Photo must be at least 2400 x 3000 pixels")
        if im.width/im.height<.7 or im.width/im.height>.9:raise ValueError("Use portrait photography near 4:5 ratio; no distortion")
        if im.format not in ("JPEG","PNG","WEBP"):raise ValueError("Unsupported photo format")
        mime={"JPEG":"image/jpeg","PNG":"image/png","WEBP":"image/webp"}[im.format]
    data=base64.b64encode(Path(photo).read_bytes()).decode("ascii")
    logo=(ROOT/"icon.svg").read_text(encoding="utf-8")
    logo=logo.replace('<svg ', '<svg x="135" y="120" width="160" height="160" ',1)
    # Strip title and description only from embedded logo; retain exact brand artwork.
    lines=wrap_quote(item["text"])
    font=83 if len(lines)<=5 else 72 if len(lines)<=7 else 62
    step=font*1.38
    y0=1530-(len(lines)-1)*step/2
    quote=''.join(f'<text x="1200" y="{y0+i*step:.1f}" text-anchor="middle" font-size="{font}" font-family="Georgia,serif" fill="#ffffff">{html.escape(line)}</text>' for i,line in enumerate(lines))
    theme=html.escape(item["theme"].upper())
    result=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="KINDELORA affirmation card: {html.escape(item["text"],quote=True)}">
<title>KINDELORA | {theme}</title>
<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#21152a" stop-opacity=".25"/><stop offset=".35" stop-color="#21152a" stop-opacity=".65"/><stop offset="1" stop-color="#21152a" stop-opacity=".95"/></linearGradient></defs>
<image href="data:{mime};base64,{data}" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"/>
<rect width="{W}" height="{H}" fill="url(#shade)"/>
{logo}
<text x="325" y="205" fill="#ffffff" font-size="65" font-weight="bold" font-family="Arial,sans-serif" letter-spacing="9">KINDELORA</text>
<text x="1200" y="1040" fill="#ffe2b6" font-size="44" font-family="Arial,sans-serif" text-anchor="middle" letter-spacing="10">{theme}</text>
{quote}
<rect x="130" y="2600" width="2140" height="3" fill="#ffe2b6" opacity=".7"/>
<text x="135" y="2750" fill="#ffffff" font-size="51" font-family="Arial,sans-serif">A little kindness can change a day.</text>
<text x="135" y="2825" fill="#ffe2b6" font-size="38" font-family="Arial,sans-serif">kindelora.pages.dev/#membership</text>
<rect x="1950" y="2640" width="305" height="305" rx="18" fill="#ffffff"/>
{qr_svg(1974,2664,257)}
</svg>'''
    Path(out).parent.mkdir(parents=True,exist_ok=True)
    Path(out).write_text(result,encoding="utf-8")
    return out

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--id",required=True);p.add_argument("--photo",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True);p.add_argument("--license-ref",required=True)
    a=p.parse_args()
    print(build(a.id,a.photo,a.out,a.license_ref))
