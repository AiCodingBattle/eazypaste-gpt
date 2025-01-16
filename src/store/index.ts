import { createStore, Store as VuexStore, Commit } from 'vuex';
import { InjectionKey } from 'vue';

// Define the store state interface
export interface State {
  hiddenList: string[];
  selectedFiles: string[];
  introRules: string;
  userTask: string;
  lastFolderPath: string;

  // NEW FIELDS
  reverseHiddenMode: boolean;
  searchWords: string[];
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

    // Default to false / empty
    reverseHiddenMode: false,
    searchWords: [],
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

    // NEW MUTATIONS
    setReverseHiddenMode(state: State, mode: boolean) {
      state.reverseHiddenMode = mode;
    },
    setSearchWords(state: State, words: string[]) {
      state.searchWords = words;
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

    // NEW ACTIONS
    async updateReverseHiddenMode({ commit }: { commit: Commit }, mode: boolean) {
      commit('setReverseHiddenMode', mode);
    },
    async updateSearchWords({ commit }: { commit: Commit }, words: string[]) {
      commit('setSearchWords', words);
    },
  },
  getters: {
    getHiddenList: (state: State) => state.hiddenList,
    getSelectedFiles: (state: State) => state.selectedFiles,
    getIntroRules: (state: State) => state.introRules,
    getUserTask: (state: State) => state.userTask,
    getLastFolderPath: (state: State) => state.lastFolderPath,

    // NEW GETTERS
    getReverseHiddenMode: (state: State) => state.reverseHiddenMode,
    getSearchWords: (state: State) => state.searchWords,
  },
});
