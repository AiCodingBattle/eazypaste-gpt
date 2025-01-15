import { createApp } from 'vue';
import App from './App.vue';
import './style.css'; // or style.scss, etc.

// If using Pinia or Vuex for state management, import and create it here
// import { createPinia } from 'pinia';
// const pinia = createPinia();

const app = createApp(App);
// app.use(pinia);
app.mount('#app');

