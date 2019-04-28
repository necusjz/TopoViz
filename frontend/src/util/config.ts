import { Rules } from '../types/type';

const ruleOptions = [{
    label: `按厂商定位`,
    value: Rules.company,
    children: []
},{
    label: `按告警名称定位`,
    value: Rules.alarmName,
    children: []
},{
    label: `按 RCA 规则定位`,
    value: Rules.rcaReg,
    children: []
},{
    label: `按 P 告警定位`,
    value: Rules.pAlarm,
    children: []
},{
    label: `按 C 告警定位`,
    value: Rules.cAlarm,
    children: []
}];

const baseUrl = 'http://localhost:5000/';

export {
    ruleOptions,
    baseUrl
}
