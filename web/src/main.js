import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// 👇 把这一行加在这里
import './assets/theme.css'; 

createApp(App).use(router).mount('#app');
