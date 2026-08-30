from pathlib import Path
import re

ROOT = Path("gangchibao-v8")

# Exact legacy forms that appeared during the V3→V8 construction process.
EXACT = {
    "X = NOT X": "X = ～X",
    "入流 = 入̸流̸": "入流 = ～入流",
    "福德 = 福̸德̸": "福德 = ～福德",
    "莊嚴 = 莊̸嚴̸": "莊嚴 = ～莊嚴",
    '"S" / S = S barred': "{{S}}",
    '"S"／S = S barred': "{{S}}",
    'S / S = S barred': "{{S}}",
    'S／S = S barred': "{{S}}",
    '"般若波羅蜜" / 般若波羅蜜 = 般若波羅蜜 barred': "{{般若波羅蜜}}",
    '"般若波羅蜜"／般若波羅蜜 = 般若波羅蜜 barred': "{{般若波羅蜜}}",
    '"微塵" / 微塵 = 微塵 barred': "{{微塵}}",
    '"微塵"／微塵 = 微塵 barred': "{{微塵}}",
    '"世界" / 世界 = 世界 barred': "{{世界}}",
    '"世界"／世界 = 世界 barred': "{{世界}}",
    '"三十二相" / 三十二相 = 三十二相 barred': "{{三十二相}}",
    '"三十二相"／三十二相 = 三十二相 barred': "{{三十二相}}",
    '"心" / 心 = 心 barred': "{{心}}",
    '"心"／心 = 心 barred': "{{心}}",
    '「心」／心 = 心 barred': "{{心}}",
    r'\frac{「S」}{S \neq S}': "{{S}}",
    r'\frac{「大身」}{大身 \neq 大身}': "{{大身}}",
    "毛胚房版": "毛坯房版",
    "毛胚房": "毛坯房",
}

# Conservative generic repairs. These only touch explicit formula syntax,
# not prose and not Lacanian $ / barred-subject terminology.
GENERIC = [
    (re.compile(r'([A-Za-z\u4e00-\u9fff]+)\s*=\s*NOT\s+\1'), lambda m: f"{m.group(1)} = ～{m.group(1)}"),
    (re.compile(r'「([^」]+)」\s*[／/]\s*～\1'), lambda m: "{{" + m.group(1) + "}}"),
    (re.compile(r'"([^"\n]+)"\s*[／/]\s*\1\s*=\s*\1\s+barred'), lambda m: "{{" + m.group(1) + "}}"),
]

changed = []
for path in sorted(ROOT.glob("*")):
    if path.suffix.lower() not in {".md", ".html"}:
        continue
    text = path.read_text(encoding="utf-8")
    new = text
    for old, replacement in EXACT.items():
        new = new.replace(old, replacement)
    for pattern, replacement in GENERIC:
        new = pattern.sub(replacement, new)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed.append(str(path))

print("changed", len(changed))
for p in changed:
    print(p)
