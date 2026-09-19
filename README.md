# My Blog

个人博客静态站点，基于 Lumino 模板（Bootstrap + jQuery）。

## 页面结构

- `index.html` — 首页（Home）：Hero 与关于我
- `blog.html` — 博客（Blog）：文章列表 + 文章详情页（双模式）
- Projects — 导航栏直接跳转 GitHub 主页(https://github.com/vlouboos)

站点为纯静态页面：所有用户均为访客，仅可浏览内容；不提供登录、注册或文章上传功能。

## 如何添加文章

1. **创建文章目录**  
   在 `articles/` 下创建新目录，格式为 `YYYY-MM-DD-slug`，例如：  
   `articles/2026-09-20-learning-frontend/`

2. **复制模板**  
   复制 `templates/article.md` 到新目录，重命名为 `index.md`

3. **编辑 Front Matter**  
   在 `index.md` 顶部填写文章元数据：
   ```yaml
   ---
   title: 文章标题
   date: 2026-09-20
   description: 文章摘要
   cover: cover.webp
   tags:
     - Web
     - 前端
   draft: false
   ---
   ```

4. **编写正文**  
   使用 Markdown 编写文章正文，支持标题、段落、粗体、斜体、链接、图片、引用、列表、代码块、表格等。

5. **更新索引**  
   编辑 `data/articles.json`，添加新文章的元数据：
   ```json
   {
     "id": "2026-09-20-learning-frontend",
     "title": "学习前端开发",
     "date": "2026-09-20",
     "description": "分享前端学习心得",
     "cover": "articles/2026-09-20-learning-frontend/cover.webp",
     "tags": ["Web", "前端"],
     "draft": false
   }
   ```

6. **提交代码**  
   ```bash
   git add .
   git commit -m "新增文章：学习前端开发"
   git push
   ```

7. **发布完成**  
   文章将自动出现在博客列表，可通过 `blog.html?post=2026-09-20-learning-frontend` 访问。

### 注意事项

- `draft: true` 的文章不会在博客列表显示（本地开发环境可预览）
- 图片等资源放在文章目录内，Markdown 中使用相对路径引用
- 文章按日期从新到旧排序
- 无需重启服务器，静态页面自动更新