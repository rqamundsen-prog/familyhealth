export default function CommunityFlywheelTemplates() {
  const templates = [
    {
      title: '案例复盘模板',
      content:
        '【场景】用户在___时出现___\n【动作】执行了___分钟___流程\n【结果】前后评分从___到___\n【复盘】下一步会优化___',
    },
    {
      title: '方法卡模板',
      content:
        '【适用人群】___\n【执行步骤】1)___ 2)___ 3)___\n【注意事项】___\n【最低执行成本】___分钟',
    },
    {
      title: '数据迭代模板',
      content:
        '【本周指标】完成率___ D1复访___ D7复访___\n【发现】流失主要在___\n【调整】下周把___改为___',
    },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">社区内容飞轮模板（可直接用）</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {templates.map((tpl) => (
          <div key={tpl.title} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900 mb-2">{tpl.title}</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{tpl.content}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
