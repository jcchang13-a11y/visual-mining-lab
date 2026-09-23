# 文憑工廠 Theme Engine｜通用出版整機測試矩陣

## 基準更新
- 2026-09-22 起，不再把《剛吃飽》結構當成引擎前提。
- Google Drive `Theme Engine_主題設計總表`（ID `1cud5v02daJlI5W1-4B7zGjw8QHNaZB3yi1amYg3WQZs`）為 Theme 規格主表；目前採 22 項規格，Theme 001 與 Theme 002 均在同一母表。
- 舊 `gangchibao-theme-test/` 保留為第一產品歷史證據，不覆寫；新的通用測試放在 `theme-engine-universal-test/`。

## Matrix 001
- 內容型態：一般非虛構，純文字＋引文＋註釋
- 作者／來源：自建假稿；虛構測試作者「林未央」
- Theme：001 臺大旁邊的影印店事故版
- 載體：reflow 螢幕原型（HTML responsive）；**不是 EPUB 完成宣告**
- 生產環節：自建原稿 → 結構標記 → Theme 001 電子轉譯 → responsive render prototype
- 輸入結構：書名、作者、普通段落、章節、blockquote、aside note
- 輸出：`matrix-001-nonfiction-theme001-reflow.html`
- 正文人工修改：NO；測試正文沒有《剛吃飽》22 單元、佛經、作者自薦、110×190mm 前提
- 跨 Theme 串味：本輪尚未切 Theme，N/A
- 掉字／掉圖／掉註釋：原始 HTML 結構中無掉字；無圖片；註釋節點存在。瀏覽器公開部署 render 尚待 HTTP／視覺驗證。
- 表格爆版：N/A
- 字型失效：使用通用 serif fallback，不依賴外部字型；實際 render 待驗。
- 閱讀順序：DOM 順序為書名→作者→正文→章一→註釋→章二；實際 render 待驗。
- PASS／FAIL：**ACTIVE / NOT YET PASS**

## Matrix 002
- 內容型態：學術型短稿，摘要＋章節＋引文＋語義註記＋腳註
- 作者／來源：自建假稿；虛構測試作者「周岑」
- Theme：002 冷硬日本動漫 × Cyberpunk
- 載體：reflow 螢幕原型（HTML responsive）；**不是 EPUB 完成宣告**
- 生產環節：自建學術稿 → 結構標記 → Theme 002 電子轉譯 → responsive render prototype
- 輸入結構：title/author、abstract、section、blockquote、aside annotation、footnotes
- 輸出：`matrix-002-academic-theme002-reflow.html`
- Theme 轉譯：不使用霓虹、人物插畫或固定跨頁；以冷硬技術文件、節點編號、黑白工業界面、克制留白轉譯 002。這是電子語法，不是假裝紙本。
- 正文人工修改：NO；內容與《剛吃飽》無關，未要求 22 單元、110×190mm、作者自薦或佛經層級。
- 跨 Theme 串味：未引用 Theme 001 的影印事故 CSS／卡片／出版元件；待後續同稿切換測試做完整 gate。
- 掉字／掉圖／掉註釋：source 結構中正文、引文、annotation、2 則 footnote 均存在；本格無圖片。公開 render 尚待驗證。
- 表格爆版：N/A；後續資料密集型矩陣專測。
- 字型失效：使用 system / Noto Sans TC fallback，不依賴遠端字型；公開 render 待驗。
- 閱讀順序：DOM 為 metadata→abstract→section 1→quote→annotation→section 2→footnotes；不依賴頁碼。
- PASS／FAIL：**ACTIVE / NOT YET PASS**
- 本輪新增覆蓋：首次加入「不同作者＋學術型內容＋Theme 002＋reflow」矩陣格，與 Matrix 001 的作者、內容結構及 Theme 均不同。

## 不得誤報
GitHub commit 只證明測試資產已寫入 repo，不等於公開部署、EPUB package、validator 或出版輸出 PASS。Matrix 001 與 Matrix 002 均須取得實際 render／格式證據後才能升級 PASS。
