/**
 * dsh-grill-me-toggle — Client half.
 *
 * 在 `conversation.input.right` 槽位上放一个「追问」开关按钮，和官方/内置的
 * 「识图」按钮（vision-router-mode-toggle，order 40）并排、同一套视觉语言。
 *
 * 点击只改草稿，绝不替用户发送：
 *   开启 → 把 `/grill-me` 钉到草稿最前面（用户在输入框里看得见、可编辑）
 *   关闭 → 把草稿开头的 `/grill-me` 摘掉（保留正文）
 *
 * ⚠ 按钮亮 ⟺ 草稿里真的带着 token，不另存 localStorage：
 * 发送会清空草稿，若另外记一份 on=true，就会在输入框重挂载时「发现开着但没有
 * token」而把 token 补回去，表现为「发完之后过一会按钮又自己亮了」。所以插件
 * 在任何非点击时刻都绝不主动添加 token。
 */
window.__ModuleLoader__.load({
  id: "dsh-grill-me-toggle",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const react = require("react");

    /* 只依赖 slots：按钮改的是草稿（槽位标准 props 的 inputActions），
     * 不调用任何 remote 服务，因此不会替你发送消息。 */
    const inject = ["slots"];

    /* ── 手势 token ────────────────────────────────────────────────
     * grill-me 是 user-invocable 技能：host 扫描「已认领的用户消息」里的
     * 空白边界 token，命中就把该技能的 <skill_content> 注入对应 step。
     * 所以只要 "/grill-me" 出现在用户手动发送的那条消息里就生效。 */
    const GRILL_TOKEN = "/grill-me";
    /** 宽松匹配草稿开头的 token：容忍后面跟空格/换行，或只打了 token。 */
    const GRILL_PREFIX_RE = /^\/grill-me(?:[ \t]+|\r?\n|$)/;

    function draftHasToken(text) {
      return typeof text === "string" && GRILL_PREFIX_RE.test(text);
    }
    /** 删除 token 和它后面由开关插入的一个分隔符，不吞掉正文原有空白。 */
    function grillPrefixLength(text) {
      const match = typeof text === "string" ? text.match(GRILL_PREFIX_RE) : null;
      if (!match) return 0;
      const separator = match[0].slice(GRILL_TOKEN.length);
      return GRILL_TOKEN.length + (separator.startsWith("\r\n") ? 2 : /^[ \t\n\r]/.test(separator) ? 1 : 0);
    }
    /** 幂等：已经带 token 就不再叠加。 */
    function withToken(text) {
      if (draftHasToken(text)) return text;
      return text.length === 0 ? GRILL_TOKEN + " " : GRILL_TOKEN + " " + text;
    }
    /** 摘掉 token，保留用户正文。 */
    function withoutToken(text) {
      return text.replace(GRILL_PREFIX_RE, "");
    }

    /* ── 样式：完全对齐 vision-router-mode-toggle（识图按钮）────────
     * 高 28px 的幽灵胶囊 + 开启态用 ghost-active 系 token；
     * token 都带 fallback，主题里缺哪个也不会变成透明块。 */
    const STYLE_ID = "dsh-grill-me-toggle-style";
    if (typeof document !== "undefined" && document.getElementById(STYLE_ID) === null) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      if (style.dataset) style.dataset.plugin = "dsh-grill-me-toggle";
      style.textContent = [
        ".dgm-toggle{display:inline-flex;align-items:center;gap:4px;min-width:0;height:28px;",
        "padding:0 8px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;",
        "color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;font-weight:500;",
        "line-height:20px;cursor:pointer;white-space:nowrap;transition:background-color .15s,color .15s;}",
        ".dgm-toggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);}",
        ".dgm-toggle:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid ",
        "var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px;}",
        ".dgm-toggle:disabled{cursor:default;opacity:.45;}",
        ".dgm-toggle[data-on='true']{color:var(--dsw-alias-label-primary);",
        "background:var(--dsw-alias-button-ghost-active-fill,color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent));",
        "box-shadow:inset 0 0 0 1px var(--dsw-alias-button-ghost-active-border,color-mix(in srgb,var(--dsw-alias-brand-primary) 40%,transparent));}",
        ".dgm-toggle[data-on='true']:hover:not(:disabled){",
        "background:var(--dsw-alias-button-ghost-active-hover,color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent));}",
        ".dgm-glyph{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:14px;height:14px;}",
        ".dgm-glyph svg{width:14px;height:14px;display:block;}",
        ".dgm-glyph-check{display:none;}",
        ".dgm-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
        ".dgm-error{color:var(--dsw-alias-state-error-primary,#d03050);font-size:11px;margin-left:4px;}",
        /* 窄屏：收起文字（与识图按钮同阈值），开启态也回到问号图标。 */
        "@container (min-width:460.01px){.dgm-toggle[data-on='true'] .dgm-glyph-question{display:none;}",
        ".dgm-toggle[data-on='true'] .dgm-glyph-check{display:inline-flex;}}",
        "@container (max-width:460px){.dgm-label{display:none;}}"
      ].join("");
      document.head.appendChild(style);
    }

    /** 问号图标（未开启态）。 */
    function QuestionIcon() {
      return react.createElement(
        "svg",
        { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true" },
        react.createElement("circle", { cx: "8", cy: "8", r: "6.5", stroke: "currentColor" }),
        react.createElement("path", {
          d: "M6.2 6.3c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8c0 1.4-1.8 1.6-1.8 3",
          stroke: "currentColor",
          strokeLinecap: "round"
        }),
        react.createElement("circle", { cx: "8", cy: "11.6", r: "0.9", fill: "currentColor" })
      );
    }

    /** 勾图标（已开启态），呼应识图按钮「开=打勾」的语义。 */
    function CheckIcon() {
      return react.createElement(
        "svg",
        { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true" },
        react.createElement("path", {
          d: "M3.5 8.4l3 3 6-6.4",
          stroke: "currentColor",
          strokeWidth: "1.6",
          strokeLinecap: "round",
          strokeLinejoin: "round"
        })
      );
    }

    const LABEL = "追问";

    /**
     * 落座到 list 槽位 conversation.input.right，order 20 让它排在
     * 「识图」（vision-router-mode-toggle，order 40）左边。
     * 任何失败就地吞掉：entry failed 等于启动失败，不能把异常抛出 apply。
     */
    function seat(ctx, component) {
      try {
        return ctx.slots.register(
          { name: "conversation.input.right", id: "dsh-grill-me-toggle", order: 20, label: LABEL },
          component
        );
      } catch (error) {
        console.warn("[dsh-grill-me-toggle] 追问按钮落座失败：", error);
        return () => {};
      }
    }

    /** 组件工厂：把 ctx 收进闭包，注册出去的只是组件本身。 */
    function makeButton(ctx) {
      return function GrillMeToggle(props) {
        const sessionId = props.sessionId;
        const [error, setError] = react.useState(null);

        /* 槽位标准 props：草稿和 revision 属于同一个 Session。 */
        const input = typeof props.useInput === "function"
          ? props.useInput((state) => (state || null))
          : null;
        const draft = input && typeof input.draft === "string" ? input.draft : "";
        const draftRev = input && Number.isFinite(input.draftRev) ? input.draftRev : 0;
        const actions = props.inputActions;
        const canEditDraft = actions !== undefined && typeof actions.setDraft === "function";
        const armed = draftHasToken(draft);
        const liveInputRef = react.useRef(null);
        liveInputRef.current = { draft, draftRev, actions };
        const wrapRef = react.useRef(null);
        const pluginRemovalRef = react.useRef(false);

        /* 消费保护：token 从「有」变「无」且草稿被清空 = 已被发送消费；
         * 但插件主动摘 token（按钮/单键删除）不是发送，Undo 后仍应重新点亮。 */
        const consumedRef = react.useRef(false);
        const prevHasRef = react.useRef(armed);
        react.useEffect(() => {
          const prevHas = prevHasRef.current;
          prevHasRef.current = armed;
          if (!sessionId || !canEditDraft) return;
          if (prevHas && !armed) {
            consumedRef.current = draft.length === 0 && !pluginRemovalRef.current;
            pluginRemovalRef.current = false;
            return;
          }
          if (consumedRef.current && armed) {
            actions.setDraft(withoutToken(draft));
          }
        }, [sessionId, draft, armed, canEditDraft]);

        /* Slot 是 per-session，但多个 composer 可同时挂载。把键盘监听绑到
         * 本 InputBar 的 data-composer-card 边界，事件只会到达对应 Session。 */
        react.useEffect(() => {
          const current = liveInputRef.current;
          if (!sessionId || !canEditDraft || !current || !current.actions
            || typeof current.actions.captureInsertion !== "function"
            || typeof current.actions.insertText !== "function") return;
          const wrap = wrapRef.current;
          const card = wrap && typeof wrap.closest === "function"
            ? wrap.closest("[data-composer-card]")
            : null;
          if (!card || typeof card.addEventListener !== "function"
            || typeof card.removeEventListener !== "function") return;

          const onKeyDown = (event) => {
            if (!event || event.defaultPrevented
              || (event.key !== "Backspace" && event.key !== "Delete")
              || event.isComposing || event.keyCode === 229
              || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            const latest = liveInputRef.current;
            if (!latest || !draftHasToken(latest.draft) || !latest.actions
              || typeof latest.actions.captureInsertion !== "function"
              || typeof latest.actions.insertText !== "function") return;
            const target = event.target;
            if (!target || typeof target.closest !== "function") return;
            const editor = target.closest("[data-composer-input]");
            if (!editor || typeof card.contains !== "function" || !card.contains(editor)
              || typeof editor.getAttribute !== "function"
              || editor.getAttribute("contenteditable") !== "true") return;

            const prefixLength = grillPrefixLength(latest.draft);
            if (prefixLength === 0) return;
            let selection;
            try {
              selection = latest.actions.captureInsertion();
            } catch {
              return;
            }
            if (!selection || !Number.isFinite(selection.start) || !Number.isFinite(selection.end)
              || selection.draftRev !== latest.draftRev) return;
            const start = Math.min(selection.start, selection.end);
            const end = Math.max(selection.start, selection.end);
            const touchesPrefix = start === end
              ? (event.key === "Backspace" ? start > 0 && start <= prefixLength : start >= 0 && start < prefixLength)
              : start >= 0 && start < prefixLength && end > 0 && end <= prefixLength;
            if (!touchesPrefix) return;

            pluginRemovalRef.current = true;
            let inserted = false;
            try {
              inserted = latest.actions.insertText("", {
                start: 0,
                end: prefixLength,
                draftRev: selection.draftRev,
              }) === true;
            } catch {
              inserted = false;
            }
            if (!inserted) {
              pluginRemovalRef.current = false;
              return;
            }
            event.preventDefault();
            event.stopPropagation();
          };

          card.addEventListener("keydown", onKeyDown, true);
          return () => { card.removeEventListener("keydown", onKeyDown, true); };
        }, [sessionId, canEditDraft]);

        const locked = props.locked === true;

        const toggle = () => {
          if (locked || !sessionId) return;
          setError(null);
          if (!canEditDraft) {
            setError("输入框不可用");
            return;
          }
          consumedRef.current = false;
          if (armed) pluginRemovalRef.current = true;
          actions.setDraft(armed ? withoutToken(draft) : withToken(draft));
        };

        const title = armed
          ? LABEL + "已开启：发送时会带上 /grill-me；点此关闭，或在指令内按一次 Backspace/Delete 删除"
          : LABEL + "未开启：点此把 /grill-me 放进输入框，手动发送才生效";

        return react.createElement(
          "span",
          { ref: wrapRef, className: "dgm-wrap", style: { display: "inline-flex", alignItems: "center" } },
          react.createElement(
            "button",
            {
              type: "button",
              "data-grill-me-toggle": "true",
              "data-on": armed ? "true" : "false",
              className: "dgm-toggle",
              "aria-pressed": armed,
              "aria-label": title,
              title: error || title,
              disabled: locked || sessionId === undefined || sessionId === null,
              onClick: toggle
            },
            react.createElement(
              "span",
              { className: "dgm-glyph dgm-glyph-question" },
              react.createElement(QuestionIcon)
            ),
            react.createElement(
              "span",
              { className: "dgm-glyph dgm-glyph-check" },
              react.createElement(CheckIcon)
            ),
            react.createElement("span", { className: "dgm-label" }, LABEL)
          ),
          error ? react.createElement("span", { className: "dgm-error", role: "status" }, error) : null
        );
      };
    }

    function apply(ctx) {
      ctx.slots.inject("conversation.input.right", () => seat(ctx, makeButton(ctx)));
    }

    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
