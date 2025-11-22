<template>
	<v-snackbar
		v-model="snackbarShown"
		class="snackbar-status"
		:timeout="snackbar.timeout"
		:color="snackbar.color"
		text
		bottom
		right
	>
		<div class="d-flex align-center">
			<div>
				<h3>{{ split.message }}</h3>
				<p v-if="split.submessage" class="mt-2 mb-0">{{ split.submessage }}</p>
			</div>
			<!-- this is such a stupid workaround for showing it only on errors -->
			<div v-if="snackbar.color === 'error'" class="ml-3">
				<v-btn text class="btn-square-icon" @click="copyMessage">
					<v-icon color="lighten-1">mdi-content-copy</v-icon>
				</v-btn>
				<v-btn
					text
					class="btn-square-icon"
					:href="reportURL"
					target="_blank"
					rel="noopener noreferrer"
				>
					<v-icon color="error">mdi-flag-variant</v-icon>
				</v-btn>
			</div>
		</div>

		<prism-editor
			v-if="json"
			:value="JSON.stringify(json, null, 2)"
			class="json-editor snackbar-json pa-3 mt-2"
			:highlight="highlighter"
		/>
	</v-snackbar>
</template>

<script>
import Prism from "prismjs";
import { PrismEditor } from "vue-prism-editor";

export default {
	name: "snackbar-status",
	components: {
		PrismEditor,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		snackbar: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			snackbarShown: false,
			reportURL:
				"https://github.com/Faithful-Resource-Pack/Web-App/issues/new?template=bug_report.yml",
		};
	},
	methods: {
		highlighter(code) {
			return Prism.highlight(code, Prism.languages.js, "json");
		},
		copyMessage() {
			const { message, submessage } = this.split;
			let formatted = `${message}:\n${submessage}`;
			if (this.json) formatted += `\n\n\`\`\`json\n${JSON.stringify(this.json, null, 4)}\`\`\``;
			formatted += `\n\nCreated: ${new Date().toString()}`;
			navigator.clipboard.writeText(formatted);
		},
	},
	computed: {
		split() {
			// default values
			const message = this.snackbar.message;
			const submessage = "";

			if (typeof this.snackbar.message === "string") {
				const newline = message.indexOf("\n");
				if (newline === -1) return { message, submessage };
				return {
					message: message.substring(0, newline),
					submessage: message.substring(newline + 1),
				};
			}
			// check for AxiosError
			const extractedMessage = message?.message;
			if (message.response?.data) {
				return {
					message: extractedMessage,
					submessage: message.response.data.error || message.response.data.message,
				};
			}

			return { message: extractedMessage, submessage };
		},
		json() {
			// if something is explicitly provided that takes precedence
			if (this.snackbar.json) return this.snackbar.json;
			const message = this.snackbar.message;
			// validation error json can be shown
			if (message.response?.data && message.response.data.details)
				return message.response.data.details;
			return null;
		},
	},
	watch: {
		value: {
			handler(newValue) {
				this.snackbarShown = newValue;
			},
			immediate: true,
		},
		snackbarShown(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
