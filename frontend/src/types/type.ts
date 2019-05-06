export interface Node {
    id: string;
    type?: string;
    color?: string;
    [k: string]: any;
}

export interface Edge {
    from: string;
    to: string;
}

export enum EventType {
    TIPVISIBLE = 'TIPVISIBLE',
    ERRORVISIBLE = 'ERRORVISIBLE',
    NETWORKFILTER = 'NETWORKFILTER',
    FILTERRESET = 'FILTERRESET',
    RESETREDALARM = 'RESETREDALARM',
    CLEARALARMNET = 'CLEARALARMNET',
    CLEARTOPOTREE = 'CLEARTOPOTREE',
    QUERY = 'QUERY',
    CLEAREXPAN = 'CLEAREXPAN',
    SAVEDATA = 'SAVEDATA',
}

export interface AppState {
    groupId: string;
    regValue: string;
    regType: string;
    isNonImported: boolean;
    isNoneTopoData: boolean;
    isNoneTableData: boolean;
    isCheckStatics: boolean;
    alarmDatas: AlarmData[];
    tableData: AlarmData[];
    pageData: AlarmData[];
    topoDatas: {elements: Node[], edges: Edge[]};
    confirmData: GroupData[];
    unconfirmData: GroupData[];
    selectAlarm: string;
    defaultDate: number[];
    redAlarms: string[];
    yellowAlarms: string[];
    clientId: string;
    needSave: boolean;
}

export interface AlarmData {
    uid: string;
    index: number;
    alarmName: string,
    alarmSourceName: string,
    company: string;
    firstTime: string;
    lastTime: string;
    level: string;
    clearTime: string;
    domain: string;
    groupId: string;
    groupId_edit: string;
    rcaResult: string;
    rcaResult_edit: string;
    rcaReg: string;
    rcaReg_edit: string;
    isConfirmed: boolean;
    [k: string]: any;
}

export interface GroupData {
    groupId: string;
    precision: string;
}
export enum Rules {
    company = 1,
    alarmName = 2,
    rcaReg = 3,
    pAlarm = 4,
    cAlarm = 5,
}

export interface NodeData {
    name: string;
    type: string;
    level: number;
    color: string;
}
export interface StaticsRes {
    c_count: number;
    confirmed: number;
    group_count: number;
    group_id: string[];
    p_count: number;
    total_alarm: number;
    unconfirmed: number;
    x_count: number;
    start: number;
    end: number;
    client_id: string;
    accuracy: number;
}

export interface AnalyzeRes {
    table: any;
    topo: any;
    yellow?: string[];
    elements: {NEName: string, NEType: string}[];
    edges: {from: string, to: string}[];
}
export interface SelectOption {
    label: string;
    value: string | number;
    children?: SelectOption[];
}
export enum RCAResult {
    P = 'P',
    C = 'C',
}

export enum NetWorkLevel {
    nodeB,
    MicroWave,
    ATN,
    BSC
}