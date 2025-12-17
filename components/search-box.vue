<template>
	<!-- this specific styling/behavior is used a lot -->
	<v-text-field
		v-bind="$attrs"
		v-model="search"
		:autofocus="!$vuetify.breakpoint.mobile"
		filled
		hide-details
		clearable
		clear-icon="mdi-close"
		append-icon="mdi-send"
		@keyup.enter="$emit('search')"
		@click:append="$emit('search')"
		@click:clear="$emit('clear')"
	/>
</template>

<script>
export default {
	name: "search-box",
	props: {
		value: {
			type: String,
			required: false,
			default: "",
		},
	},
	data() {
		return {
			search: "",
		};
	},
	watch: {
		value: {
			handler(newValue) {
				this.search = newValue;
			},
			immediate: true,
		},
		search(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
