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
    userName: string;
    groupId: string;
    regValue: string;
    isNoneData: boolean;
}

export enum Rules {
    COMPANY = '厂商',
    ALARMNAME = '告警名称',
    RCAREG = 'RCA规则',
    PALARM = 'P警告',
    CALARM = 'C警告',
}
