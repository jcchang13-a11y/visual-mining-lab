# Theme Engine Round 2｜獨立 V8 唯讀測試站

狀態：IMPLEMENTED / PUBLIC SELF-CHECK ADDED / BROWSER VERIFICATION PENDING
日期：2026-09-15

## 實裝
- `gangchibao-theme-test/index.html`：Theme 001 獨立目次與宿主前置頁。
- `gangchibao-theme-test/theme-001.css`：佛教流通本宿主版型；不載入正式 V8 CSS。
- `gangchibao-theme-test/reader.html`：獨立 reader；只以 GET 讀取 `../gangchibao-v8/unit-<id>.md`，不持有正文副本、不寫回正式 V8。
- `gangchibao-theme-test/round2-selfcheck.html`：部署端自檢頁，會在瀏覽器中實際 fetch 30000、30390、30450 三個正式 V8 Markdown，三者皆 HTTP 成功且內容長度足夠才顯示 3/3 PASS；任一失敗即顯示 FAIL。

## 隔離證據
- 本輪所有 GitHub 寫入路徑均位於 `gangchibao-theme-test/`。
- 未更新 `gangchibao-v8/`、`gangchibao-v8-new/`、`gangchibao-v9/` 的任何檔案。
- reader 明示 `data-source-mode="readonly-v8"` 僅在成功讀取後設定；讀取失敗時改為 `failed`，不得把部署成功冒充正文成功。
- 建立 self-check 的 commit：`27e0b0dc27ee1a052585800634ffc0e24c8f2504`（2026-09-13T15:01:56Z）。

## 部署鏈補強
- self-check 建立 commit `27e0b0d...` 對應的當次 `Deploy Visual Mining Lab` run `34764373668` 結論是 **cancelled**，所以不能把那一筆 commit 本身說成已成功部署。
- self-check 檔案其後持續存在於 main；多個較新的站點部署均成功，包括 run `34800385786`、`34806659196`、`34810045291`、`34814585954`、`34844979794`。
- 2026-09-15 00:35 Asia/Taipei 後再次核對最新可見站點部署：run `34869600944`，head `3fb5805ed4369213889d9991958a54f2c67d5561`，建立時間 `2026-09-14T16:35:53Z`，結論 **completed / success**。這個成功世代明顯晚於 self-check 建立 commit，且 self-check 仍存在於 main。
- 2026-09-15 02:50 Asia/Taipei 本輪再核對：更新的 `Deploy Visual Mining Lab` run `34882127555`，head `a53b3bfce657ad5605128e8291cfe27d2974a562`，建立時間 `2026-09-14T18:39:23Z`，結論仍為 **completed / success**。因此 self-check 已跨越多個成功部署世代持續存在。
- 2026-09-15 03:15 Asia/Taipei 再核對：前一次 evidence refresh commit `d3c541433a82ca1e3e1f1d44a26d5393e3367e7f` 對應的 `Deploy Visual Mining Lab` run `34883329231` 已 **completed / success**，開始時間 `2026-09-14T18:51:11Z`。因此目前 main 上的 self-check 與 Round 2 證據檔至少已經過又一個成功站點部署世代。
- 上述證據只證明「包含 self-check 的後續 main 已通過站點部署流程」，不能取代公開瀏覽器內 JavaScript 實際 fetch 三個 Markdown 後顯示的 3/3 PASS。Round 2 仍不得提前宣告 PASS。

## 2026-09-15 03:15 瀏覽器驗證嘗試
- 執行環境確認存在系統 Chromium (`/usr/bin/chromium`) 與 Playwright Python 套件，因此本輪實際嘗試用真實 headless Chromium 開啟公開 self-check URL，而不是只做 HTTP／repo 靜態推論。
- Chromium 對 `https://jcchang13-a11y.github.io/.../round2-selfcheck.html` 的導覽被執行環境管理政策直接阻擋，回報 `net::ERR_BLOCKED_BY_ADMINISTRATOR`；這是驗證環境的外部網路限制，不是 self-check 自身回傳 FAIL。
- 另嘗試一般 HTTPS 連線，容器 DNS 無法解析 `jcchang13-a11y.github.io`；同樣只能證明本執行環境無法到達 GitHub Pages，不能把它記成網站失敗。
- 因此本輪仍維持 **BROWSER VERIFICATION PENDING**，不以 repo、commit、deployment success 或環境阻擋冒充 3/3 PASS。

## Self-check 程式邏輯核對
- `round2-selfcheck.html` 目前仍以相對路徑 `../gangchibao-v8/unit-<id>.md` 對 30000、30390、30450 做 `fetch(..., {cache:'no-store'})`。
- 每一項必須同時滿足 HTTP `ok` 與去 BOM／trim 後正文長度 > 100；最後只有 3/3 才設定 `data-round2-selfcheck="pass"` 並顯示 `ROUND 2 SELF-CHECK PASS`。
- 因此自檢頁本身沒有把部署成功、檔案存在或短空白回應誤算成 PASS；目前缺的仍是公開瀏覽器執行後的實際結果。

## 正文來源
22 單元沿用正式 V8 的既有 unit Markdown：30000、30210、30220、30230、30240B、30250、30260B、30270B、30280B、30310B、30320、30330、30340、30350A、30360、30370、30380、30390、30410A、30430、30440、30450。

先前以 GitHub contents API 抽驗三個來源存在且可讀：
- `unit-30000.md` blob `f7d4984faf1bcf1962fbf24389ac87ee1c6baf4e`
- `unit-30390.md` blob `90bc93dd7425fa23f217498a392826044fcee823`
- `unit-30450.md` blob `23dc3fd77b690ec67afabe163ab14ac7a7019d76`

以上只能證明 repo 來源存在，不能取代公開部署端的瀏覽器 fetch 驗證。

## 作者自薦 source of truth
- 2026-09-15 03:15 Asia/Taipei 再次直接讀取 Google Drive 原生文件《作者自薦｜張榮哲 × EVA》，revision 仍為 `ANLCKQmdSGQwKt49sg6oKHxwvHuY2APjzt5-nWpl1-FYz4ofwswsNeNwcI_QWNpAfoVTagXjfDWlSYW1TvmX8DLNglW-EZbZINd0QJtoE7k`，沒有新的升級／降級標記。
- 最新主檔仍明示：下載版固定保留原先兩句；另有「在理論與實踐之間，我選擇了躺平。」與 EVA 的「AI 可能會犯錯……本書所有的資訊都不重要。」標為固定出現；「我長期走入底層……最後都通往我的作者簡介。」已由隨機池升級為固定出現。合併工程規則後，目前五句固定必選沒有出現新的升級／降級狀態。
- 正式啟動 Round 3 前仍須再次比對 revision；若主檔更新，以 Drive 最新狀態覆蓋舊清單。

## Theme 001 寄生層
Round 2 只建立宿主殼與唯讀接線，不提前宣告污染驗收成功。目次、字體、版心、經名式前置頁、低成本黑白紙本語法已由獨立 CSS 接管；作者自薦與完整出版前置系統留待 Round 3。

## Round 3 預備狀態
- `round3-preflight.md`、`round3-frontmatter-preview.html`、`round3-frontmatter.css`、`round3-prepared-evidence.md` 已存在，但明確維持 PREPARED / NOT ACTIVATED。
- 這些檔案只是把前置出版系統與五句固定作者自薦先做宿主映射，不得視為跳過 Round 2。

## 驗收門檻
Round 2 只有在公開頁實際載入，且 `round2-selfcheck.html` 顯示 3/3 PASS（30000、30390、30450 三單元皆可由部署端唯讀載入）後，才可標記 PASS 並進 Round 3。GitHub commit / Pages deployment / repo 原檔存在本身都不等於 PASS。
