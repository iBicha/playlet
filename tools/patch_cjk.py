#!/usr/bin/env python3
"""Patch the Playlet Roku channel to render CJK (Chinese/Japanese/Korean) text.

Roku TVs whose system fonts lack CJK glyphs render Chinese video titles as
empty boxes (tofu). Playlet does not bundle its own fonts, so it inherits the
problem. The official YouTube app does not, because it ships its own font.

This tool:
  1. downloads a Playlet release (channel + component library zips),
  2. downloads Noto Sans SC and instances Regular/Bold static TTFs,
  3. rewires every system-font reference in the library to the bundled fonts,
  4. embeds the patched library inside the channel package,
  5. outputs a sideloadable zip (playlet-cjk.zip).

Requires: python3, fonttools, internet access.

Usage:
  python3 patch_cjk.py                 # latest release -> playlet-cjk.zip
  python3 patch_cjk.py --release v0.48.10
  python3 patch_cjk.py --remote-lib http://192.168.1.10:8899/playlet-lib.zip
                                       # small channel that loads the patched
                                       # lib from your own HTTP server instead
                                       # of embedding it (extra: playlet-cjk-channel.zip)

Sideload the result:
  curl --digest -u rokudev:PASSWORD \\
       -F "mysubmit=Install" \\
       -F "archive=@playlet-cjk.zip;type=application/octet-stream" \\
       http://ROKU_IP/plugin_install
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
import zipfile

REPO_RELEASE_API = "https://api.github.com/repos/iBicha/playlet/releases/latest"
REPO_RELEASE_TAG_API = "https://api.github.com/repos/iBicha/playlet/releases/tags/{tag}"
FONT_VARIABLE_TTF = ("https://github.com/google/fonts/raw/main/ofl/notosanssc/"
                     "NotoSansSC%5Bwght%5D.ttf")

REG_TTF = "pkg:/fonts/NotoSansSC-Regular.ttf"
BOLD_TTF = "pkg:/fonts/NotoSansSC-Bold.ttf"

# Roku system-font-name -> (Noto weight, HD size)
FONT_MAP = {
    "TinySystemFont":         ("Regular", 20),
    "TinyBoldSystemFont":     ("Bold", 20),
    "SmallestSystemFont":     ("Regular", 23),
    "SmallestBoldSystemFont": ("Bold", 23),
    "SmallSystemFont":        ("Regular", 25),
    "SmallBoldSystemFont":    ("Bold", 25),
    "MediumSystemFont":       ("Regular", 31),
    "MediumBoldSystemFont":   ("Bold", 31),
    "LargeSystemFont":        ("Regular", 34),
    "LargeBoldSystemFont":    ("Bold", 34),
    "HugeSystemFont":         ("Regular", 42),
    "HugeBoldSystemFont":     ("Bold", 42),
    "SystemFont":             ("Regular", 31),
    "BoldSystemFont":         ("Bold", 31),
}

# Font-node FILE uris -> weight (size comes from the size= attribute)
FILE_MAP = {
    "TinySystemFontFile": "Regular", "TinyBoldSystemFontFile": "Bold",
    "SmallestSystemFile": "Regular", "SmallestBoldSystemFontFile": "Bold",
    "SmallSystemFontFile": "Regular", "SmallBoldSystemFontFile": "Bold",
    "SystemFontFile": "Regular", "BoldSystemFontFile": "Bold",
    "MediumSystemFontFile": "Regular", "MediumBoldSystemFontFile": "Bold",
    "LargeSystemFontFile": "Regular", "LargeBoldSystemFontFile": "Bold",
    "HugeSystemFontFile": "Regular", "HugeBoldSystemFontFile": "Bold",
}

stats = {"xml": 0, "labels": 0, "fontdefs": 0}
skipped: list[tuple[str, str]] = []


def fetch(url: str, dest: str) -> None:
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        print(f"cached: {dest}")
        return
    print(f"download: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "playlet-cjk-patcher"})
    data = _open_with_retries(req).read()
    with open(dest, "wb") as f:
        f.write(data)


def _open_with_retries(req: urllib.request.Request, attempts: int = 4):
    last = None
    for n in range(attempts):
        try:
            return urllib.request.urlopen(req, timeout=120)
        except urllib.error.HTTPError as e:
            last = e
            wait = 2 * (n + 1)
            print(f"HTTP {e.code} from {req.full_url}, retrying in {wait}s ...")
            time.sleep(wait)
        except urllib.error.URLError as e:
            last = e
            time.sleep(2 * (n + 1))
    sys.exit(f"failed after {attempts} attempts: {req.full_url} ({last})")


def latest_release() -> str:
    import json
    req = urllib.request.Request(REPO_RELEASE_API.format(release="latest"),
                                 headers={"User-Agent": "playlet-cjk-patcher"})
    with _open_with_retries(req) as r:
        return json.load(r)["tag_name"]


def release_assets(tag: str) -> dict[str, str]:
    import json
    url = REPO_RELEASE_TAG_API.format(tag=tag)
    req = urllib.request.Request(url, headers={"User-Agent": "playlet-cjk-patcher"})
    with _open_with_retries(req) as r:
        data = json.load(r)
    assets = {a["name"]: a["browser_download_url"] for a in data["assets"]}
    for needed in ("playlet.zip", "playlet-lib.zip"):
        if needed not in assets:
            sys.exit(f"release {tag} has no {needed} asset")
    return assets


def make_static_fonts(var_ttf: str, out_dir: str) -> tuple[str, str]:
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    outs = []
    for weight, name in ((400, "Regular"), (700, "Bold")):
        out = os.path.join(out_dir, f"NotoSansSC-{name}.ttf")
        if not os.path.exists(out):
            font = TTFont(var_ttf)
            instantiateVariableFont(font, {"wght": weight}, inplace=True)
            font.save(out)
        outs.append(out)
    return outs[0], outs[1]


def patch_xml(name: str, data: str) -> str:
    needed: set[str] = set()

    # 1) attributes like font= / focusedFont= with system font names
    def font_attr(m: re.Match) -> str:
        attr, fname = m.group(1), m.group(2)
        if fname not in FONT_MAP:
            skipped.append((name, "unknown font attr " + fname))
            return m.group(0)
        needed.add(fname)
        cid = "Cjk" + fname.replace("SystemFont", "")
        return f'{attr}="dictionary:{cid}"'

    data = re.sub(r'\b(font|focusedFont|hintFont|focusedHintFont|hintTextFont)="font:(\w*?SystemFont)"',
                  font_attr, data)

    # 2) <Font ... uri="font:XXXSystemFontFile"> and fontUri= attributes -> bundled ttf
    def font_uri_sub(m: re.Match) -> str:
        pre, fname, post = m.group(1), m.group(2), m.group(3)
        if fname not in FILE_MAP:
            skipped.append((name, "unknown font file " + fname))
            return m.group(0)
        return pre + (BOLD_TTF if FILE_MAP[fname] == "Bold" else REG_TTF) + post

    data = re.sub(r'(<Font\b[^>]*?\buri=")font:(\w*?SystemFontFile)(")', font_uri_sub, data)
    data = re.sub(r'(fontUri=")font:(\w*?SystemFontFile)(")', font_uri_sub, data)

    # 3) <Label>/<ScrollingLabel> without font= -> dictionary:CjkMedium
    #    labels that carry their own <Font role="font"> child are skipped; that
    #    child's uri was already fixed by pass 2
    out = []
    i = 0
    tag_re = re.compile(r"<(Label|ScrollingLabel)\b")
    while True:
        m = tag_re.search(data, i)
        if not m:
            out.append(data[i:])
            break
        start = m.start()
        out.append(data[i:start])
        j = start + 1
        quote = None
        while j < len(data):  # find end of opening tag, respecting quotes
            c = data[j]
            if quote:
                if c == quote:
                    quote = None
            elif c in "\"'":
                quote = c
            elif c == ">":
                break
            j += 1
        tag = data[start:j + 1]
        selfclose = tag.rstrip().endswith("/>")
        end = j + 1
        if not selfclose:
            close = data.find(f"</{m.group(1)}>", end)
            body_end = close if close != -1 else len(data)
        else:
            body_end = end
        body = data[end:body_end]
        has_role_font = "<Font" in body
        has_font = re.search(r"\bfont\s*=", tag) is not None
        if not has_font and not has_role_font:
            stats["labels"] += 1
            insert = ' font="dictionary:CjkMedium"' + ("/>" if selfclose else ">")
            out.append(tag[:-2 if selfclose else -1] + insert)
        else:
            out.append(tag)
        i = end  # emit body verbatim on the next pass; never skip it
    data = "".join(out)

    # 4) inject the required <Font> definitions after the first <children>
    if needed and "<children>" in data:
        defs = []
        for fname in sorted(needed):
            weight, size = FONT_MAP[fname]
            cid = "Cjk" + fname.replace("SystemFont", "")
            uri = BOLD_TTF if weight == "Bold" else REG_TTF
            defs.append(f'        <Font id="{cid}" uri="{uri}" size="{size}" />')
        data = data.replace("<children>", "<children>\n" + "\n".join(defs), 1)
        stats["fontdefs"] += len(defs)
    elif needed:
        skipped.append((name, "font refs but no <children>"))
    if needed:
        stats["xml"] += 1
    return data


def patch_lib(lib_zip: str, regular_ttf: str, bold_ttf: str, out_zip: str) -> None:
    zin = zipfile.ZipFile(lib_zip)
    entries = {}
    for n in zin.namelist():
        if n.endswith("/"):
            continue
        data = zin.read(n)
        if n.endswith(".xml"):
            data = patch_xml(n, data.decode("utf-8")).encode("utf-8")
        elif n.endswith(".brs"):
            text = data.decode("utf-8")
            if n == "components/ContextMenu/ContextMenuRow.brs":
                text = text.replace('m.top.font = "font:SmallestBoldSystemFont"',
                                    'm.top.font = m.top.findNode("CjkSmallestBold")')
                text = text.replace('m.top.font = "font:SmallestSystemFont"',
                                    'm.top.font = m.top.findNode("CjkSmallest")')
                assert "font:Smallest" not in text
            elif n == "components/Screens/RemoteScreen/RemoteScreen.brs":
                text = text.replace('"fontUri": "font:MediumSystemFontFile"', f'"fontUri": "{BOLD_TTF}"')
                text = text.replace('"fontUri": "font:SystemFontFile"', f'"fontUri": "{REG_TTF}"')
                assert "font:SystemFontFile" not in text and "font:MediumSystemFontFile" not in text
            data = text.encode("utf-8")
        entries[n] = data
    entries["fonts/NotoSansSC-Regular.ttf"] = open(regular_ttf, "rb").read()
    entries["fonts/NotoSansSC-Bold.ttf"] = open(bold_ttf, "rb").read()
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zout:
        for n, data in entries.items():
            zout.writestr(n, data)
    print(f"patched lib: {len(entries)} entries -> {out_zip}")
    for s in skipped:
        print("SKIP:", s)


def build_channel(channel_zip: str, lib_zip: str | None, remote_url: str | None,
                  out_zip: str) -> None:
    zin = zipfile.ZipFile(channel_zip)
    ch = {}
    for n in zin.namelist():
        if n.endswith("/"):
            continue
        data = zin.read(n)
        if n == "components/BootstrapScene/BootstrapScene.brs":
            text = data.decode("utf-8")
            old = "return [\n        githubSquashFs\n        githubZip\n        embedded\n    ]"
            if remote_url:
                new = ("return [\n        { type: \"debug-zip\", link: \"" + remote_url
                       + "\" }\n        githubSquashFs\n        githubZip\n        embedded\n    ]")
            else:
                new = "return [\n        embedded\n        githubSquashFs\n        githubZip\n    ]"
            assert old in text, "upstream BootstrapScene changed; adjust the patcher"
            data = text.replace(old, new).encode("utf-8")
        ch[n] = data
    if lib_zip is not None:
        ch["lib/playlet-lib.zip"] = open(lib_zip, "rb").read()
    with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as zout:
        for n, data in ch.items():
            zout.writestr(n, data)
    print(f"channel: {len(ch)} entries, {os.path.getsize(out_zip)/1e6:.1f} MB -> {out_zip}")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--release", default=None,
                    help="Playlet release tag (default: latest)")
    ap.add_argument("--work-dir", default=".playlet-cjk-work",
                    help="cache directory for downloads (default: ./.playlet-cjk-work)")
    ap.add_argument("--out-dir", default=".", help="output directory (default: cwd)")
    ap.add_argument("--remote-lib", default=None, metavar="URL",
                    help="also build a small channel that loads the patched lib "
                         "from this URL instead of embedding it")
    args = ap.parse_args()

    os.makedirs(args.work_dir, exist_ok=True)
    os.makedirs(args.out_dir, exist_ok=True)
    tag = args.release or latest_release()
    print(f"release: {tag}")
    assets = release_assets(tag)

    channel_zip = os.path.join(args.work_dir, "playlet.zip")
    lib_zip = os.path.join(args.work_dir, "playlet-lib.zip")
    fetch(assets["playlet.zip"], channel_zip)
    fetch(assets["playlet-lib.zip"], lib_zip)

    var_ttf = os.path.join(args.work_dir, "NotoSansSC-var.ttf")
    fetch(FONT_VARIABLE_TTF, var_ttf)
    try:
        regular, bold = make_static_fonts(var_ttf, args.work_dir)
    except ImportError:
        sys.exit("fonttools is required: pip install fonttools")

    lib_out = os.path.join(args.out_dir, "playlet-lib-cjk.zip")
    stats.clear(); stats.update({"xml": 0, "labels": 0, "fontdefs": 0})
    patch_lib(lib_zip, regular, bold, lib_out)

    channel_out = os.path.join(args.out_dir, "playlet-cjk.zip")
    build_channel(channel_zip, lib_out, None, channel_out)
    if args.remote_lib:
        channel_out2 = os.path.join(args.out_dir, "playlet-cjk-channel.zip")
        build_channel(channel_zip, None, args.remote_lib, channel_out2)

    print("\nDone. Sideload with:")
    print(f"  curl --digest -u rokudev:PASSWORD -F \"mysubmit=Install\" \\")
    print(f"       -F \"archive=@{channel_out};type=application/octet-stream\" \\")
    print(f"       http://ROKU_IP/plugin_install")


if __name__ == "__main__":
    main()
