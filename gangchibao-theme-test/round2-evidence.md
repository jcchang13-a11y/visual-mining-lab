# Theme Engine Round 2｜獨立 V8 唯讀測試站

狀態：IMPLEMENTED / PUBLIC SELF-CHECK ADDED / BROWSER VERIFICATION PENDING
日期：2026-09-14

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

## 部署鏈補強（2026-09-14）
- self-check 建立 commit `27e0b0d...` 對應的當次 `Deploy Visual Mining Lab` run `34764373668` 結論是 **cancelled**。因此不能把「建立 self-check」那一筆 commit 本身說成已成功部署。
- self-check 檔案其後持續存在於 main。2026-09-14 重新核對，較新的站點部署 run `34800385786` 對 head `02cd9a505f15fb94d9c9ab195fa3313774b05524` 已 `completed / success`。
- 再次核對目前更晚的站點部署：`Deploy Visual Mining Lab` run `34806659196`，head `b167ec78bfc5d07aa6eb5870f6ef7599889f4f88`，建立時間 2026-09-14T04:36:05Z，結論同樣為 **completed / success**。這證明目前成功部署世代仍持續位於 self-check 建立 commit 之後，沒有退回到 self-check 之前的站點版本。
- GitHub compare／歷史關係顯示後續成功部署 head 位於 self-check 建立 commit 之後；因此目前成功部署的 main 世代已包含 self-check 檔案，而不是停留在其之前。
- 以上仍只證明「包含 self-check 的後續 main 已通過站點部署流程」，不能取代公開瀏覽器內 JavaScript 實際 fetch 三個 Markdown 後顯示的 3/3 PASS。Round 2 仍不得提前宣告 PASS。
- 本輪再次嘗試從執行環境直接解析 `jcchang13-a11y.github.io` 取得公開頁，DNS 解析仍暫時失敗；此為外部驗證通道限制，不能被記為網站 FAIL，也不能被拿來當 PASS。

## 正文來源
22 單元沿用正式 V8 的既有 unit Markdown：30000、30210、30220、30230、30240B、30250、30260B、30270B、30280B、30310B、30320、30330、30340、30350A、30360、30370、30380、30390、30410A、30430、30440、30450。

本輪以 GitHub contents API 再核對三個抽驗來源存在且可讀：
- `unit-30000.md` blob `f7d4984faf1bcf1962fbf24389ac87ee1c6baf4e`
- `unit-30390.md` blob `90bc93dd7425fa23f217498a392826044fcee823`
- `unit-30450.md` blob `23dc3fd77b690ec67afabe163ab14ac7a7019d76`

以上只能證明 repo 來源存在，不能取代公開部署端的瀏覽器 fetch 驗證。

## 作者自薦 source of truth
- 2026-09-14 本輪再次直接讀取 Google Drive 原生文件《作者自薦｜張榮哲 × EVA》，revision：`ANLCKQmdSGQwKt49sg6oKHxwvHuY2APjzt5-nWpl1-FYz4ofwswsNeNwcI_QWNpAfoVTagXjfDWlSYW1TvmX8DLNglW-EZbZINd0QJtoE7k`。
- revision 與先前記錄一致；目前沒有看到比既有五句固定必選規則更新的狀態變更。正式進 Round 3 前仍須再次比對 revision。

## Theme 001 寄生層
Round 2 只建立宿主殼與唯讀接線，不提前宣告污染驗收成功。目次、字體、版心、經名式前置頁、低成本黑白紙本語法已由獨立 CSS 接管；作者自薦與完整出版前置系統留待 Round 3。

## Round 3 預備狀態
- `round3-preflight.md`、`round3-frontmatter-preview.html`、`round3-frontmatter.css`、`round3-prepared-evidence.md` 已存在，但明確維持 PREPARED / NOT ACTIVATED。
- 這些檔案只是把前置出版系統與五句固定作者自薦先做宿主映射，不得視為跳過 Round 2。

## 驗收門檻
Round 2 只有在公開頁實際載入，且 `round2-selfcheck.html` 顯示 3/3 PASS（30000、30390、30450 三單元皆可由部署端唯讀載入）後，才可標記 PASS 並進 Round 3。GitHub commit / Pages deployment / repo 原檔存在本身都不等於 PASS。
