import { AppState, AlarmData } from '../types/type';
import { MutationTree, Module } from 'vuex'

const state: AppState = {
    userName: 'RCA_234234',
    groupId: '',
    regValue: '',
    isImported: false,
    isNoneData: true,
    alarmDatas: [], // 查询得到的数据
    tableData: [], // 当前table的总数据
    pageData: [], // 当前table页的数据
};

const mutations: MutationTree<AppState> = {
    SET_USERNAME: (state: AppState, name: string) => {
        state.userName = name;
    },
    SET_GROUPID: (state: AppState, id: string) => {
        state.groupId = id;
    },
    SET_REGVALUE: (state: AppState, reg: string) => {
        state.regValue = reg;
    },
    SET_ISIMPORTED: (state: AppState, imported: boolean) => {
        state.isImported = imported;
    },
    SET_ISNONEDATA: (state: AppState, status: boolean) => {
        state.isNoneData = status;
    },
    SET_ALARMDATAS: (state: AppState, data: AlarmData[]) => {
        state.alarmDatas = data;
    },
    SET_TABLEDATA: (state: AppState, data: AlarmData[]) => {
        state.tableData = data;
    },
    SET_PAGEDATA: (state: AppState, data: AlarmData[]) => {
        state.pageData = data;
    }
};

const app = {
    state,
    mutations,
};

export default app;
