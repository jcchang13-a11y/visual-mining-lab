# 文憑工廠 Theme Engine｜通用出版整機測試矩陣

## 基準更新
- 2026-09-22 起，不再把《剛吃飽》結構當成引擎前提。
- Google Drive `Theme Engine_主題設計總表`（ID `1cud5v02daJlI5W1-4B7zGjw8QHNaZB3yi1amYg3WQZs`）為 Theme 規格主表；目前採 22 項規格，Theme 001 與 Theme 002 均在同一母表。
- 舊 `gangchibao-theme-test/` 保留為第一產品歷史證據，不覆寫；新的通用測試放在 `theme-engine-universal-test/`。

## Matrix 001
- 內容型態：一般非虛構，純文字＋引文＋註釋
- 作者／來源：自建假稿；虛構測試作者「林未央」
- Theme：001 臺大旁邊的影印店事故版
- 載體：reflow 螢幕原型（HTML responsive）；不是 EPUB 完成宣告
- 輸出：`matrix-001-nonfiction-theme001-reflow.html`
- 正文人工修改：NO
- PASS／FAIL：ACTIVE / NOT YET PASS（公開 render 尚待可驗證證據）

## Matrix 002
- 內容型態：學術型短稿，摘要＋章節＋引文＋語義註記＋腳註
- 作者／來源：自建假稿；虛構測試作者「周岑」
- Theme：002 冷硬日本動漫 × Cyberpunk
- 載體：reflow 螢幕原型（HTML responsive）；不是 EPUB 完成宣告
- 輸出：`matrix-002-academic-theme002-reflow.html`
- 正文人工修改：NO
- PASS／FAIL：ACTIVE / NOT YET PASS（公開 render 尚待可驗證證據）

## Matrix 003
- 內容型態：資料密集型出版物；正文＋資料表＋長欄位＋註釋＋混合中英文代碼
- 作者／來源：自建假稿；虛構測試作者「許度」
- Theme：001 臺大旁邊的影印店事故版
- 載體：reflow 螢幕原型（HTML responsive）；不是 EPUB 完成宣告
- 輸出：`matrix-003-data-theme001-reflow.html`
- 正文人工修改：NO
- PASS／FAIL：ACTIVE / NOT YET PASS

## Matrix 004
- 內容型態：小說／敘事；三章連續敘事＋對話＋敘事停頓
- 作者／來源：自建假稿；虛構測試作者「沈岸」
- Theme：002 冷硬日本動漫 × Cyberpunk
- 載體：reflow 螢幕原型（HTML responsive）；不是 EPUB 完成宣告
- 輸出：`matrix-004-fiction-theme002-reflow.html`
- 正文人工修改：NO
- PASS／FAIL：ACTIVE / NOT YET PASS

## Matrix 005
- 內容型態：教材；學習目標＋正文＋示意圖＋圖說＋教師提示＋練習題＋可展開參考答案
- 作者／來源：自建假稿；第五位虛構測試作者「陳禾」
- Theme：001 臺大旁邊的影印店事故版
- 載體：reflow 螢幕原型（HTML responsive）；不是 EPUB 完成宣告
- 生產環節：教材假稿 → unit/objective/figure/figcaption/note/exercise/answer 資產辨識 → Theme 001 電子轉譯 → responsive prototype
- 輸出：`matrix-005-textbook-theme001-reflow.html`
- EPUB 關鍵預備：圖像使用可縮放 SVG；含 title/desc 替代資訊；figure 與 figcaption 同容器；不依賴固定頁碼、跨頁或絕對座標；章節有可連結 ID。
- 正文人工修改：NO
- 跨 Theme 串味：只使用 Theme 001 的低成本學術／教材介面，不含 Theme 002 工業動畫標記。
- 掉字／掉圖／掉註釋：source 中兩單元、示意圖、圖說、教師提示、兩題練習與答案均存在；實際公開 render／EPUB package 尚待驗證。
- 閱讀順序：metadata → TOC → Unit 01 → objective → body → figure+caption → teacher note → Unit 02 → exercise → answer。
- PASS／FAIL：ACTIVE / NOT YET PASS
- 本輪新增覆蓋：首次加入「教材＋第五位作者＋圖像／圖說黏著＋互動答案＋Theme 001＋reflow」矩陣格。

## 本輪基準核查
- 2026-09-23 再讀 Drive 主表：ID `1cud5v02daJlI5W1-4B7zGjw8QHNaZB3yi1amYg3WQZs` 同表含 Theme 001 與 Theme 002；另一同名舊表僅含 Theme 001，不作現行母表。
- repo 本輪開始前實際已有 Matrix 001–004 與本 log；Matrix 005 為本輪新增。
- 本輪沒有把 GitHub commit 當作 render／EPUB PASS；Matrix 001–005 均仍須取得對應載體的實際 render／檔案／格式證據。

## 不得誤報
GitHub commit 只證明測試資產已寫入 repo，不等於公開部署、EPUB package、validator 或出版輸出 PASS。所有矩陣格均須取得對應載體的實際 render／檔案／格式證據後才能升級 PASS。
