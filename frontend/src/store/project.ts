import { MutationTree, Module } from 'vuex';
import { StaticsRes } from '@/types/type';
import { decimalToPercentage } from '@/util/util';

interface ProjectState {
    total_count: string | number;
    p_count: string | number;
    c_count: string | number;
    group_count: string | number;
    confirmed_count: string | number;
    unconfirmed_count: string | number;
    accuracy: string;
    groupIds: string[];
}
const state = {
    total_count: '--',
    p_count: '--',
    c_count: '--',
    group_count: '--',
    confirmed_count: '--',
    unconfirmed_count: '--',
    groupIds: [],
    accuracy: '--'
};

const mutations: MutationTree<ProjectState> = {
    SET_STATICS: (state: ProjectState, data: StaticsRes) => {
        state.total_count = data.total_alarm;
        state.c_count = data.c_count;
        state.p_count = data.p_count;
        state.group_count = data.group_count;
        state.confirmed_count = data.confirmed;
        state.unconfirmed_count = data.unconfirmed;
        state.accuracy = decimalToPercentage(data.accuracy);
    },
    SET_TOTALALARM: (state: ProjectState, count: number) => {
        state.total_count = count;
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
