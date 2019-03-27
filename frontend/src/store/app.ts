import { AppState } from '../types/type';
import { MutationTree, Module } from 'vuex'

const state: AppState = {
    userName: 'RCA_234234',
    groupId: '',
    regValue: '',
    isNoneData: true,
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
    SET_ISNONEDATA: (state: AppState, status: boolean) => {
        state.isNoneData = status;
    }
};

const app = {
    state,
    mutations,
};

export default app;
