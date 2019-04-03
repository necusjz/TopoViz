import { MutationTree, Module } from 'vuex'

interface UserState {
    userName: string;
}
const state = {
    userName: 'RCA_234234',
};

const mutations: MutationTree<UserState> = {
    SET_USERNAME: (state: UserState, name: string) => {
        state.userName = name;
    },
};

const app = {
    state,
    mutations,
};

export default app;
