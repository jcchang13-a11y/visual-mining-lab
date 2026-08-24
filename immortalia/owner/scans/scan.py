from __future__ import annotations

import json
import math
import os
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[3]
ROOT = Path(os.environ.get("IMMORTALIA_SCAN_ROOT", DEFAULT_ROOT)).resolve()
OUT = Path(os.environ.get("IMMORTALIA_SCAN_OUT", ROOT / "immortalia" / "owner" / "scans" / "latest.json"))

TEXT_EXTS = {".html", ".md", ".txt"}
STOP = set("""
的 了 是 在 和 與 及 或 而 也 有 一 個 這 那 我 你 他 她 它 我們 你們 他們 就 都 不 可 以 之 其 於 為 對 會 要
現在 目前 這裡 一個 內容 頁面 網站 首頁 文件 資料 系統 專案 工作 功能 工具 使用 開始 結果
immortalia owner console current google system website index html text notes files file image images page pages
mother nostromo

the a an of in on for and or is are be as by from this that it we you they with at into over under our your
""".split())

CAPABILITIES = {
    "mycelium": {
        "labels": ["香菇", "菌絲", "大棚", "agent", "模擬"],
        "can": ["閱讀代理", "比較閱讀", "群體反應模擬", "異質解讀", "影片閱讀"],
        "experiment": "先做一輪小型閱讀／模擬實驗，不改正文、不公開發布。",
    },
    "uncultured": {
        "labels": ["媒文化", "影像", "visual", "圖片", "照片", "採礦", "視覺"],
        "can": ["視覺轉譯", "插圖候選", "素材採礦", "視覺語法生成"],
        "experiment": "先產生一小組視覺方向或候選，不直接全量製作。",
    },
    "terminus": {
        "labels": ["端點星", "terminus", "概念", "思想", "理論"],
        "can": ["概念抽象", "理論對照", "問題重構", "概念壓力測試"],
        "experiment": "先對一個明確問題做一輪概念壓力測試。",
    },
    "dazibao": {
        "labels": ["大字報", "dazibao", "公告", "發布"],
        "can": ["對外摘要", "短文輸出", "議題發布", "宣傳轉譯"],
        "experiment": "可先生成草稿；任何公開發布仍需島主批准。",
    },
    "immortalia": {
        "labels": ["蓬萊", "神秘檔案", "列子", "歸墟"],
        "can": ["世界觀容器", "跨文本索引", "材料歸檔", "敘事化包裝"],
        "experiment": "可先建立候選索引與交叉連結建議；不自動改正文。",
    },
}

TARGETS = [
    ("《剛吃飽》／《金剛經》", ["金剛經", "剛吃飽"], "writing"),
    ("影片材料", ["影片", "video"], "media"),
    ("蓬萊文本與神秘檔案", ["列子", "蓬萊", "神秘檔案", "歸墟"], "archive"),
    ("網站公開輸出", ["大字報", "公告", "發布", "public"], "public"),
]


def strip_html(text: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text)


def tokens(text: str) -> Counter:
    latin = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", text.lower())
    han_runs = re.findall(r"[\u4e00-\u9fff]{2,18}", text)
    han = []
    for run in han_runs:
        if 2 <= len(run) <= 6:
            han.append(run)
        else:
            for n in (2, 3, 4):
                han.extend(run[i:i+n] for i in range(0, len(run)-n+1))
    seq = [x for x in latin + han if x not in STOP and not x.isdigit()]
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


def idf_map(docs):
    n = max(len(docs), 1)
    df = Counter()
    for d in docs:
        df.update(set(d["tok"]))
    return {t: math.log((n + 1) / (c + 1)) + 1 for t, c in df.items()}


def same_local_folder(a, b):
    return a.rsplit("/", 1)[0] == b.rsplit("/", 1)[0]


def relation_candidates(docs):
    idf = idf_map(docs)
    rows = []
    for i, a in enumerate(docs):
        for b in docs[i + 1:]:
            if same_local_folder(a["path"], b["path"]):
                continue
            common = set(a["tok"]) & set(b["tok"])
            weighted = []
            for t in common:
                base = min(a["tok"][t], b["tok"][t])
                score = base * idf.get(t, 1.0) * min(len(t), 6)
                if score >= 5.2:
                    weighted.append((score, t))
            weighted.sort(reverse=True)
            terms = [t for _, t in weighted[:6]]
            if len(terms) < 2:
                continue
            raw_score = round(sum(s for s, _ in weighted[:6]))
            if raw_score < 18:
                continue
            confidence = "高" if raw_score >= 42 else "中" if raw_score >= 28 else "低"
            if confidence == "低":
                continue
            rows.append({
                "id": f"rel-{len(rows)+1:03d}",
                "a": a["path"],
                "b": b["path"],
                "why": "共享較具辨識度的概念／語彙：" + "、".join(terms),
                "score": raw_score,
                "confidence": confidence,
                "kind": "關聯發現",
                "route": "auto_log" if confidence == "中" else "review_link",
                "next_step": "已自動記錄；高信心項目送交島主決定是否建立正式交叉連結。" if confidence == "高" else "已自動記錄，暫不改正文。",
            })
    rows.sort(key=lambda x: x["score"], reverse=True)
    return rows[:16]


def capability_candidates(docs):
    text_by_path = {d["path"]: d["text"].lower() for d in docs}
    project_hits = {}
    for key, info in CAPABILITIES.items():
        matched = []
        for path, text in text_by_path.items():
            hit_count = sum(1 for label in info["labels"] if label.lower() in text)
            if hit_count >= 2:
                matched.append((hit_count, path))
        matched.sort(reverse=True)
        project_hits[key] = [p for _, p in matched[:6]]

    hits = []
    for key, info in CAPABILITIES.items():
        if not project_hits[key]:
            continue
        for target, needles, target_type in TARGETS:
            target_paths = []
            for path, text in text_by_path.items():
                hit_count = sum(1 for n in needles if n.lower() in text)
                if hit_count:
                    target_paths.append((hit_count, path))
            target_paths.sort(reverse=True)
            if not target_paths:
                continue
            source = project_hits[key][0]
            target_example = target_paths[0][1]
            if source == target_example:
                continue
            route = "approval_required" if key == "dazibao" or target_type == "public" else "experiment_candidate"
            hits.append({
                "id": f"cap-{len(hits)+1:03d}",
                "system": key,
                "source": source,
                "target": target,
                "target_example": target_example,
                "can": info["can"],
                "kind": "能力配對",
                "confidence": "中",
                "route": route,
                "next_step": info["experiment"],
                "status": "待島主批准" if route == "approval_required" else "可跑一輪小實驗",
            })
    return hits[:14]


def route_actions(relations, capabilities):
    return {
        "auto_logged": [x["id"] for x in relations if x["route"] == "auto_log"],
        "review_links": [x["id"] for x in relations if x["route"] == "review_link"],
        "experiment_candidates": [x["id"] for x in capabilities if x["route"] == "experiment_candidate"],
        "approval_required": [x["id"] for x in capabilities if x["route"] == "approval_required"],
        "policy": {
            "auto": "只自動做低風險、可逆的記錄與排隊，不自動改正文、不自動公開發布。",
            "experiment": "能力配對先跑最小實驗；實際需要外部素材或尚未接上的子系統時，標記為候選，不假裝已執行。",
            "approval": "公開發布、批量生產、正文修改、刪除與任何有成本的行為，一律等島主批准。",
        },
    }


def main():
    docs = collect_docs()
    relations = relation_candidates(docs)
    capabilities = capability_candidates(docs)
    payload = {
        "schema": 2,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "documents_scanned": len(docs),
        "relations": relations,
        "capabilities": capabilities,
        "actions": route_actions(relations, capabilities),
        "note": "v2 啟發式掃描器：降低共通詞雜訊，加入信心分級與執行路由。高階語義與真正跨系統執行仍需後續服務。",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "schema": 2,
        "documents_scanned": payload["documents_scanned"],
        "relations": len(relations),
        "capabilities": len(capabilities),
        "auto_logged": len(payload["actions"]["auto_logged"]),
        "experiment_candidates": len(payload["actions"]["experiment_candidates"]),
        "approval_required": len(payload["actions"]["approval_required"]),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
