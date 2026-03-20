# UCC 协作层

本项目已接入 UCC（Unified Claude Code Config）共享能力。

## 建议入口

优先使用以下显式命令进入 UCC 流程：

- `/ucc-team-standard`
- `/ucc-team-strict`
- `/ucc-team-research`
- `/ucc-single-standard`
- `/ucc-single-research`
- `/ucc-flow-status`
- `/ucc-flow-continue`
- `/ucc-flow-abort`

## 命中说明

- 如果当前对话已经命中 UCC，输出末尾应包含 `配置标识：UCC`
- 若命令未生效，可在消息中补充 `@ucc`

## 约束

- 这里描述的是 UCC 提供的共享协作能力，不替代项目自身的架构与业务说明
- 项目特定规范应继续写在项目自己的根目录 `CLAUDE.md` 或等效文档中
