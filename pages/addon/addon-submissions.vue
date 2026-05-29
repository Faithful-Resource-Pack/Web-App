<template>
	<v-container class="flex-grow-1">
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

		<ascii-error
			v-if="!loading && !addons.length"
			:subtitle="error || $root.lang().addons.general.no_submissions"
			:errorCode="errorCode"
		/>
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

import CardGrid from "@layouts/card-grid.vue";
import AsciiError from "@components/ascii-error.vue";
import AddonRemoveConfirm from "./addon-remove-confirm.vue";

export default {
	name: "addon-submissions",
	components: {
		AsciiError,
		CardGrid,
		AddonRemoveConfirm,
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
			errorCode: undefined,
			loading: true,
			failed: {},
			timestamp: Date.now(),
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
				.catch((err) => {
					console.error(err);
					this.errorCode = err.response?.status;
					this.error =
						err.response.data?.message ||
						err.response.statusText ||
						this.$root.lang().addons.general.no_submissions;
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
