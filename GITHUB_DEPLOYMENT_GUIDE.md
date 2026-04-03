# 🚀 GitHub 部署和托管指南

本指南说明如何将 PUPY 项目上传到 GitHub 并配置持续部署。

## 📝 准备工作

### 1. 创建 GitHub 账户
- 访问 [github.com](https://github.com)
- 注册账户并验证邮箱

### 2. 安装 Git
- Windows: [git-scm.com](https://git-scm.com)
- macOS: `brew install git`
- Linux: `sudo apt-get install git`

### 3. 配置 Git
```bash
git config --global user.name "rhyssvv"
git config --global user.email "rhyssvv@gmail.com"
```

## 🔑 创建 GitHub 仓库

### 步骤 1: 创建新仓库

1. 登录 GitHub
2. 点击右上角的 `+` 图标
3. 选择 "New repository"
4. 填写以下信息：
   - Repository name: `pupy` 或 `PUPY-爪住`
   - Description: "Pet Social Platform | 宠物社交平台"
   - Public (公开仓库)
   - 勾选 "Add a README file"
   - 选择 "MIT" 许可证
5. 点击 "Create repository"

### 步骤 2: 获取仓库 URL

复制页面上的 HTTPS URL，例如：
```
https://github.com/yourusername/pupy.git
```

## 💻 本地 Git 初始化

### 在项目根目录执行

```bash
# 进入项目目录
cd PUPY-爪住

# 初始化 git 仓库
git init

# 添加远程仓库
git remote add origin https://github.com/yourusername/pupy.git

# 添加所有文件到暂存区
git add .

# 创建首次提交
git commit -m "Initial commit: PUPY 完整项目

- 前端: React 19 + Vite + Tailwind CSS
- 后端: Express.js + TypeScript + Supabase
- 数据库: PostgreSQL (Supabase)
- 功能: 用户认证、宠物管理、消息、日记、市集、配种、AI 祈祷
- 40+ API 端点
- 数据库 13 张表"

# 推送到 GitHub (需要输入凭证或使用 SSH)
git branch -M main
git push -u origin main
```

## 🔐 GitHub 认证

### 方式 1: HTTPS (个人访问令牌)

1. GitHub Settings → Developer settings → Personal access tokens
2. 生成新 token (勾选 repo, gist 权限)
3. 复制 token
4. 推送时提示输入：
   - Username: 你的 GitHub 用户名
   - Password: 粘贴 token

### 方式 2: SSH (推荐)

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your-email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# GitHub Settings → SSH and GPG keys → New SSH key
# 粘贴公钥并保存

# 测试连接
ssh -T git@github.com

# 更新远程 URL (使用 SSH)
git remote set-url origin git@github.com:yourusername/pupy.git

# 推送
git push -u origin main
```

## 📊 仓库结构设置

### .github 工作流 (CI/CD)

创建 `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies (backend)
        run: cd 后端V5 && npm install
      
      - name: Lint backend
        run: cd 后端V5 && npm run lint
      
      - name: Install dependencies (frontend)
        run: cd '前端V5/pupy爪住 V5版前端' && npm install
      
      - name: Build frontend
        run: cd '前端V5/pupy爪住 V5版前端' && npm run build
```

### README 徽章

在 `README.md` 顶部添加：

```markdown
[![GitHub](https://img.shields.io/badge/GitHub-PUPY-steelblue)](https://github.com/yourusername/pupy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
```

## 📋 提交规范

### Conventional Commits

```bash
# 功能提交
git commit -m "feat(auth): 添加 JWT 认证系统"

# 错误修复
git commit -m "fix(pets): 修复宠物创建时的验证问题"

# 文档更新
git commit -m "docs(README): 更新快速开始步骤"

# 代码重构
git commit -m "refactor(api): 优化 API 响应处理"

# 性能优化
git commit -m "perf(db): 添加数据库索引提升查询速度"

# 测试添加
git commit -m "test(matches): 添加匹配算法单元测试"
```

## 🔄 分支管理

### 推荐分支策略

```
main (生产)
├── develop (开发)
│   ├── feature/user-auth (特性分支)
│   ├── feature/pet-matching
│   ├── feature/messaging
│   ├── bugfix/login-issue
│   └── hotfix/security-patch (热修复)
```

### 创建分支

```bash
# 从 develop 创建特性分支
git checkout -b feature/new-feature develop

# 开发完成后推送
git push origin feature/new-feature

# 在 GitHub 创建 Pull Request
# 等待 code review 和 CI 通过
# Merge 到 develop

# 定期从 develop merge 到 main 发布
```

## 🚀 部署配置

### Vercel (前端)

1. [vercel.com](https://vercel.com) 登录
2. Import GitHub 项目
3. 配置：
   - Root Directory: `前端V5/pupy爪住 V5版前端`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 添加环境变量：
   - `VITE_API_URL=https://pupy-backend.example.com`
5. 部署

### Railway/Render (后端)

见 `后端V5/README.md` 部署章节

## 📊 GitHub Pages (文档)

### 配置 Wiki

1. GitHub 仓库 → Wiki 标签
2. 创建首页 (Home)
3. 添加页面：
   - 快速开始
   - API 文档
   - 架构设计
   - 部署指南

### 发布 GitHub Pages

Settings → Pages:
- Source: `main branch /docs folder`
- 或 `gh-pages branch`

## 📝 发行版本

### 创建 Release

```bash
# 打算发布时创建标签
git tag -a v1.0.0 -m "Version 1.0.0: Initial Release"

# 推送标签
git push origin v1.0.0
```

GitHub 会自动创建 Release，支持上传二进制文件。

## 🎯 仓库配置

### 保护主分支

Settings → Branches:
- Require pull request reviews
- Require status checks to pass
- Dismiss stale reviews
- Require branches to be up to date

### 添加协作者

Settings → Manage access:
- 邀请团队成员
- 设置权限 (admin, maintain, push, triage, pull)

### Issue 和 PR 模板

创建 `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
## Bug 描述

清晰描述 bug 是什么...

## 快速复现

步骤：
1. ...
2. ...
3. ...

## 期望行为

应该发生什么...

## 实际行为

实际发生什么...

## 环境

- OS: 
- Browser: 
- Node Version: 

## 截图

如果适用，添加截图...
```

## 🔗 推送后的检查清单

- [ ] 所有文件已上传
- [ ] `.gitignore` 正确配置
- [ ] 没有提交 `.env` 文件
- [ ] README 更新完成
- [ ] LICENSE 正确
- [ ] GitHub Actions 配置完成
- [ ] 分支保护规则已设置
- [ ] Webhook 配置完成 (可选)

## 👥 团队协作

### 邀请协作者

```bash
# 从 GitHub 发送邀请
# Settings → Manage access → Invite a collaborator
```

### 代码审查流程

1. 创建 feature 分支
2. 完成开发和测试
3. 创建 Pull Request
4. 等待审核
5. 应用反馈
6. 合并到 develop/main

## 📚 有用的 GitHub 功能

- **项目板**: 项目管理
- **里程碑**: 版本追踪
- **讨论**: 社区交流
- **安全建议**: 依赖漏洞检测
- **代码审查**: Pull request 检查

## 🔍 常见问题

### Q: 如何更改仓库名?
A: Settings → General → Repository name

### Q: 如何删除仓库?
A: Settings → Danger zone → Delete this repository

### Q: 如何转移仓库所有权?
A: Settings → Danger zone → Transfer ownership

### Q: 如何同步 fork 的仓库?
```bash
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git rebase upstream/main
git push origin main
```

## 🛡️ GitHub 安全建议

1. **启用双因素认证 (2FA)**
2. **定期更新依赖**: `npm update`
3. **启用 Dependabot**: Settings → Code security
4. **保护机密**: 使用 GitHub Secrets
5. **定期审计**: 检查访问权限

---

**部署完成！** 🎉 

你的项目现在在 GitHub 上托管，可以：
- 与团队协作
- 追踪问题和功能请求
- 发布版本和文档
- 配置 CI/CD 自动化
- 获取社区贡献

祝部署愉快！ 🚀
