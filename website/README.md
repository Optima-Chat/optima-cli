# Optima CLI Website

产品介绍网站，部署于 [cli.optima.shop](https://cli.optima.shop)

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:5173

## 构建

```bash
npm run build
```

输出到 `dist/` 目录

## 部署到 Vercel

### 方法 1：通过 Vercel CLI（推荐）

```bash
# 首次部署
npx vercel

# 生产环境部署
npx vercel --prod
```

### 方法 2：通过 Vercel Dashboard

1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库 `Optima-Chat/optima-cli`
3. 配置：
   - **Root Directory**: `website`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 点击 Deploy

### 配置自定义域名

1. 在 Vercel 项目设置中，进入 "Domains"
2. 添加域名 `cli.optima.shop`
3. 在 DNS 提供商处添加 CNAME 记录：
   ```
   cli.optima.shop -> cname.vercel-dns.com
   ```

## 技术栈

- Vite
- Tailwind CSS
- 纯静态 HTML
