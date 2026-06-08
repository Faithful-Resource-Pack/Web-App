<template>
	<div class="review-preview d-flex flex-column">
		<v-card class="main-container flex-grow-1 overflow-y-auto overflow-x-hidden">
			<addon-panel :addon="addonInPanel" :loading="loading" :authors="authors" />
		</v-card>
		<v-card class="main-container mt-2">
			<addon-status
				:addon="addonInPanel"
				:loading="loading"
				:authors="authors"
				@review="(id, status) => $emit('review', id, status)"
			/>
		</v-card>
	</div>
</template>

<script>
import axios from "axios";

import AddonPanel from "./addon-panel.vue";
import AddonStatus from "./addon-status.vue";

export default {
	name: "review-preview",
	components: {
		AddonPanel,
		AddonStatus,
	},
	props: {
		addonId: {
			type: String,
			required: false,
			default: undefined,
		},
		authors: {
			type: Array,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
	},
	emits: ["review"],
	data() {
		return {
			addonInPanel: {},
			loading: true,
		};
	},
	methods: {
		getAddon(id) {
			this.loading = true;
			axios.get(`${this.$root.apiURL}/addons/${id}/all`, this.$root.apiOptions).then((res) => {
				this.addonInPanel = res.data;
				this.loading = false;
			});
		},
	},
	watch: {
		addonId: {
			handler(n) {
				if (n === undefined) return;
				this.getAddon(n);
			},
			immediate: true,
		},
	},
};
</script>
