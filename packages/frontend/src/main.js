import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { store } from './store';
import { loadComponents } from './components/components';


const launch = async() => {
    const app = createApp(App);
    await loadComponents(app);
    app.use(router);
    app.use(store);
    app.mount('#app');
}

launch();
