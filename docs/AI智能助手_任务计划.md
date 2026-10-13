# 苇渡·智利车队管理平台 — 首页 AI 智能助手任务计划

| 字段 | 值 |
|---|---|
| 文档版本 | v1.1 |
| 创建日期 | 2026-07-17 |
| 状态 | 待评审（Pending Review） |
| 关联需求 | 首页看板接入 dify 工作流，两种形态同时实现 |
| dify 部署方式 | **dify.ai SaaS 在线网站**（非自部署） |
| dify baseUrl | 以 `.env` 中 `VITE_DIFY_BASE_URL` 为准（dify.ai SaaS 公网地址） |
| dify token | 以 `.env` 中 `VITE_DIFY_TOKEN` 为准 |

---

## 0. 文档目的

本文档定义首页 AI 智能助手的完整实现计划，包含：
- **方案1**：首页顶部原生输入框 + 原地展开对话（自研 UI + dify Chat REST API）
- **方案2**：首页右下角悬浮按钮 + 弹窗（dify 官方 embed.min.js）

两种方案**同时实现**，相互独立，共用同一 dify 应用 token。

### v1.1 变更摘要（相对 v1.0）

| 变更项 | v1.0 | v1.1 |
|---|---|---|
| dify 部署方式 | 云服务器自部署 | **dify.ai SaaS 在线网站** |
| dify baseUrl | `http://localhost` / 服务器 IP | dify.ai SaaS 公网地址（HTTPS） |
| Vite proxy | 必需（解决本地 dify CORS） | **不需要**（SaaS 默认 CORS 开放） |
| .env 文件 | .env.development + .env.production + .env.local | **统一放 `.env`**（已被 .gitignore 忽略） |
| 服务器部署任务 | 含 docker compose 部署 | **去除**（SaaS 免部署） |
| CORS 风险 | 高 | 低（SaaS 设计即支持前端直调） |

---

## 1. 需求与决策汇总

### 1.1 原始需求

在首页看板接入 AI 智能助手，通过两种形态同时打通 dify 工作流：
1. 首页上方新增输入框，输入问题后打通 dify
2. 右下角悬浮按钮，点击拉起对话弹窗，在其中打通 dify

dify 提供参考代码为 iframe + `embed.min.js` 嵌入方案。

### 1.2 决策汇总

| 决策点 | 选择 | 说明 |
|---|---|---|
| dify 部署方式 | **dify.ai SaaS 在线网站** | 免自部署，应用在 dify.ai 后台创建并发布 |
| dify 配置管理 | `.env` 环境变量 | baseUrl + token 统一放 `.env`（已被 .gitignore 忽略，安全） |
| 方案1 输入框交互 | 原地展开对话 | 输入框下方流式显示 AI 回复，保留多轮上下文 |
| 方案2 悬浮按钮范围 | 仅首页 `/dashboard` | 离开首页时卸载 dify DOM |
| 业务上下文注入 | 不注入 | 不传租户ID、VIN 等业务变量 |
| user 标识 | 匿名 UUID | dify API 强制必填，用 localStorage 匿名 UUID，不绑定登录身份 |
| 两种方案关系 | 同时实现 | 独立会话，互不影响 |
| Vite proxy | 不需要 | dify.ai SaaS 默认 CORS 开放，前端直调 |

---

## 2. 技术架构

### 2.1 整体结构

```
┌─────────────────────────────────────────────────────┐
│  Dashboard 页面 (/dashboard)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ [方案1] ChatInput 组件                         │  │
│  │  - 输入框 + 发送按钮                            │  │
│  │  - 对话区（流式 markdown 渲染）                 │  │
│  │  - 调 dify.ai /v1/chat-messages (SSE)         │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ 原有看板内容（统计/图表/地图/排行）             │  │
│  └───────────────────────────────────────────────┘  │
│                                          ┌──────┐   │
│                                  [方案2] │ AI 💬│   │
│                                          └──────┘   │
└─────────────────────────────────────────────────────┘
        ↑ AppLayout 末尾按路由条件渲染

外部依赖：
  dify.ai SaaS（HTTPS，CORS 开放）  ← 方案1/方案2 都直调
    └→ DeepSeek LLM API（在 dify.ai 后台配置）
```

### 2.2 技术选型

| 维度 | 方案1 | 方案2 |
|---|---|---|
| UI 来源 | 自研（Antd + react-markdown） | dify 官方 embed |
| 接入方式 | fetch + ReadableStream 调 `/v1/chat-messages` | 注入 `embed.min.js` |
| 会话管理 | 自管 conversation_id（sessionStorage） | dify embed 内部管理 |
| 样式可控性 | 完全可控 | 仅颜色/尺寸可覆盖 |
| 开发量 | 中（API 封装 + 组件） | 小（脚本注入 + cleanup） |
| 网络要求 | 直调 dify.ai SaaS（HTTPS） | 直调 dify.ai SaaS（HTTPS） |

### 2.3 与现有技术栈的关系

- 前端：React 18 + TypeScript + Vite 6 + Antd 5（已具备）
- 状态：组件内 `useState`，无需引入新状态库
- 路由：react-router-dom v6（用 `useLocation` 控制方案2显隐）
- i18n：暂用固定中文文案，后续如需 i18n 再补 key
- **无需修改 `vite.config.ts`**（SaaS 无 CORS 问题，不需要 proxy）

---

## 3. 方案1 详细设计：首页顶部 AI 输入框

### 3.1 UI 设计

```
┌──────────────────────────────────────────────────────┐
│ 🤖 AI 智能助手                            [清空]    │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────┐     │
│ │  问 AI 助手...                        [发送] │     │
│ └──────────────────────────────────────────────┘     │
│                                                      │
│ 对话区（max-height: 400px, 滚动，自动到底部）         │
│ ┌─ 用户 ─────────────────────────────────────┐       │
│ │  查询所有在线车辆的 SOC                     │       │
│ └────────────────────────────────────────────-┘      │
│ ┌─ AI ────────────────────────────────────────┐      │
│ │  当前共有 12 辆在线车辆，SOC 分布如下...      │      │
│ │  | 车牌 | SOC | 状态 |                       │      │
│ │  （流式 markdown 渲染）                      │      │
│ └─────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

**交互细节**：
- 输入框：`Input.TextArea`，自适应 1-3 行
- 回车发送，Shift+Enter 换行
- 发送中：禁用输入框 + 发送按钮显示 loading
- 用户气泡：右对齐，浅蓝背景 `#e6f4ff`
- AI 气泡：左对齐，白底，`react-markdown` + `remark-gfm` 渲染
- 流式中：AI 气泡先显示"思考中…"骨架，token 增量到达后逐字替换
- 错误：AI 气泡显示红色"AI 助手暂时不可用，请稍后重试"
- 清空按钮：重置 conversation_id 和消息列表，清空 sessionStorage

### 3.2 dify Chat API 封装

**接口**：`POST {VITE_DIFY_BASE_URL}/v1/chat-messages`

**请求头**：
```
Authorization: Bearer {VITE_DIFY_TOKEN}
Content-Type: application/json
```

**请求体**：
```json
{
  "query": "用户问题",
  "inputs": {},
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "anon-uuid"
}
```

**响应（SSE 流式）**：
```
data: {"event":"message","answer":"你","conversation_id":"xxx","id":"msg-xxx","created_at":...}\n\n
data: {"event":"message","answer":"好","conversation_id":"xxx","id":"msg-xxx"}\n\n
data: {"event":"message_end","conversation_id":"xxx","id":"msg-xxx","metadata":{...}}\n\n
```

**关键技术点**：
- 不能用 `EventSource`（不支持 POST + 自定义 header）
- 用 `fetch + ReadableStream + TextDecoder` 手动解析 SSE
- 按 `\n\n` 分块，每块提取 `data:` 后的 JSON
- 累积 `answer` 字段得到完整回复
- `message_end` 事件保存最终 `conversation_id` 到 sessionStorage

### 3.3 user 标识处理

> dify Chat API 的 `user` 字段是接口强制必填的技术标识，不是业务上下文注入。

实现：
- 首次访问生成 UUID v4，存 `localStorage` key=`dify_anon_user`
- 后续所有请求都带这个 UUID
- 不绑定平台登录用户身份

### 3.4 会话持久化

| 存储 | key | 内容 | 生命周期 |
|---|---|---|---|
| localStorage | `dify_anon_user` | 匿名 UUID | 永久（直到清浏览器） |
| sessionStorage | `dify_conv_id` | conversation_id | 标签页关闭即重置 |

- 刷新首页 → 上下文保留
- 关闭标签页 → 会话重置，新开对话
- 点"清空" → 立即重置 sessionStorage 和组件 state

### 3.5 接入 Dashboard

修改 `src/pages/Dashboard.tsx`，在"页面标题"之上插入 `<ChatInput />`：

```tsx
return (
  <div>
    <ChatInput />
    <div style={{ marginBottom: 24 }}>
      <Ttl level={4}>...</Ttl>
    </div>
    {/* 原有内容 */}
  </div>
);
```

---

## 4. 方案2 详细设计：右下角悬浮按钮 + 弹窗

### 4.1 实现方式

直接采用 dify 官方 `embed.min.js` 方案，dify 自动创建悬浮按钮和聊天窗。

### 4.2 组件结构

**`src/components/AIAssistant/DifyChatbotBubble.tsx`**

```tsx
const DifyChatbotBubble: React.FC = () => {
  useEffect(() => {
    // 1. 设置全局配置
    window.difyChatbotConfig = {
      token: import.meta.env.VITE_DIFY_TOKEN,
      baseUrl: import.meta.env.VITE_DIFY_BASE_URL,
      inputs: {},
      systemVariables: {},
    };
    // 2. 注入 embed.min.js
    const script = document.createElement('script');
    script.src = `${import.meta.env.VITE_DIFY_BASE_URL}/embed.min.js`;
    script.id = import.meta.env.VITE_DIFY_TOKEN;
    script.defer = true;
    document.body.appendChild(script);
    // 3. 注入样式覆盖
    const style = document.createElement('style');
    style.textContent = `
      #dify-chatbot-bubble-button { background-color: #1C64F2 !important; }
      #dify-chatbot-bubble-window { width: 24rem !important; height: 40rem !important; }
    `;
    document.head.appendChild(style);
    // 4. cleanup
    return () => {
      script.remove();
      style.remove();
      document.getElementById('dify-chatbot-bubble-button')?.remove();
      document.getElementById('dify-chatbot-bubble-window')?.remove();
      delete window.difyChatbotConfig;
    };
  }, []);
  return null;
};
```

### 4.3 路由控制（仅首页显示）

修改 `src/components/Layout/AppLayout.tsx`，在 Layout 末尾按路由条件渲染：

```tsx
import { useLocation } from 'react-router-dom';
import DifyChatbotBubble from '@/components/AIAssistant/DifyChatbotBubble';

// Layout 末尾
{location.pathname === '/dashboard' && <DifyChatbotBubble />}
```

离开 `/dashboard` 时组件卸载，触发 cleanup，dify 的 DOM 和 script 被清理。

### 4.4 样式

按 dify 参考代码：
- 悬浮按钮背景色：`#1C64F2`
- 弹窗尺寸：`24rem × 40rem`
- 其余 UI（按钮形状、弹窗动画、聊天界面）由 dify embed 自带

---

## 5. 配置层

### 5.1 环境变量文件

**`.env`**（新建，已被 `.gitignore` 忽略，不会提交）

```ini
VITE_DIFY_BASE_URL=https://cloud.dify.ai
VITE_DIFY_TOKEN=你的dify应用token
```

> **说明**：
> - `.env` 已在项目 `.gitignore` 中（第 9 行），安全，不会进 git 仓库
> - Vite 对 `.env` 的加载规则：所有模式（dev/build）都会加载，dev 和生产用同一份配置
> - dify.ai SaaS 的 baseUrl 在 dev 和生产环境一致（都是 dify.ai 公网地址），所以单文件即可
> - 如果后续需要 dev/prod 用不同 dify 应用（如测试应用 vs 生产应用），再拆 `.env.development` / `.env.production`

**baseUrl 取值**：从 dify.ai 后台应用的"嵌入"代码中复制，形如：
```
window.difyChatbotConfig = {
  baseUrl: 'https://cloud.dify.ai',  ← 这个就是 VITE_DIFY_BASE_URL
  token: 'xxxxxxxxxxxx',             ← 这个就是 VITE_DIFY_TOKEN
}
```

### 5.2 CORS 说明（无需 Vite proxy）

dify.ai SaaS 是公网 HTTPS 服务，其 API 默认配置了宽松的 CORS（允许任意 Origin 调用），因为 dify 的 embed 方案本就是设计给前端直接调用的。

- **方案1**：`fetch` 直调 `{VITE_DIFY_BASE_URL}/v1/chat-messages`，浏览器同源策略不拦截
- **方案2**：`<script src="{VITE_DIFY_BASE_URL}/embed.min.js">` 跨域加载，浏览器允许
- **结论**：`vite.config.ts` 无需修改，不配 proxy

> 如果实测遇到 CORS 报错（理论上不应该），兜底方案：加 Vite proxy `/dify-api` 转发到 dify.ai。但这属于异常处理，不在主计划中。

### 5.3 类型声明

扩展 `src/vite-env.d.ts`：

```typescript
interface ImportMetaEnv {
  readonly VITE_DIFY_BASE_URL: string;
  readonly VITE_DIFY_TOKEN: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

新建 `src/types/global.d.ts`：

```typescript
interface Window {
  difyChatbotConfig?: {
    token: string;
    baseUrl: string;
    inputs?: Record<string, any>;
    systemVariables?: Record<string, any>;
    userVariables?: Record<string, any>;
  };
}
```

---

## 6. 文件清单

### 6.1 新增文件（6 个）

| 文件路径 | 说明 | 提交状态 |
|---|---|---|
| `.env` | dify baseUrl + token（用户已配置） | 不提交（.gitignore 已忽略） |
| `src/types/global.d.ts` | Window.difyChatbotConfig 类型 | 提交 |
| `src/api/dify.ts` | dify Chat API 流式封装 | 提交 |
| `src/components/AIAssistant/ChatInput.tsx` | 方案1：首页顶部输入框 + 对话区 | 提交 |
| `src/components/AIAssistant/DifyChatbotBubble.tsx` | 方案2：dify embed 悬浮按钮 | 提交 |
| `src/components/AIAssistant/index.ts` | 统一导出 | 提交 |
| `src/components/AIAssistant/MessageBubble.tsx` | 消息气泡子组件（用户/AI 区分） | 提交 |

### 6.2 修改文件（3 个）

| 文件路径 | 改动 |
|---|---|
| `src/vite-env.d.ts` | 加 `VITE_DIFY_*` 环境变量类型 |
| `src/pages/Dashboard.tsx` | 顶部插入 `<ChatInput />` |
| `src/components/Layout/AppLayout.tsx` | 路由判断后渲染 `<DifyChatbotBubble />` |

> **注意**：`vite.config.ts` 不再修改（v1.0 中的 proxy 配置已移除）。

### 6.3 依赖新增（2 个）

| 包 | 版本 | 用途 | 分类 |
|---|---|---|---|
| `react-markdown` | `^9.0.0` | 渲染 AI 流式回复的 markdown | dependencies |
| `remark-gfm` | `^4.0.0` | 支持 GFM（表格、删除线、任务列表） | dependencies |

---

## 7. 任务分解（WBS）

### T1 — 配置层搭建
- **描述**：建立环境变量、类型声明
- **输入**：用户已配置的 `.env`（含 baseUrl + token）
- **输出**：`src/types/global.d.ts`、修改 `src/vite-env.d.ts`
- **验收**：
  - `import.meta.env.VITE_DIFY_BASE_URL` 和 `VITE_DIFY_TOKEN` 在 dev 启动后可读
  - TS 无类型报错
  - `.env` 不在 git 跟踪中（`git status` 确认）
- **依赖**：无（用户已完成 .env 配置）
- **预估**：0.5h

### T2 — 依赖安装
- **描述**：安装 react-markdown 和 remark-gfm
- **输入**：无
- **输出**：修改 `package.json`、`package-lock.json`
- **验收**：`npm install` 成功，无版本冲突
- **依赖**：无
- **预估**：0.2h

### T3 — 方案2：dify embed 悬浮按钮
- **描述**：实现 `DifyChatbotBubble` 组件并接入 AppLayout
- **输入**：T1 完成
- **输出**：`src/components/AIAssistant/DifyChatbotBubble.tsx`、`src/components/AIAssistant/index.ts`、修改 `src/components/Layout/AppLayout.tsx`
- **验收**：
  - 首页右下角出现蓝色（#1C64F2）悬浮按钮
  - 点击弹出 24rem×40rem 聊天窗
  - 离开 `/dashboard` 悬浮按钮消失，DOM 无残留
  - 切回 `/dashboard` 悬浮按钮重现，无重复注入
  - 浏览器控制台无 CORS 报错
- **依赖**：T1
- **预估**：1h

### T4 — 方案1：dify Chat API 封装
- **描述**：实现流式 SSE 调用封装
- **输入**：T1 完成
- **输出**：`src/api/dify.ts`
- **验收**：
  - 导出 `streamChat(query, conversationId, signal)` async generator
  - 正确解析 `message` / `message_end` / `error` 事件
  - 支持 AbortSignal 中断
  - localStorage 匿名 UUID 生成与读取
- **依赖**：T1
- **预估**：1.5h

### T5 — 方案1：ChatInput 组件
- **描述**：实现首页顶部输入框 + 对话区 UI
- **输入**：T2、T4 完成
- **输出**：`src/components/AIAssistant/ChatInput.tsx`、`src/components/AIAssistant/MessageBubble.tsx`
- **验收**：
  - 输入框回车发送，Shift+Enter 换行
  - 流式 markdown 正确渲染（表格、列表、代码块）
  - 用户/AI 气泡左右对齐
  - 会话 ID 持久化到 sessionStorage，刷新保留上下文
  - 清空按钮重置会话
  - 错误降级提示
  - 对话区自动滚动到底部
  - 路由切换/清空时 AbortController 中断进行中的请求
- **依赖**：T2、T4
- **预估**：3h

### T6 — Dashboard 集成
- **描述**：把 ChatInput 接入 Dashboard
- **输入**：T5 完成
- **输出**：修改 `src/pages/Dashboard.tsx`
- **验收**：
  - 首页顶部出现 ChatInput，不影响原有看板布局
  - 构建无 TS 报错
- **依赖**：T5
- **预估**：0.3h

### T7 — 联调与验证
- **描述**：dev 启动，按验证标准逐项验证
- **输入**：T3、T6 完成
- **输出**：验证记录（截图）
- **验收**：见第 9 节验证标准全部通过
- **依赖**：T3、T6
- **预估**：1h

**总预估**：约 7.5h

### 任务依赖图

```
T1 ──┬──> T3 ──────────────────┐
     │                          │
     └──> T4 ──┐                │
               │                │
T2 ────────────┴──> T5 ──> T6 ─┴──> T7
```

---

## 8. 风险与对策

| # | 风险 | 等级 | 对策 |
|---|---|---|---|
| R1 | **dify.ai SaaS CORS 限制**：方案1 fetch 调用被拦截 | 低 | dify.ai SaaS 默认 CORS 开放（embed 设计即支持前端直调）；若异常，兜底加 Vite proxy |
| R2 | **token 暴露**：dify app token 在前端可见 | 低 | dify embed 设计如此，token 是 app 级公开 token；`.env` 已被 .gitignore 忽略，不进仓库；dify.ai 后台可配"网页应用访问限制"（域名白名单） |
| R3 | **SSE 解析复杂**：fetch 流式解析边界处理 | 中 | 封装成 async generator，按 `\n\n` 分块，缓冲不完整 chunk |
| R4 | **路由切换重复注入**：方案2 切换页面残留 dify DOM | 中 | useEffect cleanup 严格清理 script + DOM + window.difyChatbotConfig |
| R5 | **markdown XSS**：AI 回复含恶意 HTML | 低 | react-markdown 默认不渲染原始 HTML；不引入 rehype-raw |
| R6 | **dify.ai SaaS 不可用**：网络问题或服务故障 | 中 | API 调用 try-catch，UI 显示降级提示，不影响看板其他功能 |
| R7 | **会话膨胀**：方案1 对话过长 | 低 | 对话区 max-height 400px 滚动；清空按钮一键重置 |
| R8 | **dify.ai SaaS 免费额度限制**：免费账号有调用次数/Token 限制 | 中 | 监控用量；如超限升级付费套餐或迁移自部署 |
| R9 | **dify 工作流未配置或未发布**：token 对应的应用未发布 | 中 | 实现前在 dify.ai 后台确认应用已发布且工作流可用 |
| R10 | **方案2 embed 异步加载延迟**：dify DOM 创建晚于 cleanup | 低 | cleanup 用 `?.remove()` 处理 null 情况；如遇残留加 MutationObserver 兜底 |

---

## 9. 验证标准

### 9.1 功能验证

| # | 验证项 | 通过标准 |
|---|---|---|
| V1 | 首页顶部 AI 输入框 | 输入问题回车后，下方流式显示 AI 回复，markdown 正确渲染 |
| V2 | 首页右下角悬浮按钮 | 蓝色（#1C64F2）按钮可见，点击弹出 24rem×40rem 聊天窗 |
| V3 | 方案1 会话持久化 | 刷新首页后，对话上下文保留 |
| V4 | 方案1 清空会话 | 点"清空"按钮，消息列表和 conversation_id 重置 |
| V5 | 方案2 路由控制 | 离开 `/dashboard`，悬浮按钮消失，DOM 无残留；切回重现 |
| V6 | 方案2 无重复注入 | 反复进出 `/dashboard`，不出现多个悬浮按钮 |
| V7 | CORS 无报错 | dev 启动后浏览器控制台无 CORS 错误 |
| V8 | 网络降级 | 断网或 dify.ai 不可用时，看板其他功能正常，AI 区域显示降级提示 |
| V9 | 构建通过 | `npm run build` 无 TS 报错 |
| V10 | .env 未提交 | `git status` 中 `.env` 不在跟踪列表 |

### 9.2 验证方式

- V1-V6：手动浏览器验证 + 截图
- V7：浏览器控制台
- V8：断网后访问首页
- V9：`npm run build`
- V10：`git status`

---

## 10. 实现顺序与里程碑

| 里程碑 | 包含任务 | 产出 |
|---|---|---|
| M1：配置就绪 | T1 + T2 | 环境变量、类型、依赖可用 |
| M2：方案2 可用 | T1 + T3 | 首页悬浮按钮 + 弹窗打通 dify.ai |
| M3：方案1 API 可用 | T1 + T4 | dify Chat API 流式封装可调通 |
| M4：方案1 UI 可用 | T2 + T4 + T5 + T6 | 首页输入框 + 对话区完整 |
| M5：联调通过 | T3 + T6 + T7 | 所有验证项通过 |

---

## 11. Review 检查清单

实现完成后，按以下清单逐项检查：

- [ ] 环境变量未硬编码，全部走 `import.meta.env`
- [ ] `.env` 不在 git 跟踪中（`git status` 确认）
- [ ] 方案1 SSE 解析正确处理不完整 chunk（边界缓冲）
- [ ] 方案1 支持 AbortController 中断（切换页面/清空时取消请求）
- [ ] 方案2 cleanup 彻底（script、style、dify DOM、window.difyChatbotConfig 全部清理）
- [ ] 方案2 反复进出首页无重复注入
- [ ] 方案1 markdown 不渲染原始 HTML（无 rehype-raw）
- [ ] 错误降级 UI 不阻塞看板其他功能
- [ ] 对话区滚动行为正确（新消息自动到底部）
- [ ] 移动端响应式（xs 断点下输入框和对话区可用）
- [ ] TS 严格模式无报错
- [ ] `npm run build` 通过
- [ ] dify.ai 应用已发布且可用（实现前确认）
- [ ] react-markdown / remark-gfm 放在 dependencies 而非 devDependencies

---

## 12. 待确认事项

| # | 事项 | 状态 | 备注 |
|---|---|---|---|
| Q1 | dify.ai SaaS 的实际 baseUrl | 待用户确认 | 从 dify.ai 后台嵌入代码复制，填入 `.env` 的 `VITE_DIFY_BASE_URL` |
| Q2 | dify.ai 应用的实际 token | 待用户确认 | 从 dify.ai 后台嵌入代码复制，填入 `.env` 的 `VITE_DIFY_TOKEN` |
| Q3 | dify.ai 应用是否已发布 | 待确认 | 实现前在 dify.ai 后台确认应用状态为"已发布" |
| Q4 | dify.ai 后台是否已接入 DeepSeek LLM | 待确认 | 在 dify.ai 设置 → 模型供应商中配置 DeepSeek API key |
| Q5 | dify.ai 账号套餐 | 待确认 | 免费套餐有调用限制，如超限需升级 |

---

## 13. 变更记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-07-17 | 初版创建（云服务器自部署方案） | AI Assistant |
| v1.1 | 2026-07-17 | 改为 dify.ai SaaS 方案：去掉服务器部署、Vite proxy；.env 统一管理；调整风险和任务分解 | AI Assistant |
