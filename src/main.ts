import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/main.css';
import App from './App.vue';
import CButton from './components/CButton.vue';
import router from './router';
import authPlugin from './plugins/auth';

const app = createApp(App);
const pinia = createPinia();

const components = {
    CButton: CButton,
    Button: CButton,
};

app.use(pinia);
app.use(router);
app.use(authPlugin);

for (let [compName, compObj] of Object.entries(components)) {
    app.component(compName, compObj);
}

app.mount('#app');
