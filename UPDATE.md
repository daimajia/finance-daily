# 如何更新每日数据

所有内容在 `data/*.json`，网站无需构建，改 JSON 后刷新即可。每个文件的 `days` 是以日期 `YYYY-MM-DD` 为键的对象，**新增一天就加一个新键，旧日期保留**（自动出现在“归档”和日历选择器中，有数据的日期可点选；最新日期默认显示）。

| 栏目 | 文件 |
|---|---|
| X 金融博主观点日报（每日 08:00 北京时间） | `data/x-digest.json` |
| 美股财报速览（美东日期） | `data/earnings.json` |
| 美银牛熊指标（每周六） | `data/bofa.json` |
| 美伊局势追踪 | `data/iran.json` |

首页「今日看板」按所选日期汇总：今日要点（x-digest / earnings 中 `"highlight": true`）、X 博主精选、财报速览摘要、美伊局势要点、美银牛熊（若该日无周更则提示最近一期）。某栏目该日无数据时明确显示「该日无…」，不静默跳日。

## x-digest.json
```json
"2026-10-22": {
  "date": "2026-10-22",
  "topics": [
    {"title": "主题名", "items": [
      {"text": "观点正文", "handles": ["KobeissiLetter"], "highlight": true, "unverified": false}
    ]}
  ]
}
```
`handles` 不带 @，自动链接到 `https://x.com/<handle>`。`unverified: true` 显示“未证实”标签。

## earnings.json
```json
"2026-10-21": {
  "date": "2026-10-21",
  "sessions": [
    {"name": "盘前", "sources": ["https://..."], "items": [
      {"ticker": "XXX", "eps": "1.00 vs 0.90", "revenue": "10亿 vs 9亿", "notes": "指引等", "move": "+3%", "dir": "up", "highlight": false}
    ]},
    {"name": "盘后", "sources": [], "items": []}
  ]
}
```
`dir`: `up` / `down` / `flat`（决定颜色）。缺失字段留空字符串，显示为“—”。

## bofa.json / iran.json
```json
"2026-10-24": {"date": "2026-10-24", "items": [
  {"text": "内容", "handles": ["handle"], "source": "https://..."}
]}
```
`bofa.json` 顶层 `nextIssue` 改为下一期日期（无数据时显示“下一期：…”）。

## 注意
- 只录入来源中的数字，不要编造。
- 修改后用 `python3 -m json.tool data/xxx.json` 校验格式。
- 本地预览：`cd /workspace/finance-site && python3 -m http.server 8080`（直接双击 html 无法 fetch JSON）。
