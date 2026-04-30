<template>
	<modal-form
		v-model="modalOpened"
		:title="title"
		:disabled="!denyReason || (denyReason && denyReason.length == 0)"
		danger
		@close="interacted(false)"
		@submit="interacted(true)"
	>
		<v-text-field
			v-model="denyReason"
			:autofocus="!$vuetify.breakpoint.mobile"
			:color="color"
			required
			:label="$root.lang().review.deny_window.label"
			:rules="reasonRules"
		/>
	</modal-form>
</template>

<script>
import ModalForm from "@layouts/modal-form.vue";

export default {
	name: "deny-popup",
	components: {
		ModalForm,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		archive: {
			type: Boolean,
			required: false,
			default: false,
		},
		color: {
			type: String,
			required: false,
			default: "primary",
		},
	},
	emits: ["input", "close"],
	data() {
		return {
			modalOpened: false,
			denyReason: "",
			reasonRules: [(u) => !u || u?.length > 0 || this.$root.lang().review.deny_window.rule],
		};
	},
	methods: {
		interacted(submit = false) {
			this.modalOpened = false;
			this.$emit("close", submit, this.denyReason);
			// reset modal
			if (submit) this.denyReason = "";
		},
	},
	computed: {
		title() {
			const strings = this.$root.lang().review.deny_window;
			if (this.archive) return strings.archive_title;
			return strings.title;
		},
	},
	watch: {
		value(newValue) {
			this.modalOpened = newValue;
		},
		modalOpened(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
