# Magic English

## 运行

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm lint
pnpm build
```

- `pnpm build` 输出静态文件到 `out/`
- GitHub Actions 自动部署到 GitHub Pages

## 内容维护

1. 在 `data/lessons/` 新增或修改课程 JSON
2. 在 `data/lessons.json` 更新课程列表
3. 提交并推送代码触发部署
