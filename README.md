# My Blog

这是一个基于静态文件、Markdown 和 Cloudflare Pages 的个人博客。网站不提供登录、注册、上传、数据库或后台管理功能；GitHub Pull Request 是唯一的投稿和审核入口。

## 项目结构

```text
articles/                 Markdown 文章及文章资源
  YYYY-MM-DD-slug/
    index.md              文章正文和 Front Matter
data/articles.json        构建时自动生成的文章索引
scripts/build-blog.js     扫描文章并生成索引
blog.html                 文章列表和文章详情页
index.html                首页
js/                       前端脚本、Markdown 解析器和内容清理库
css/                      页面样式
img/                      网站图片资源
font-awesome-4.5.0/       Font Awesome 静态资源
```

`data/articles.json` 只保存索引元数据，不保存文章正文，也不应手动编辑。

## 文章格式

每篇文章必须位于一个 `YYYY-MM-DD-slug` 目录中，并包含 `index.md`：

```yaml
---
title: 文章标题
author: 作者名称
date: 2026-09-19
description: 文章摘要
cover:
tags:
  - Tag
draft: false
---

# 文章标题

这里是 Markdown 正文。
```

`title`、`author` 和 `date` 是必填字段；`description`、`cover` 和 `tags` 是可选字段；`draft` 可选，默认值为 `false`。缺少必填字段或字段格式错误时，构建会失败。文章目录中的图片等资源可用相对路径引用，例如 `![截图](image.webp)`。

## 投稿与审核

所有文章投稿均通过 GitHub Pull Request 完成：

1. Fork 本仓库。
2. 创建 `articles/YYYY-MM-DD-slug/`。
3. 创建 `index.md` 并填写 Front Matter。
4. 使用 Markdown 编写文章。
5. 添加文章需要的图片等资源。
6. Commit。
7. 创建 Pull Request。
8. 等待维护者审核。

```text
Pull Request = 投稿 / 审核
Merge PR     = 通过审核并发布
Close PR     = 拒绝投稿
```

投稿者不应手动修改 `data/articles.json`，也不应创建文章 HTML。Markdown 是文章唯一来源。

## 发布流程

```text
Markdown
    ↓
scripts/build-blog.js
    ↓
data/articles.json
    ↓
Cloudflare Pages
```

合并到主分支后，Cloudflare Pages 执行 `npm run build`，生成索引并部署静态文件。访问 `blog.html` 查看文章列表，访问 `blog.html?post=文章目录名` 查看文章详情。普通访客看不到 `draft: true` 的文章。

## 本地构建

项目的 `package.json` 只定义了现有构建命令：

```bash
npm run build
```

该命令扫描 `articles/**/index.md`、校验 Front Matter 并生成 `data/articles.json`。项目没有后端运行时或独立开发服务器。
