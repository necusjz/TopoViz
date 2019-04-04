export interface Node {
    id: string;
    content: string;
    pId: string | null;
    layer: any;
    childs: Node[];
    type: string;
}

export enum VisibleType {
    TIPVISIBLE = 'TIPVISIBLE',
    ERRORVISIBLE = 'ERRORVISIBLE',
}

export interface AppState {
    groupId: string;
    regValue: string;
    regType: string;
    isImported: boolean;
    isNoneData: boolean;
    isCheckStatics: boolean;
    alarmDatas: AlarmData[];
    tableData: AlarmData[];
    pageData: AlarmData[];
    confirmData: GroupData[];
    unconfirmData: GroupData[];
}

export interface AlarmData {
    alarmName: string,
    alarmSourceName: string,
    company: string,
    firstTime: string,
    lastTime: string,
    level: string,
    clearTime: string,
    domain: string,
    Group_ID: string,
    RCA_result: string,
    RCA_reg: string,
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

export interface StaticsRes {
    c_count: number;
    confirmed: number;
    group_count: number;
    group_id: string[];
    p_count: number;
    total_alarm: number;
    unconfirmed: number;
}

export interface AnalyzeRes {
    table: any;
    topo: any;
}