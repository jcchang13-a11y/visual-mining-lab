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
- 目前意義：首次把測試從《剛吃飽》專案目錄抽離，建立非榮哲作者、一般非虛構、Theme 001、reflow 螢幕原型的獨立矩陣格。下一 gate 必須驗證公開 render；之後才進真正 EPUB package／validator 與另一內容型態或 Theme 002。

## 不得誤報
GitHub commit `35331420e076b80f82ef39270b986dfece891da5` 只證明測試資產已寫入 repo，不等於公開部署或出版輸出 PASS。
