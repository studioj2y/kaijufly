# 开场主角：兴奋的张嘴笑

本次仅调整开场飞入画面中的男孩和女孩：将小幅闭嘴微笑改为清楚可辨的张嘴笑，可见牙齿和口腔，情绪更夸张、兴奋。

两张面部源图通过已授权的 OpenAI Image API 制作，模型 `gpt-image-2`、high quality，使用 imagegen CLI 的 edit 模式。完整提示词为 `boy-smile-prompt.txt` 与 `girl-smile-prompt.txt`；源图为 `boy-smile-source.png` 与 `girl-smile-source.png`。

`build.py` 将重绘的嘴部和邻近脸颊局部融合回原来的开场立绘。成品是 `opening-hero-boy.png`、`opening-hero-girl.png`；`smile-preview.jpg` 是脸部放大预览。原有眼睛、帽子/风镜、飞行姿势、衣服和透明轮廓保留，像素核对结果见 `edit-audit.json`。

游戏素材入口已指向本目录，入口脚本版本更新为 `7.1`。角色选择半身像与游戏内动作帧继续使用既有素材。

GitHub 同步节奏：从上一批已同步的 `61c19a3` 起，这是第 1/3 次改动；先保存本地，累计三次后同步。
