import { Rules } from '../types/type';

const ruleOptions = [{
    label: `按厂商查询`,
    value: Rules.company,
    children: []
},{
    label: `按告警名称查询`,
    value: Rules.alarmName,
    children: []
},{
    label: `按RCA规则查询`,
    value: Rules.rcaReg,
    children: []
},{
    label: `按P告警查询`,
    value: Rules.pAlarm,
    children: []
},{
    label: `按C告警查询`,
    value: Rules.cAlarm,
    children: []
}];

const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://10.40.49.171:8080/';

export {
    ruleOptions,
    baseUrl
}