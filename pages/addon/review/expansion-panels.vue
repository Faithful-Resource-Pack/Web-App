<template>
	<!-- vuetify 2 doesn't support using values and v-model so we have to do it manually -->
	<v-expansion-panels v-model="selectedIndex" accordion>
		<v-expansion-panel
			v-for="addon in addons"
			:key="addon.key"
			:ref="`panel-${addon.key}`"
			class="review-expansion-panel"
			rounded
			@change="getAddon(addon.key)"
		>
			<v-expansion-panel-header expand-icon="mdi-menu-down">
				<v-list-item class="flex-column align-start px-0" style="min-height: 0px">
					<v-list-item-title class="align-self-start">{{ addon.primary }}</v-list-item-title>
					<v-list-item-subtitle>{{ addon.secondary }}</v-list-item-subtitle>
				</v-list-item>
			</v-expansion-panel-header>
			<v-expansion-panel-content>
				<v-divider class="my-4" />
				<addon-panel class="ma-n4" :addon="addonInPanel" :loading="loading" :authors="authors" />
				<v-divider class="my-4" />
				<addon-status
					class="ma-n4"
					:addon="addonInPanel"
					:loading="loading"
					:authors="authors"
					@reviewAddon="(...e) => $emit('reviewAddon', ...e)"
					@openDenyPopup="(...e) => $emit('openDenyPopup', ...e)"
				/>
			</v-expansion-panel-content>
		</v-expansion-panel>
	</v-expansion-panels>
</template>

<script>
import axios from "axios";

import AddonPanel from "./addon-panel.vue";
import AddonStatus from "./addon-status.vue";

export default {
	name: "expansion-panels",
	components: {
		AddonPanel,
		AddonStatus,
	},
	props: {
		addons: {
			type: Array,
			required: true,
		},
		authors: {
			type: Array,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
		value: {
			type: String,
			required: false,
			default: undefined,
		},
	},
	emits: ["reviewAddon", "openDenyPopup", "input"],
	data() {
		return {
			addonInPanel: {},
			selectedIndex: undefined,
			loading: true,
		};
	},
	methods: {
		getAddon(id) {
			this.$nextTick(() => {
				if (this.selectedIndex === undefined)
					this.$router.push({ query: { ...this.$route.query, id: undefined } });
			});

			// prevent redundant navigation if opening with query param on mount
			if (this.$route.query.id !== id) this.$router.push({ query: { ...this.$route.query, id } });

			this.loading = true;
			this.$emit("input", id);

			axios.get(`${this.$root.apiURL}/addons/${id}/all`, this.$root.apiOptions).then((res) => {
				this.addonInPanel = res.data;
				this.loading = false;
				this.$refs[`panel-${res.data.id}`][0].$el.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
			});
		},
	},
	watch: {
		addons: {
			handler(addons) {
				if (this.$route.query.id === undefined) return;
				this.selectedIndex = addons.findIndex((a) => a.key === this.$route.query.id);
				this.getAddon(this.$route.query.id);
			},
			deep: true,
			immediate: true,
		},
	},
};
</script>
