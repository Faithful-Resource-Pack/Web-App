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
		<h3>{{ split.message }}</h3>
		<p v-if="split.submessage" class="mt-2 mb-0">{{ split.submessage }}</p>
		<v-card v-if="json" class="snackbar-json pa-3 mt-2" elevation="0">
			<pre>{{ JSON.stringify(json, null, 2) }}</pre>
		</v-card>
	</v-snackbar>
</template>

<script>
export default {
	name: "snackbar-status",
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
		};
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
