# 📁 视频占位符 / Video Placeholder

此目录用于存放**演示视频**，方便后续在 README 中以相对路径引用。

This directory is a **placeholder for demo videos**, so they can be referenced by relative paths in the README.

---

## 使用方法 / How to use

### 中文

1. 将你的演示视频文件放到本目录下，建议文件名清晰且不含空格，例如：
   - `demo.mp4`
   - `walkthrough.mp4`
2. 在 `README.md` 中按相对路径引用，例如：
   ```markdown
   <video src="assets/video/demo.mp4" controls width="100%"></video>
   ```
3. 为避免大文件进入 Git，建议把视频文件加入 `.gitignore`（已在仓库根目录的 `.gitignore` 中预留说明，见下方）。

### English

1. Drop your demo video into this directory. Recommended filenames (no spaces):
   - `demo.mp4`
   - `walkthrough.mp4`
2. Reference it from `README.md` with a relative path, e.g.:
   ```markdown
   <video src="assets/video/demo.mp4" controls width="100%"></video>
   ```
3. To keep the repo light, consider gitignoring large video files (see `.gitignore` snippet below).

---

## 推荐的 `.gitignore` 片段 / Suggested `.gitignore` snippet

> 添加到仓库根目录的 `.gitignore` 中（按需开启，**注意用 `!` 保留本占位 README**）：

```gitignore
# Demo videos (keep this placeholder)
assets/video/*
!assets/video/README.md
!assets/video/.gitkeep
```

> 若希望视频也随仓库发布，可去掉上面三行；反之若希望完全本地化（不推送到 GitHub），保留即可。

---

## 当前状态 / Current status

- [x] 占位目录已创建
- [x] 演示视频已上传：`诗云介绍.mp4`
- [x] `README.md`（中/英）已嵌入视频引用

- [x] Placeholder directory created
- [x] Demo video uploaded: `诗云介绍.mp4`
- [x] `README.md` (zh / en) updated to embed the video
