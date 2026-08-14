# DSH Arknights Amiya Skin

给 **DeepSeek Harness Web UI** 使用的“罗德岛 / PRTS / 阿米娅”主题皮肤。

这版按实际编码场景设计：左侧放 VS Code，右侧放 DSH。阿米娅不是独立右栏，而是作为半透明主视觉从右侧直接进入聊天区域；聊天正文、代码块和输入框使用更高不透明度，保证长时间阅读与调试时的可读性。

## 效果与特征

- 罗德岛工业终端 + PRTS HUD。
- 暗色主界面、暖灰信息面板、Rhodes Island 黄和 PRTS 青。
- 顶部 `RHODES ISLAND // PRTS TERMINAL`，底部 PRTS 状态栏。
- 使用仓库内嵌的阿米娅 WebP 主视觉，无运行时图片请求、无本地绝对路径。
- 人物层轻度去饱和，并从右向左渐隐，直接进入聊天主区域。
- **重点优化 720–1199 px 的右侧工作窗口**；`560–719 px` 继续弱化，`<560 px` 自动隐藏人物。
- 纯呈现层：不注入服务、不发送 Cordis 事件、不修改模型请求或 DSH 业务状态。

## 预览

仓库已包含 Skin Center 卡片预览：

- `preview/light.png`
- `preview/dark.png`

交互式本地预览：

```sh
node scripts/build-fallback.mjs
```

然后打开：

```text
preview/demo.html?theme=dark
preview/demo.html?theme=light
```

## 独立构建

当前仓库的 `tsdown.config.ts` 是**自包含构建配置**，因此既可以单独构建，也可以放进 `dsh-web-ui/packages/skins/arknights-amiya/` 后构建。

```sh
corepack enable
pnpm install
pnpm test
pnpm build
```

没有 pnpm 依赖时，也可以用 Node.js 22+ 做离线检查：

```sh
node scripts/verify-static.mjs
node scripts/build-fallback.mjs
```

fallback builder 会生成可用于本地预览和结构验证的：

```text
lib/index.js
lib/client.js
```

正式合入 `dsh-web-ui` 时，建议用 `pnpm build` 重新生成正式 bundle。

## 接入 DSH Skin Center

推荐把本仓库内容放到你的 `dsh-web-ui` 克隆中：

```text
dsh-web-ui/
└── packages/
    └── skins/
        └── arknights-amiya/
            ├── package.json
            ├── skin.json
            ├── cordis.patch.yml
            ├── src/
            ├── tests/
            └── preview/
```

然后在 `dsh-web-ui` 根目录执行：

```sh
pnpm install
pnpm --filter @cbh0920/dsh-client-ui-skin-arknights-amiya test
pnpm --filter @cbh0920/dsh-client-ui-skin-arknights-amiya build
node scripts/skin-center-bundles
pnpm --filter @linxin666/dsh-client-ui-skin-center build
node scripts/gallery-build
node scripts/capture-previews arknights-amiya
```

`skin.json` 已包含 Skin Center 所需的：

- `id`
- `name / nameEn`
- `accent`
- `bodyAttr`
- `package`
- `wiring`
- `preview`

重新生成 registry 后，`罗德岛 · 阿米娅` 就会出现在 Skin Center 的皮肤列表中。

如果上游要求统一 npm scope，只需同步修改：

1. `package.json -> name`
2. `skin.json -> package`
3. `cordis.patch.yml -> name`

## 插件接线

当前插件 ID：

```text
ui-skin-arknights-amiya
```

package：

```text
@cbh0920/dsh-client-ui-skin-arknights-amiya
```

`cordis.patch.yml` 已配置：

```yaml
- insert:
    - id: ui-skin-arknights-amiya
      name: '@cbh0920/dsh-client-ui-skin-arknights-amiya'
```

同时启用其它 skin 时，应通过 Skin Center / `dsh-skin` 保持皮肤互斥，避免两套主题同时生效。

## 验证

```sh
node scripts/verify-static.mjs
```

离线验证覆盖：

- apply/dispose 生命周期；
- body scope、标题、favicon、MutationObserver 清理；
- CSS token、聊天区、输入区和代码块；
- 1200+、720–1199、560–719、<560 四档响应式；
- 阿米娅图片确实为内嵌 WebP；
- fallback DSH bundle 结构与 JS 语法；
- runtime 不存在官网图片热链。

## 素材说明

本仓库中的阿米娅图片由仓库创建者提供，用于个人主题皮肤。`LICENSE` 仅覆盖本项目代码；角色名称、角色形象及相关美术素材的权利归其各自权利人所有，本项目与鹰角网络不存在官方隶属或背书关系。
