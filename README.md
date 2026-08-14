# DSH Arknights Amiya Skin

给 **DeepSeek Harness Web UI** 使用的“罗德岛 / PRTS / 阿米娅”主题皮肤。

这版按实际编码场景设计：左侧放 VS Code，右侧放 DSH。阿米娅不是独立右栏，而是作为半透明主视觉从右侧直接进入聊天区域；聊天正文、代码块和输入框使用更高不透明度，保证长时间阅读与调试时的可读性。

## 效果与特征

- 罗德岛工业终端 + PRTS HUD。
- 暗色主界面、暖灰资料面板、Rhodes Island 黄和 PRTS 青。
- 顶部 `RHODES ISLAND // PRTS TERMINAL`，底部 PRTS 状态栏。
- 使用仓库内嵌的阿米娅 WebP 主视觉，无运行时图片请求、无本地绝对路径。
- 人物层轻度去饱和并从右向左渐隐，直接进入聊天主区域。
- **重点优化 720–1199 px 的右侧工作窗口**；`560–719 px` 继续弱化，`<560 px` 自动隐藏人物。
- 纯呈现层：不注入服务、不发送 Cordis 事件、不修改模型请求或 DSH 业务状态。

## 预览

仓库包含 Skin Center 可使用的预览图：

- `preview/light.png`
- `preview/dark.png`

本地还可以用：

```sh
node scripts/build-fallback.mjs
```

然后打开：

```text
preview/demo.html?theme=dark
preview/demo.html?theme=light
```

## 本仓库的使用方式

**推荐方式是合入 `dsh-web-ui` 的 `packages/skins/arknights-amiya/` 后，由 Skin Center 统一管理。** 本仓库保留了上游标准 `tsdown.config.ts`，其中共享构建预设的相对路径也是按这个目录位置设计的。

如果只想先在本仓库本地试用/预览，不需要 pnpm：

```sh
node scripts/build-fallback.mjs
node scripts/verify-static.mjs
```

这会生成可加载的 `lib/index.js` 与 `lib/client.js`。之后可以用 DSH 的本地 link 方式做开发调试；正式放进 Skin Center 时，仍建议回到 `dsh-web-ui` 根目录用官方 tsdown 工具链重新构建。

`cordis.patch.yml` 会插入：

```yaml
- insert:
    - id: ui-skin-arknights-amiya
      name: '@cbh0920/dsh-client-ui-skin-arknights-amiya'
```

如果同时启用了其它 skin，建议先停用其它皮肤，避免两套 body/theme surface 同时生效。

## 合并进 `dsh-web-ui` 的 Skin Center

这份仓库本身已经是一个完整 skin package。合入 `zhu1090093659/dsh-web-ui` 时，把本仓库内容放到：

```text
packages/skins/arknights-amiya/
```

然后在 `dsh-web-ui` 根目录执行：

```sh
pnpm install
pnpm --filter @cbh0920/dsh-client-ui-skin-arknights-amiya test
pnpm --filter @cbh0920/dsh-client-ui-skin-arknights-amiya build
node scripts/skin-center-bundles
pnpm --filter @linxin666/dsh-client-ui-skin-center build
node scripts/gallery-build
node scripts/capture-previews
```

`skin.json` 已包含 Skin Center 需要的 `id / name / accent / bodyAttr / package / wiring / preview` 信息，所以重新生成 registry 后它就能进入皮肤管理列表。

如果上游维护者要求统一 npm scope，只需要同步修改以下三处 package 名称：

1. `package.json -> name`
2. `skin.json -> package`
3. `cordis.patch.yml -> name`

## 零依赖验证

当前仓库额外提供 Node.js 22+ 的离线验证，用于没有 pnpm 依赖的环境：

```sh
node scripts/verify-static.mjs
```

它检查：

- apply/dispose 生命周期；
- body scope、标题、favicon、MutationObserver 清理；
- CSS token、聊天/输入/代码块覆盖；
- 四档响应式规则；
- 阿米娅立绘确实内嵌为 WebP data URL；
- fallback DSH bundle 能生成且 `node --check` 通过；
- runtime 不存在官网图片热链。

`node scripts/build-fallback.mjs` 生成的 bundle 仅用于离线预览和结构检查。准备合入 `dsh-web-ui` 时应使用官方 `pnpm build` 重新生成 `lib/`。

## 目录

```text
.
├── package.json
├── cordis.patch.yml
├── skin.json
├── src/
│   ├── index.ts
│   └── client/
│       ├── index.ts
│       ├── lifecycle.ts
│       ├── arknights-amiya.module.css
│       └── amiya-art.ts
├── scripts/
│   ├── build-fallback.mjs
│   └── verify-static.mjs
├── tests/
├── preview/
│   ├── light.png
│   ├── dark.png
│   └── demo.html
└── LICENSE
```

## 素材说明

本仓库中的阿米娅图片由仓库创建者提供，用于个人主题皮肤。`LICENSE` 仅覆盖本项目代码；角色名称、角色形象及相关美术素材的权利归其各自权利人所有，本项目与鹰角网络不存在官方隶属或背书关系。
