import { AppState, AlarmData, GroupData } from '../types/type';
import { MutationTree, Module } from 'vuex'

const state: AppState = {
    groupId: '',
    regValue: '',
    regType: '',
    isImported: false, // 是否导入数据
    isNoneData: true, // 查询数据是否为空
    isCheckStatics: false, // 是否查看已确认未确认数据
    alarmDatas: [], // 查询得到的数据
    tableData: [], // 当前table的总数据
    pageData: [], // 当前table页的数据
    confirmData: [], // 已确认的group数据
    unconfirmData: [], // 未确认的group数据
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
    SET_ISIMPORTED: (state: AppState, imported: boolean) => {
        state.isImported = imported;
    },
    SET_ISNONEDATA: (state: AppState, status: boolean) => {
        state.isNoneData = status;
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
    SET_CONFIRMDATA: (state: AppState, data: GroupData[]) => {
        state.confirmData = data;
    },
    SET_UNCONFIRMDATA: (state: AppState, data: GroupData[]) => {
        state.unconfirmData = data;
    }
};

const app = {
    state,
    mutations,
};

export default app;
