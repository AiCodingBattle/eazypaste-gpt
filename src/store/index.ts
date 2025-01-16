import { createStore, Store as VuexStore, Commit } from 'vuex';
import { InjectionKey } from 'vue';

// Define the store state interface
export interface State {
  hiddenList: string[];
  selectedFiles: string[];
  introRules: string;
  userTask: string;
  lastFolderPath: string;
}

// Define injection key
export const key: InjectionKey<VuexStore<State>> = Symbol();

// Create store
export const store = createStore<State>({
  state: {
    hiddenList: [],
    selectedFiles: [],
    introRules: '',
    userTask: '',
    lastFolderPath: '',
  },
  mutations: {
    setHiddenList(state: State, list: string[]) {
      state.hiddenList = list;
    },
    setSelectedFiles(state: State, files: string[]) {
      state.selectedFiles = files;
    },
    setIntroRules(state: State, rules: string) {
      state.introRules = rules;
    },
    setUserTask(state: State, task: string) {
      state.userTask = task;
    },
    setLastFolderPath(state: State, path: string) {
      state.lastFolderPath = path;
    },
  },
  actions: {
    async updateHiddenList({ commit }: { commit: Commit }, list: string[]) {
      commit('setHiddenList', list);
    },
    async updateSelectedFiles({ commit }: { commit: Commit }, files: string[]) {
      commit('setSelectedFiles', files);
    },
    async updateIntroRules({ commit }: { commit: Commit }, rules: string) {
      commit('setIntroRules', rules);
    },
    async updateUserTask({ commit }: { commit: Commit }, task: string) {
      commit('setUserTask', task);
    },
    async updateLastFolderPath({ commit }: { commit: Commit }, path: string) {
      commit('setLastFolderPath', path);
    },
  },
  getters: {
    getHiddenList: (state: State) => state.hiddenList,
    getSelectedFiles: (state: State) => state.selectedFiles,
    getIntroRules: (state: State) => state.introRules,
    getUserTask: (state: State) => state.userTask,
    getLastFolderPath: (state: State) => state.lastFolderPath,
  },
});
