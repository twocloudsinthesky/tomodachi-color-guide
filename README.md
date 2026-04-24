# 人森拼豆色盘对照表

一个用于查看拼豆 221 色在《朋友收集》游戏自订色盘中近似位置的静态网页。

目标 GitHub Pages 地址：

```text
https://twocloudsinthesky.github.io/tomodachi-color-guide/
```

## 内容

- 按 A/B/C/D/E/F/G/H/M 分组浏览 221 个拼豆色号
- 搜索色号、HEX、RGB
- 查看每个色号的游戏色盘定位图
- 查看底部色相条位置与上方色盘 X/Y 百分比

## 参考

色盘定位逻辑参考 ColorCraftLab：

```text
https://heheann.github.io/colorcraftlab/
```

## 部署到 GitHub Pages

1. 在 GitHub 创建公开仓库：`tomodachi-color-guide`
2. 把本文件夹内所有文件上传到仓库根目录
3. 进入仓库 `Settings` -> `Pages`
4. `Build and deployment` 选择 `Deploy from a branch`
5. Branch 选择 `main`，目录选择 `/root`
6. 保存后等待部署完成

## 本地预览

由于页面使用 `fetch` 读取 CSV，不建议直接双击打开 `index.html`。可以在本目录运行：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```
