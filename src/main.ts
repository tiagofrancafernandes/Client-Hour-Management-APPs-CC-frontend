import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/main.css';
import App from './App.vue';
import CButton from './components/CButton.vue';
import CSelect from './components/CSelect.vue';
import CInput from './components/CInput.vue';
import CTextarea from './components/CTextarea.vue';
import CDropZone from './components/CDropZone.vue';
import UIPageHeader from './components/UIPageHeader.vue';
import { Icon } from '@iconify/vue';
import router from './router';
import authPlugin from './plugins/auth';
import ToastPlugin from '@/plugins/toast';

const app = createApp(App);
const pinia = createPinia();

const components = {
    CButton: CButton,
    Button: CButton,
    CSelect: CSelect,
    CInput: CInput,
    CTextarea: CTextarea,
    CDropZone: CDropZone,
    UIPageHeader: UIPageHeader,
    Icon: Icon,
    UIcon: Icon,
};

app.use(pinia);
app.use(router);
app.use(authPlugin);
app.use(ToastPlugin, {
    autoClose: 8000,
});

for (let [compName, compObj] of Object.entries(components)) {
    app.component(compName, compObj);
}

app.mount('#app');
