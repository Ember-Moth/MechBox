import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import Antd from "ant-design-vue";
import { ConfigProvider } from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import { industrialCompactTheme, industrialCSS } from "./themes/industrial-compact";

const app = createApp(App);
app.use(createPinia());
app.use(Antd);

// 注入工业紧凑主题样式
const style = document.createElement('style');
style.textContent = industrialCSS;
document.head.appendChild(style);

app.mount("#app");
