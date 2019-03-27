import { Rules } from '../types/type';

const ruleOptions = [{
    label: `按${Rules.COMPANY}查询`,
    value: 'company'
},{
    label: `按${Rules.ALARMNAME}查询`,
    value: 'alarmName'
},{
    label: `按${Rules.RCAREG}查询`,
    value: 'rcaReg'
},{
    label: `按${Rules.PALARM}查询`,
    value: 'pAlarm'
},{
    label: `按${Rules.CALARM}查询`,
    value: 'cAlarm'
}];

export {
    ruleOptions
}