import { MutationTree, Module } from 'vuex';
import { StaticsRes } from '@/types/type';

interface ProjectState {
    total_alarm: number;
    p_count: number;
    c_count: number;
    group_count: number;
    confirmed_count: number;
    unconfirmed_count: number;
    groupIds: string[];
}
const state = {
    total_alarm: 0,
    p_count: 0,
    c_count: 0,
    group_count: 0,
    confirmed_count: 0,
    unconfirmed_count: 0,
    groupIds: [],
};

const mutations: MutationTree<ProjectState> = {
    SET_STATICS: (state: ProjectState, data: StaticsRes) => {
        state.total_alarm = data.total_alarm;
        state.c_count = data.c_count;
        state.p_count = data.p_count;
        state.group_count = data.group_count;
        state.confirmed_count = data.confirmed;
        state.unconfirmed_count = data.unconfirmed;
        state.groupIds = data.group_id;
    },
    SET_TOTALALARM: (state: ProjectState, count: number) => {
        state.total_alarm = count;
    },
    SET_P_COUNT: (state: ProjectState, count: number) => {
        state.p_count = count;
    },
    SET_C_COUNT: (state: ProjectState, count: number) => {
        state.c_count = count;
    },
    SET_GROUP_COUNT: (state: ProjectState, count: number) => {
        state.group_count = count;
    },
    SET_CONFIRMED_COUNT: (state: ProjectState, count: number) => {
        state.confirmed_count = count;
    },
    SET_UNCONFIRMED_COUNT: (state: ProjectState, count: number) => {
        state.unconfirmed_count = count;
    },
    SET_GROUPIDS: (state: ProjectState, ids: string[]) => {
        state.groupIds = ids;
    },
};

const project = {
    state,
    mutations,
};

export default project;
