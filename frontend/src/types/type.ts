export interface Node {
    id: string;
    content: string;
    pId: string | null;
    layer: any;
    childs: Node[];
    type: string;
}

export enum EventType {
    TIPVISIBLE = 'TIPVISIBLE',
    ERRORVISIBLE = 'ERRORVISIBLE',
    NETWORKFILTER = 'NETWORKFILTER',
}

export interface AppState {
    groupId: string;
    regValue: string;
    regType: string;
    isNonImported: boolean;
    isNoneData: boolean;
    isCheckStatics: boolean;
    alarmDatas: AlarmData[];
    tableData: AlarmData[];
    pageData: AlarmData[];
    topoDatas: NodeData[][];
    confirmData: GroupData[];
    unconfirmData: GroupData[];
    selectAlarm: string;
    defaultDate: number[];
}

export interface AlarmData {
    uid: string;
    index: number;
    alarmName: string,
    alarmSourceName: string,
    company: string,
    firstTime: string,
    lastTime: string,
    level: string,
    clearTime: string,
    domain: string,
    Group_ID: string,
    rcaResult: string,
    rcaReg: string,
    isConfirmed: boolean,
    [k: string]: any,
}

export interface GroupData {
    groupId: string;
    precision: string;
}
export enum Rules {
    company,
    alarmName,
    rcaReg ,
    pAlarm,
    cAlarm,
}

export interface NodeData {
    name: string;
    type: string;
}
export interface StaticsRes {
    c_count: number;
    confirmed: number;
    group_count: number;
    group_id: string[];
    p_count: number;
    total_alarm: number;
    unconfirmed: number;
    start: number;
    end: number;
    client_id: string;
}

export interface AnalyzeRes {
    table: string;
    topo: any;
}