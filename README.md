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
- 国内模型 AI 答疑：题目中展开「问 AI」，可讲解本题、分析选项、生成记忆方法并继续追问。模拟测验中不提供答疑。

## AI 答疑：访客自己的 Key 直连 DeepSeek

每位访客在题目下展开「问 AI」，填写自己的 DeepSeek API Key，点击「使用并检测」，验证通过后即可提问。不提供共用 Key，不再经过旧的答疑中转域名。

浏览器只向固定的 `https://api.deepseek.com/models` 和 `/chat/completions` 发请求。Key 只作为官方请求的 Authorization 头发送，不放进题目、对话或 URL，也不发给 GitHub 或原中转服务。网站代码不写入 localStorage、sessionStorage、学习记录、笔记或导出备份；Key 仅保留在当前页面内存，刷新、关闭页面或点击「清除 Key」后清空。

密钥检测调用官方模型列表接口，不生成回答。发送问题会将当前题目、所选答案与当前最多四轮对话发送给 DeepSeek，费用由访客自己的账户承担。每次最多输出 1400 tokens；余额不足、密钥无效、限流和网络异常分别提示。聊天请求不会自动重试，避免重复付费。AI 解释不改动题库参考答案和判分。

个人 Key 模式不使用原共享服务的全站/IP 额度。账户限额和账单以 DeepSeek 平台为准。替换或清除 Key 会同时清空当前 AI 对话，题库学习记录不受影响。模拟测验中没有 AI 入口。

连接检测兼容缺少 `AbortSignal.timeout()` 的手机浏览器，短暂网络失败时会重试一次。直连仍取决于访客的浏览器是否支持跨域请求，以及其网络能否访问 DeepSeek 官方 API。已用未登录浏览器从 GitHub Pages 验证官方接口的跨域响应，未用用户密钥进行付费测试。离线 HTML 的答题功能照常可用，AI 入口引导打开在线版。

## 记录与备份

每位访客的学习记录保存在自己的浏览器中，不会上传到 GitHub，也不会与其他人共享。换设备、换浏览器、从旧网址迁移或清理浏览器数据之前，请在「数据管理」导出备份，在新浏览器导入。

练习模式需点击「确认答案」才判分。多选题少选、多选均算错。背题不产生新的答题记录。模拟测验每题等值，未答题计零分；关闭浏览器不会重置截止时间，重新打开后会结算已经到期的测验。

## GitHub Pages 发布

发布来源为 **Deploy from a branch**：`gh-pages` 分支的根目录。该分支带有 `.nojekyll`，由 GitHub Pages 自带的发布流程部署，不需要自定义 Actions 工作流。

源码位于 `main` 分支，网页文件位于 `dist/`。修改后，在已登录 GitHub 且安装 Python、Node.js、Git 的电脑上运行：

```sh
python publish-pages.py
```

脚本会检查 JavaScript、将 `dist/` 同步到 `gh-pages` 分支，再由 Pages 自动更新网站。无文件变化时不会创建新提交。`main` 的源码提交可正常使用 `git add`、`git commit`、`git push` 保存。

- 站点：https://esplorare.github.io/peizhen-study/
- 发布进度：https://github.com/ESPLORARE/peizhen-study/actions
- Pages 设置：https://github.com/ESPLORARE/peizhen-study/settings/pages

初次部署时，自定义 Actions 因账号账单限制无法启动，所以使用了上述 Pages 分支发布方式。

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
