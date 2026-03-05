# 家健 - 家庭慢病行为托管系统

## 产品定位
面向「三高（高血压/高血糖/高血脂）+ 有孩子」家庭的慢病行为托管系统。
**核心逻辑：不做信息产品，做行为托管系统。**

## 技术栈
- **框架**: Next.js 15 + TypeScript + App Router
- **样式**: Tailwind CSS (无 shadcn 组件文件，直接写 Tailwind)
- **数据库**: SQLite + Prisma 5 ORM
- **认证**: NextAuth.js v4 (Credentials Provider)
- **图表**: Recharts
- **开发**: `npm run dev` 启动，端口 3000

## 项目结构
```
src/
├── app/
│   ├── (auth)/login/          # 登录页
│   ├── (dashboard)/
│   │   ├── layout.tsx         # 带侧边栏的布局
│   │   ├── dashboard/         # 家庭健康仪表盘（Server Component）
│   │   ├── records/           # 数据录入（Client Component）
│   │   ├── trends/            # 趋势分析（Server + Client 分离）
│   │   ├── alerts/            # 风险预警（Server + Client 分离）
│   │   └── tasks/             # 家庭任务（Server + Client 分离）
│   ├── admin/                 # 管理师后台
│   ├── api/
│   │   ├── auth/[...nextauth] # NextAuth 路由
│   │   ├── records/           # 健康记录 CRUD + 自动风险检测
│   │   ├── alerts/            # 预警 GET + PATCH(resolve)
│   │   ├── tasks/             # 任务 GET + POST + PATCH
│   │   └── seed/              # 演示数据初始化
│   ├── layout.tsx
│   ├── page.tsx               # 重定向到 /login
│   └── providers.tsx          # SessionProvider
├── components/
│   ├── charts/HealthCharts.tsx  # BloodPressureChart, GlucoseChart, WeightChart
│   ├── layout/Sidebar.tsx       # 左侧导航
│   └── ui/                      # Button, Input, Card, Badge, Select, Textarea
├── lib/
│   ├── db.ts                  # Prisma Client 单例
│   ├── auth.ts                # NextAuth 配置
│   ├── risk.ts                # 风险评估逻辑（assessBPRisk, calculateHealthScore 等）
│   └── utils.ts               # cn() Tailwind 合并工具
└── types/index.ts             # TypeScript 类型 + 医疗阈值常量
```

## 数据库
- 位置: `prisma/dev.db` (SQLite)
- Schema: `prisma/schema.prisma`
- 迁移命令: `npx prisma db push`
- 查看数据: `npx prisma studio`

**核心模型**: User → FamilyMember → Family
- HealthRecord: 血压/血糖/体重/行为记录
- Alert: 自动生成的风险预警 (GREEN/YELLOW/RED)
- Task: 家庭行为任务
- ManagerNote: 管理师备注

## 演示数据
访问 `GET /api/seed` 初始化演示数据：
- 家庭成员账号: father@demo.com / 123456
- 管理师账号: manager@familyhealth.com / 123456

## 风险规则 (src/lib/risk.ts)
- 血压 ≥ 140/90: YELLOW
- 血压 ≥ 180/120: RED
- 连续3天血压异常: 自动创建 Alert
- 空腹血糖 ≥ 7.0: RED
- 健康评分 = 100 - BP扣分 - 血糖扣分 - 行为扣分

## 用户角色
- MEMBER: 家庭成员（默认）
- MANAGER: 健康管理师，可访问 /admin
- ADMIN: 系统管理员

## 开发约定
- Server Components 用于数据获取，Client Components 仅处理交互
- API 路由统一在 src/app/api/ 下
- 所有数据库操作通过 prisma（src/lib/db.ts 单例）
- 中文界面，所有 label/placeholder 用中文
- 不使用 any 类型，保持 TypeScript 严格模式

## 三年路线图
- **第一年（现在）**: MVP + 找20个真实三高家庭验证
- **第二年**: 接入华为/小米/Apple健康数据，管理师工作台完善
- **第三年**: 风险预测模型，家庭报告自动化，规模化

## 商业模式
6000-12000元/家庭/年（年度健康托管服务）
1名管理师 × 50个家庭 = 30-60万/年
