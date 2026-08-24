from __future__ import annotations

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "immortalia" / "owner" / "scans" / "latest.json"

TEXT_EXTS = {".html", ".md", ".txt"}
STOP = set("的 了 是 在 和 與 及 或 而 也 有 一 個 這 那 我 你 他 她 它 我們 你們 他們 就 都 不 可 以 之 其 於 為 與 及 to the a an of in on for and or is are be as by from this that it we you they".split())

CAPABILITIES = {
    "mycelium": {
        "labels": ["香菇", "菌絲", "大棚", "agent", "模擬"],
        "can": ["閱讀代理", "比較閱讀", "群體反應模擬", "異質解讀", "影片閱讀"],
    },
    "uncultured": {
        "labels": ["媒文化", "影像", "visual", "image", "圖片", "照片"],
        "can": ["視覺轉譯", "插圖候選", "素材採礦", "視覺語法生成"],
    },
    "terminus": {
        "labels": ["端點星", "terminus", "概念", "思想", "理論"],
        "can": ["概念抽象", "理論對照", "問題重構", "概念壓力測試"],
    },
    "dazibao": {
        "labels": ["大字報", "dazibao", "公告", "貼"],
        "can": ["對外摘要", "短文輸出", "議題發布", "宣傳轉譯"],
    },
    "immortalia": {
        "labels": ["蓬萊", "immortalia", "神秘檔案", "列子"],
        "can": ["世界觀容器", "跨文本索引", "材料歸檔", "敘事化包裝"],
    },
}


def strip_html(text: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text)


def tokens(text: str) -> Counter:
    latin = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", text.lower())
    han = re.findall(r"[\u4e00-\u9fff]{2,6}", text)
    seq = [x for x in latin + han if x not in STOP]
    return Counter(seq)


def collect_docs():
    docs = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTS:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith(".git/") or "/node_modules/" in f"/{rel}/" or rel.endswith("latest.json"):
            continue
        try:
            raw = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        plain = strip_html(raw) if path.suffix.lower() == ".html" else raw
        if len(plain.strip()) < 80:
            continue
        docs.append({"path": rel, "text": plain, "tok": tokens(plain)})
    return docs


def relation_candidates(docs):
    rows = []
    for i, a in enumerate(docs):
        for b in docs[i + 1 :]:
            if a["path"].split("/")[0] == b["path"].split("/")[0] and a["path"].rsplit("/", 1)[0] == b["path"].rsplit("/", 1)[0]:
                continue
            common = set(a["tok"]) & set(b["tok"])
            scored = sorted(common, key=lambda t: min(a["tok"][t], b["tok"][t]) * len(t), reverse=True)
            scored = [t for t in scored if len(t) >= 2][:8]
            if len(scored) < 2:
                continue
            score = sum(min(a["tok"][t], b["tok"][t]) * min(len(t), 6) for t in scored)
            if score < 12:
                continue
            rows.append({
                "a": a["path"],
                "b": b["path"],
                "why": "共享概念／語彙：" + "、".join(scored[:6]),
                "score": score,
                "kind": "關聯發現",
            })
    rows.sort(key=lambda x: x["score"], reverse=True)
    return rows[:20]


def capability_candidates(docs):
    text_by_path = {d["path"]: d["text"].lower() for d in docs}
    hits = []
    project_hits = {}
    for key, info in CAPABILITIES.items():
        matched = []
        for path, text in text_by_path.items():
            if any(label.lower() in text for label in info["labels"]):
                matched.append(path)
        project_hits[key] = matched[:8]

    targets = [
        ("《剛吃飽》／《金剛經》", ["金剛經", "剛吃飽"]),
        ("影片材料", ["影片", "video"]),
        ("蓬萊文本與神秘檔案", ["列子", "蓬萊", "神秘檔案"]),
        ("網站公開輸出", ["網站", "首頁", "公告"]),
    ]

    for key, info in CAPABILITIES.items():
        if not project_hits[key]:
            continue
        for target, needles in targets:
            target_paths = [p for p, text in text_by_path.items() if any(n.lower() in text for n in needles)]
            if not target_paths:
                continue
            hits.append({
                "system": key,
                "source": project_hits[key][0],
                "target": target,
                "target_example": target_paths[0],
                "can": info["can"],
                "kind": "能力配對",
            })
    return hits[:16]


def main():
    docs = collect_docs()
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "documents_scanned": len(docs),
        "relations": relation_candidates(docs),
        "capabilities": capability_candidates(docs),
        "note": "v1 為站內啟發式掃描器：先把管線接通；高階語義判斷之後可再接 LLM。",
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"documents_scanned": payload["documents_scanned"], "relations": len(payload["relations"]), "capabilities": len(payload["capabilities"])}))


if __name__ == "__main__":
    main()
