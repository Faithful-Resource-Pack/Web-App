<template>
	<v-dialog
		v-model="modalOpened"
		fullscreen
		hide-overlay
		content-class="colored"
		transition="dialog-bottom-transition"
		@keydown.esc="closeModal"
	>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div class="styles" v-html="pageStyles" />
		<v-card class="d-flex flex-column">
			<v-toolbar class="flex-grow-0 px-2">
				<v-btn icon @click.stop="closeModal">
					<v-icon>mdi-close</v-icon>
				</v-btn>
				<v-toolbar-title v-if="loading">
					{{ $root.lang().global.loading }}
					<v-progress-circular v-if="loading" indeterminate size="25" width="3" class="ml-2" />
				</v-toolbar-title>
				<v-toolbar-title v-else-if="title">{{ title }}</v-toolbar-title>
				<v-spacer v-if="$slots.toolbar" />
				<slot name="toolbar" />
			</v-toolbar>
			<slot />
		</v-card>
	</v-dialog>
</template>

<script>
import { generatePageStyles } from "@helpers/colors.js";

export default {
	name: "fullscreen-modal",
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		title: {
			type: String,
			required: false,
			default: "",
		},
		loading: {
			type: Boolean,
			required: false,
			default: false,
		},
		pageColor: {
			type: String,
			required: false,
			default: "primary",
		},
	},
	data() {
		return {
			modalOpened: false,
			pageStyles: "",
		};
	},
	methods: {
		closeModal() {
			this.modalOpened = false;
			this.$emit("close");
		},
	},
	mounted() {
		this.pageStyles = generatePageStyles(this.pageColor);
	},
	watch: {
		value: {
			handler(n) {
				this.modalOpened = n;
			},
			// has issues if the modal is open on page load otherwise
			immediate: true,
		},
		modalOpened(n) {
			this.$emit("input", n);
		},
	},
};
</script>
