# `/grill-me`：DSH 追问开关 + skill

这个仓库在原有 `grill-me` skill 基础上，加入 DSH 输入框旁的「追问」按钮插件。

## 包含内容

- `dsh-grill-me-toggle`：在输入框按钮区增加「追问」开关；开启时把 `/grill-me` 放到草稿开头，关闭时移除它。发送后自动熄灭；在指令内按一次 Backspace/Delete，可整体移除 `/grill-me` 和插件插入的分隔符，正文与引用保留。只修改草稿，不会替你发送。
- `SKILL.md`：`grill-me` skill。`install-skill.ps1` 可把它安装到当前用户的 skills 目录。

## 安装

### 1. 安装 DSH 插件

克隆或下载此仓库，然后在 DSH 打开 **Plugins > Add plugin**，选择这个仓库根目录（该目录含有 `package.json`）。若 DSH 提示需要重启，按提示完全重启。

### 2. 安装 `grill-me` skill

在仓库根目录用 PowerShell 运行：

```powershell
.\install-skill.ps1
```

脚本会把 `SKILL.md` 安装到 `$HOME\.agents\skills\grill-me\SKILL.md`。如果相同版本已安装则不重复复制；若目标位置已有不同内容，会停止而不会覆盖。安装后新开一个 DSH 对话以加载 skill。

## 使用

点输入框旁的「追问」按钮，会在草稿最前方加入 `/grill-me`；再点一次会移除。光标在指令范围内时，按一次 Backspace 或 Delete 就能整体删除指令和开关插入的分隔符，正文与引用保留；其他位置仍按输入框原有行为编辑。确认草稿后仍需由你手动发送。也可以不点按钮，直接在消息开头输入 `/grill-me`。

此插件的槽位和输入框 API 曾在 DSH `0.2.1-rc.3` 上验证；其他版本若有 API 变化，可能需要适配。
