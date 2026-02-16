<template>
	<v-card :outlined="!$root.isDark" class="mb-5">
		<div class="transparent-tabs">
			<v-tabs v-model="tab" dense :color="activeColor">
				<v-tab>
					{{ $root.lang().global.tabbed_text_field.write }}
				</v-tab>
				<v-tab>
					{{ $root.lang().global.tabbed_text_field.preview }}
				</v-tab>
			</v-tabs>
			<div class="mx-2">
				<v-tabs-items v-model="tab">
					<v-tab-item>
						<v-textarea v-model="text" auto-grow v-bind="textareaProps" />
					</v-tab-item>
					<v-tab-item>
						<!-- 120px textarea + 18px word count text -->
						<!-- eslint-disable-next-line vue/no-v-html -->
						<div class="my-4 mx-3" style="min-height: 138px" v-html="rendered"></div>
					</v-tab-item>
				</v-tabs-items>
			</div>
		</div>
	</v-card>
</template>

<script>
import DOMPurify from "dompurify";

export default {
	name: "tabbed-text-field",
	props: {
		value: {
			type: String,
			required: false,
			default: "",
		},
		type: {
			type: String,
			required: false,
			// md | html
			default: "md",
		},
		textareaProps: {
			type: Object,
			required: false,
			default: () => ({}),
		},
		activeColor: {
			type: String,
			required: false,
			default: "",
		},
	},
	data() {
		return {
			text: "",
			tab: null,
		};
	},
	computed: {
		rendered() {
			if (!this.text) return this.$root.lang().global.tabbed_text_field.empty;
			switch (this.type) {
				case "html":
					return DOMPurify.sanitize(this.text);
				case "md":
				default:
					return this.$root.compileMarkdown(this.text);
			}
		},
	},
	watch: {
		value: {
			handler(newValue) {
				this.text = newValue;
			},
			immediate: true,
		},
		text(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
