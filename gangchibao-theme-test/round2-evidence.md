# Theme Engine Round 2｜獨立 V8 唯讀測試站

狀態：IMPLEMENTED / BROWSER VERIFICATION PENDING
日期：2026-09-13

## 實裝
- `gangchibao-theme-test/index.html`：Theme 001 獨立目次與宿主前置頁。
- `gangchibao-theme-test/theme-001.css`：佛教流通本宿主版型；不載入正式 V8 CSS。
- `gangchibao-theme-test/reader.html`：獨立 reader；只以 GET 讀取 `../gangchibao-v8/unit-<id>.md`，不持有正文副本、不寫回正式 V8。

## 隔離證據
- 本輪所有 GitHub 寫入路徑均位於 `gangchibao-theme-test/`。
- 未更新 `gangchibao-v8/`、`gangchibao-v8-new/`、`gangchibao-v9/` 的任何檔案。
- reader 明示 `data-source-mode="readonly-v8"` 僅在成功讀取後設定；讀取失敗時改為 `failed`，不得把部署成功冒充正文成功。

## 正文來源
22 單元沿用正式 V8 的既有 unit Markdown：30000、30210、30220、30230、30240B、30250、30260B、30270B、30280B、30310B、30320、30330、30340、30350A、30360、30370、30380、30390、30410A、30430、30440、30450。

## Theme 001 寄生層
Round 2 只建立宿主殼與唯讀接線，不提前宣告污染驗收成功。目次、字體、版心、經名式前置頁、低成本黑白紙本語法已由獨立 CSS 接管；作者自薦與完整出版前置系統留待 Round 3。

## 驗收門檻
Round 2 只有在公開頁實際載入，且至少抽驗 30000、30390、30450 三個單元正文均成功顯示後才可標記 PASS。GitHub commit / Pages deployment 本身不等於 PASS。
