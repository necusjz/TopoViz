import { Rules } from '../types/type';

const ruleOptions = [{
    label: `按厂商查询`,
    value: Rules.company
},{
    label: `按告警名称查询`,
    value: Rules.alarmName
},{
    label: `按RCA规则查询`,
    value: Rules.rcaReg
},{
    label: `按P警告查询`,
    value: Rules.pAlarm
},{
    label: `按C警告查询`,
    value: Rules.cAlarm
}];

export {
    ruleOptions
}