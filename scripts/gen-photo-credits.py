# Regenerate photo-credits.html from assets/spots-credits.json and the photoUrl pins in plan.html.
# Usage: python3 scripts/gen-photo-credits.py
import json,html,re,urllib.parse
import os
P=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
cr=json.load(open(P+'assets/spots-credits.json'))
s=open(P+'plan.html').read()
names={}
for m in re.finditer(r"""\{name:('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"),wiki:(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"),photoUrl:'([^']+)'""",s):
    names[m.group(2)]=m.group(1)[1:-1].replace("\\'","'")
rows=[]
for u,v in sorted(cr.items(),key=lambda kv:names.get(kv[0],'').lower()):
    f=v['file'];page='https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(f.replace(' ','_'))
    rows.append(f'<li><b>{html.escape(names.get(u,""))}</b> &middot; <a href="{page}" rel="noopener">{html.escape(f)}</a> &middot; {html.escape(v["artist"])} &middot; {html.escape(v["license"])}</li>')
out=f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="https://tripva.app/photo-credits">
  <title>Photo credits · Tripva</title>
  <link rel="icon" type="image/svg+xml" href="icon.svg">
  <style>
    *{{box-sizing:border-box}}body{{margin:0;background:#0a0a12;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6}}
    main{{max-width:920px;margin:0 auto;padding:48px 20px}}h1{{font-size:32px;margin:0 0 8px}}p{{color:rgba(248,250,252,.72)}}
    ul{{list-style:none;padding:0;margin:24px 0}}li{{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:14px;color:rgba(248,250,252,.72);overflow-wrap:anywhere}}
    li b{{color:#fff}}a{{color:#9b87f5}}
  </style>
</head>
<body>
  <main>
    <p><a href="/plan">&larr; Back to planning</a></p>
    <h1>Photo credits</h1>
    <p>The place photos in the Tripva trip planner come from Wikimedia Commons. Each is used under the licence shown; follow the file link for the full licence and author details. Photos are resized and cropped to fit the cards.</p>
    <ul>
      {chr(10).join("      "+r for r in rows).lstrip()}
    </ul>
  </main>
</body>
</html>
'''
open(P+'photo-credits.html','w').write(out)
print(len(rows),'rows; unnamed',sum(1 for u in cr if u not in names))
