# 陪诊研习室

适配电脑和手机的医疗陪诊顾问题库网页。

**在线使用：https://esplorare.github.io/peizhen-study/**

完整收录《医疗陪诊顾问-题库202512》72 页中的 470 道题：300 道单选、70 道多选、100 道判断。保留原题号、参考答案、解析及重复题，并按内容整理为 15 个知识专题。

## 功能

- 顺序练习、随机练习、专题筛选、题目与解析搜索。
- 答题判分、错题自动收录、答对后自动移出错题本。
- 收藏、逐题学习笔记、背题模式、放大文字。
- 20 / 50 / 100 题限时模拟测验，交卷后查看成绩和答卷。
- 学习记录自动保存、JSON 备份导入导出。
- 原 PDF 页码入口及内嵌原 PDF 的单文件离线版。

## 记录与备份

每位访客的学习记录保存在自己的浏览器中，不会上传到 GitHub，也不会与其他人共享。换设备、换浏览器、从旧网址迁移或清理浏览器数据之前，请在「数据管理」导出备份，在新浏览器导入。

练习模式需点击「确认答案」才判分。多选题少选、多选均算错。背题不产生新的答题记录。模拟测验每题等值，未答题计零分；关闭浏览器不会重置截止时间，重新打开后会结算已经到期的测验。

## GitHub Pages 发布

发布来源为 GitHub Actions，配置文件为 [pages.yml](.github/workflows/pages.yml)。推送到 `main` 后会自动检查脚本并发布 `dist/` 目录。也可在 Actions 页面手动运行该工作流。

- 站点：https://esplorare.github.io/peizhen-study/
- 发布进度：https://github.com/ESPLORARE/peizhen-study/actions
- Pages 设置：https://github.com/ESPLORARE/peizhen-study/settings/pages

网页中的资源均使用相对路径，可在 GitHub Pages 的仓库子路径下运行，无需 API 密钥、数据库或第三方 CDN。

## 本地使用

双击 `dist/index.html`，保持同目录其他文件完整；或者下载 `dist/offline.html` 单独打开。手机浏览器如不支持直接运行本地 HTML，请使用在线版。

本地 HTTP 预览：

```sh
python -m http.server 5173 --bind 127.0.0.1 --directory dist
```

浏览器集成测试：安装开发依赖后运行 `npm test`。测试文件默认使用 Windows Edge，可按实际环境修改可执行路径。测试使用独立浏览器环境。

## 原文核对

题干、选项、答案和解析从原 PDF 提取，合并跨页文字，不补写原文。已发现的 10 处原文矛盾或缺失均已标注，见 `extraction-report.json` 和网页中的「原文问题标注」筛选。判分仍沿用原题库答案。

`question-bank.json` 是结构化题库；`extract_questions.py` 是提取脚本；`verify-source.py` 比对 470 题与原 PDF。运行提取或原文比对脚本前，需安装 PyMuPDF，并将原文件放在仓库的上一级目录。

本项目用于题库学习，题库原文及参考答案未作医学或法律有效性审核。
