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
- 輸出：`matrix-001-nonfiction-theme001-reflow.html`
- 正文人工修改：NO
- PASS／FAIL：**ACTIVE / NOT YET PASS**（公開 render 尚待可驗證證據）

## Matrix 002
- 內容型態：學術型短稿，摘要＋章節＋引文＋語義註記＋腳註
- 作者／來源：自建假稿；虛構測試作者「周岑」
- Theme：002 冷硬日本動漫 × Cyberpunk
- 載體：reflow 螢幕原型（HTML responsive）；**不是 EPUB 完成宣告**
- 輸出：`matrix-002-academic-theme002-reflow.html`
- 正文人工修改：NO
- PASS／FAIL：**ACTIVE / NOT YET PASS**（公開 render 尚待可驗證證據）

## Matrix 003
- 內容型態：資料密集型出版物；正文＋資料表＋長欄位＋註釋＋混合中英文代碼
- 作者／來源：自建假稿；虛構測試作者「許度」
- Theme：001 臺大旁邊的影印店事故版
- 載體：reflow 螢幕原型（HTML responsive）；**不是 EPUB 完成宣告**
- 生產環節：自建資料稿 → 結構標記 → table/aside 資產辨識 → Theme 001 電子轉譯 → responsive render prototype
- 輸入結構：title/author、section、table/caption/thead/tbody、長字串、aside note、表後正文
- 輸出：`matrix-003-data-theme001-reflow.html`
- Theme 轉譯：保留 Theme 001 的低成本影印事故感，但事故只作用於視覺表面；不得改動資料值、表頭關係或閱讀順序。
- 正文人工修改：NO；無《剛吃飽》專屬結構。
- 跨 Theme 串味：本格只載入自身 inline Theme 001 規則，未引用 Theme 002 元件。
- 掉字／掉圖／掉註釋：source 中表格四列、caption、註 1 與表後正文均存在；本格無圖片。公開 render 待驗。
- 表格爆版：已加入獨立 `.table-wrap{overflow-x:auto}`，窄螢幕表格採橫向捲動而非壓縮到不可讀；實際 render 待驗。
- 字型失效：使用通用 serif fallback；混合中文、English、數字與長代碼作壓力資料。
- 閱讀順序：DOM 為 metadata → 摘要 → table → note → 表後正文；不依賴固定頁碼。
- PASS／FAIL：**ACTIVE / NOT YET PASS**
- 本輪新增覆蓋：首次加入「資料密集型＋表格溢出壓力＋Theme 001＋reflow」矩陣格，且更換第三位虛構作者。

## 本輪基準核查
- 2026-09-22 再讀 Drive 主表：搜尋結果顯示 ID `1cud5v02daJlI5W1-4B7zGjw8QHNaZB3yi1amYg3WQZs` 同表含 Theme 001 與 Theme 002；另一同名舊表僅含 Theme 001，不作現行母表。
- repo `theme-engine-universal-test/` 在本輪開始前實際只有 Matrix 001、002 與本 log；Matrix 003 為本輪新增。
- 嘗試由工具直接讀 GitHub Pages 公開 URL 未取得可用 render 證據，因此沒有把任何 HTML 原型升級為 PASS。

## 不得誤報
GitHub commit 只證明測試資產已寫入 repo，不等於公開部署、EPUB package、validator 或出版輸出 PASS。所有矩陣格均須取得對應載體的實際 render／檔案／格式證據後才能升級 PASS。
