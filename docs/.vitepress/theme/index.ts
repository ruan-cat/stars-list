import { defineRuancatPresetTheme } from "@ruan-cat/vitepress-preset-config/theme";
import { installTodoQuery } from "./query-client";

// 增加用户自定义样式
import "./style.css";

export default defineRuancatPresetTheme({
	enhanceAppCallBack({ app }) {
		installTodoQuery(app);
	},
});
