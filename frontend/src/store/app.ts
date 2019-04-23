import { AppState, AlarmData, GroupData, Node, Edge } from '../types/type';
import { MutationTree, Module } from 'vuex'

const state: AppState = {
    groupId: '',
    regValue: '',
    regType: '',
    isNonImported: true, // 是否导入数据
    isNoneTopoData: true, // 查询数据是否为空
    isNoneTableData: true, // 告警数据是否为空
    isCheckStatics: false, // 是否查看已确认未确认数据
    alarmDatas: [], // 查询得到的数据
    tableData: [], // 当前table(待确认|已处理)的总数据
    pageData: [], // 当前page页的数据
    topoDatas: {elements: [], edges: []}, // 拓扑树数据
    confirmData: [], // 已确认的group数据
    unconfirmData: [], // 未确认的group数据
    selectAlarm: '', // 当前选中的alarm
    defaultDate: [], // 默认的时间区间
    redAlarms: [], // 红色的告警元
    yellowAlarms: [], // 黄色的告警元
    clientId: '',
};

const mutations: MutationTree<AppState> = {
    SET_GROUPID: (state: AppState, id: string) => {
        state.groupId = id;
    },
    SET_REGVALUE: (state: AppState, reg: string) => {
        state.regValue = reg;
    },
    SET_REGTYPE: (state: AppState, type: string) => {
        state.regType = type;
    },
    SET_ISNOEIMPORTED: (state: AppState, imported: boolean) => {
        state.isNonImported = imported;
    },
    SET_ISNONETOPODATA: (state: AppState, status: boolean) => {
        state.isNoneTopoData = status;
    },
    SET_ISNONETABLEDATA: (state: AppState, status: boolean) => {
        state.isNoneTableData = status;
    },
    SET_ISCHECKSTATICS: (state: AppState, check: boolean) => {
        state.isCheckStatics = check;
    },
    SET_ALARMDATAS: (state: AppState, data: AlarmData[]) => {
        state.alarmDatas = data;
    },
    SET_TABLEDATA: (state: AppState, data: AlarmData[]) => {
        state.tableData = data;
    },
    SET_PAGEDATA: (state: AppState, data: AlarmData[]) => {
        state.pageData = data;
    },
    SET_TOPODATA: (state: AppState, data: {elements: Node[], edges: Edge[]}) => {
        state.topoDatas = data;
    },
    SET_CONFIRMDATA: (state: AppState, data: GroupData[]) => {
        state.confirmData = data;
    },
    SET_UNCONFIRMDATA: (state: AppState, data: GroupData[]) => {
        state.unconfirmData = data;
    },
    SET_SELECTALARM: (state: AppState, id: string) => {
        state.selectAlarm = id;
    },
    SET_DEFAULTDATE: (state: AppState, date: number[]) => {
        state.defaultDate = date;
    },
    SET_REDALARMS: (state: AppState, nets: string[]) => {
        state.redAlarms = nets;
    },
    SET_YELLOWALARMS: (state: AppState, nets: string[]) => {
        state.yellowAlarms = nets;
    },
    SET_CLIENTID: (state: AppState, clienId: string) => {
        state.clientId = clienId;
    }
};

const app = {
    state,
    mutations,
};

export default app;
