<template>
	<v-container>
		<v-row no-gutters class="py-0 my-0" align="center">
			<v-col cols="12" sm="6">
				<div class="text-h4 py-4 d-flex flex-row align-center">
					{{ $root.lang().addons.titles.submissions }}
					<v-progress-circular v-if="loading" indeterminate class="ml-5" />
				</div>
			</v-col>
			<v-col cols="12" sm="6">
				<v-btn block color="secondary" to="/addons/new">
					<v-icon left>mdi-plus</v-icon>
					{{ $root.lang().addons.titles.submit }}
				</v-btn>
			</v-col>
		</v-row>

		<div v-if="!loading && addons.length === 0">
			{{ error || $root.lang().addons.general.no_submissions }}
		</div>
		<div v-else class="my-2 text-h5">
			<card-grid :items="addons" :getImage="(addon) => getHeaderImg(addon.id)" :loading="loading">
				<template #title="{ name, options }">
					<v-card-title>{{ name }}</v-card-title>
					<v-card-subtitle>
						{{ options.packs.map((p) => packs[p].name).join(", ") }}
					</v-card-subtitle>
				</template>
				<template #text="{ approval, slug }">
					<v-badge dot inline :color="colors[approval.status]" />
					{{ $root.lang().addons.status[approval.status] }}
					<v-btn
						v-if="approval.status == 'approved'"
						color="blue"
						:href="`https://faithfulpack.net/addons/${slug}`"
						target="_blank"
						rel="noopener noreferrer"
						icon
						small
					>
						<v-icon small>mdi-open-in-new</v-icon>
					</v-btn>
					<div v-if="approval.status === 'denied'">
						{{ $root.lang().review.addon.labels.reason }}: {{ approval.reason }}
					</div>
				</template>
				<template #btns="addon">
					<v-btn text :to="`/addons/edit/${addon.id}`">
						{{ $root.lang().global.btn.edit }}
					</v-btn>
					<v-btn color="red" text @click="deleteAddon(addon)">
						{{ $root.lang().global.btn.delete }}
					</v-btn>
				</template>
			</card-grid>
		</div>

		<addon-remove-confirm v-model="remove.open" :data="remove.data" @close="getAddons" />
	</v-container>
</template>

<script>
import axios from "axios";

import AddonRemoveConfirm from "./addon-remove-confirm.vue";
import CardGrid from "@layouts/card-grid.vue";

export default {
	name: "addon-submissions",
	components: {
		AddonRemoveConfirm,
		CardGrid,
	},
	data() {
		return {
			addons: [],
			remove: {
				open: false,
				data: {},
			},
			colors: {
				approved: "green",
				pending: "yellow",
				denied: "red",
				archived: "grey",
			},
			packs: {},
			error: undefined,
			loading: true,
			failed: {},
			timestamp: new Date().getTime(),
		};
	},
	methods: {
		deleteAddon(addon) {
			this.remove.data = addon;
			this.remove.open = true;
		},
		getAddons() {
			axios
				.get(`${this.$root.apiURL}/users/${this.$root.user.id}/addons`, this.$root.apiOptions)
				.then((res) => {
					this.addons = res.data.sort((a, b) => (b.last_updated || 0) - (a.last_updated || 0));
				})
				.catch((e) => {
					console.error(e);
					this.error = `${e.statusCode}: ${e.response.value}`;
				})
				.finally(() => {
					this.loading = false;
				});
		},
		getHeaderImg(id) {
			return `${this.$root.apiURL}/addons/${id}/header?discord=${this.$root.user.access_token}&t=${this.timestamp}`;
		},
		getPacks() {
			axios.get(`${this.$root.apiURL}/packs/raw`).then((res) => {
				this.packs = res.data;
			});
		},
	},
	mounted() {
		this.$root.auth.addChangeListener(() => this.getAddons());
		this.getAddons();
		this.getPacks();
	},
};
</script>
