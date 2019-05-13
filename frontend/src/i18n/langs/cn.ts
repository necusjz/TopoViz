import zhLocale from 'element-ui/lib/locale/lang/zh-CN';

const cn = {
  lang: {
    upload: '上传',
    export: '导出数据',
    importTopoData: '导入 TOPO 数据',
    importRCAData: '导入 RCA 结果',
    rcaResultStatics: 'RCA 结果汇总',
    totalAlarm: '总告警',
    pAlarm: 'P 告警',
    cAlarm: 'C 告警',
    xAlarm: '未知告警',
    groupNumber: '组数量',
    confirmed: '已确认组',
    unconfirmed: '未确认组',
    accuracy: 'RCA 准确率',
    noData: '无数据',
    noDataMsg: '您还没有确认过的数据哦，去“未确认”里看看吧。',
    knownAlarm: '已知告警',
    unknownAlarm: '未知告警',
    selectStart: '选择开始时间',
    selectEnd: '选择结束时间'
  },
  ...zhLocale
}

export default cn;
