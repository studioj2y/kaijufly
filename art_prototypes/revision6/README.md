# 第六轮：浮空开场、人间大炮与怪兽互动

本轮源图使用已获授权的 OpenAI Image API，模型 `gpt-image-2`、high quality，通过内置 imagegen CLI 的 edit 模式生成。共 5 张源图，逐张参考旧素材或造型照片，抠图后导出为透明 PNG。生成提示词完整保存在本目录的五个 `*-prompt.txt` 中。

| 资产 | 源图 / 提示词 | 游戏成品 |
| --- | --- | --- |
| 人间大炮 | cannon-source.png / cannon-prompt.txt | human-cannon.png |
| 加美拉水平旋转 | gamera-source.png / gamera-prompt.txt | gamera-frame-0…6.png |
| 安吉拉斯向右慢走 | anguirus-source.png / anguirus-prompt.txt | anguirus-frame-0…6.png |
| 八组片场杂物 | decor-source.png / decor-prompt.txt | decor-0…7.png |
| 放大留白题字底板 | title-source.png / title-prompt.txt | title-plate-0…1.png |

`build.py` 负责抠图、定位脚底/龟壳中心、清除透明像素中的残色，并输出 `alpha-audit.json`。加美拉直接使用水平姿态的七张绘画帧，不再旋转整张图片；安吉拉斯七帧固定朝右。二者均以 7 fps 播放。`animation-preview.gif` 是处理后的素材预览。

人间大炮采用 Faitas I 抬升车身、露出黄色矩形射出口的造型；目前参考的是原作机械玩具的展开照片，后续可按用户提供的剧照继续校正。参考页：[TOMY Faitas I / II 展开结构](https://omochagura.sakura.ne.jp/takatomi/koseidon/koseidon1.html)。参考照片只用于制作，未随仓库提交。

四幕背景从第五轮原始画稿重新提取，没有左右镜像。运行时使用有固定种子的取景变化、轻微比例变化、羽化接缝和不同速度的三层滚动；缓存最多 72 个片段。地面纹理与八组独立绘制的道具分别排列，八件一组打乱顺序，相邻不重复，取消原来的三幅整条场景循环。

开场仍为场景 → 人物飞入 → 怪兽飞入 → 菜单。人物到位后持续约 5.5 秒一个周期、最大 9 像素的上下浮动。桌面和手机标题均在底板留白内，音效按钮避开底板。

吉拉斯碰撞后主角在 1.8 秒内绕旋风两圈，前后半圈有大小、转身与遮挡变化，随后从当前轨迹位置向右上抛出，不瞬移、不重复触发。安吉拉斯约占收场道具的 30%，以 2 m/s 向右慢走，遇到其他道具时停步保持间距。碰撞使用相对运动扫掠，男女均为完整服装的骑行结局；旧结局裁切残留也已清除。

发射依次显示“人间大炮一级准备”→ 点击 →“人间大炮二级准备”→ 点击 →“发射！”。发射位置与画中的矩形出口对齐，垂直初速度补偿出口抬高带来的高度，维持前期飞行难度。

验证包括 `interaction-check.js` 的两圈轨迹、不同步长、连续出圈、移动间距和移动碰撞；`revision6-check.cjs` 的真实点击、桌面/手机浮动、标题避让和发射文字；以及场景分布、成长系统、开场、动画抓握和完整游玩的既有回归检查。
