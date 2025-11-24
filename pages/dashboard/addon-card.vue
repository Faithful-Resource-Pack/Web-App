<template>
	<dashboard-card
		id="addon-card"
		:title="$root.lang().dashboard.titles.addons"
		to="/review/addons"
		:clickable="$root.isAdmin"
		class="d-flex flex-column justify-space-between"
	>
		<v-card-text class="pb-0 flex-grow-1 d-flex flex-column">
			<v-row v-if="!loading" dense class="d-flex align-stretch">
				<template v-for="status in statuses">
					<v-col
						v-if="data[status] !== undefined"
						:key="status"
						cols="12"
						:class="['d-flex align-stretch', adminResults ? 'col-sm-3' : '']"
					>
						<dashboard-stat
							:label="$root.lang().review.titles[status]"
							:value="data[status] || 0"
							:color="statusColor[status]"
						/>
					</v-col>
				</template>
			</v-row>
			<v-row v-else id="status-loader" dense class="d-flex align-stretch">
				<v-col
					v-for="i in skeletonCount"
					:key="`skeleton-status-${i}`"
					cols="12"
					:class="['d-flex align-end', skeletonCount > 1 ? 'col-sm-3' : '']"
				>
					<div class="p mb-0 flex-grow-1 rounded-lg pa-2 d-flex align-center paragraph-loader">
						<div class="d-flex align-end">
							<v-skeleton-loader class="loader mr-1" width="30" height="24" type="heading" />
							<v-skeleton-loader class="loader" width="60" min-height="17" type="text" />
						</div>
					</div>
				</v-col>
			</v-row>

			<v-row v-if="data" class="mt-1 py-0 my-0 align-self-stretch" dense>
				<v-col
					v-for="(number, tag) in data.numbers"
					:key="tag"
					cols="12"
					sm="3"
					class="d-flex align-stretch"
				>
					<dashboard-stat :label="tag" :value="number" />
				</v-col>
			</v-row>
			<v-row v-else id="stats-loader" class="mt-1 py-0 my-0 align-self-stretch" dense>
				<v-col
					v-for="i in 4"
					:key="`skeleton-stats-${i}`"
					cols="12"
					sm="3"
					class="d-flex align-stretch"
				>
					<div class="p mb-0 flex-grow-1 rounded-lg pa-2 d-flex align-center paragraph-loader">
						<div class="d-flex align-end">
							<v-skeleton-loader class="loader mr-1" width="30" height="24" type="heading" />
							<v-skeleton-loader class="loader" width="60" min-height="17" type="text" />
						</div>
					</div>
				</v-col>
			</v-row>
		</v-card-text>

		<v-card-actions v-if="$root.isLoggedIn" class="d-flex mt-0 px-4 pt-1">
			<v-row dense>
				<v-col>
					<v-btn block text color="primary" to="/addons/submissions">
						{{ $root.lang().dashboard.addons.submissions }}
					</v-btn>
				</v-col>
				<v-col>
					<v-btn block text color="primary" to="/addons/new">
						{{ $root.lang().dashboard.addons.upload }}
					</v-btn>
				</v-col>
			</v-row>
		</v-card-actions>

		<!-- fix missing bottom margin when user isn't logged in -->
		<span v-else class="mb-3" />
	</dashboard-card>
</template>

<script>
import axios from "axios";
import DashboardCard from "./dashboard-card.vue";
import DashboardStat from "@components/dashboard-stat.vue";

export default {
	name: "addon-card",
	components: {
		DashboardCard,
		DashboardStat,
	},
	data() {
		return {
			data: undefined,
			statusColor: {
				approved: "success--text",
				pending: "warning--text",
				denied: "error--text",
				archived: "grey--text",
			},
			loading: true,
		};
	},
	computed: {
		adminResults() {
			return this.data && Object.keys(this.data).length > 2;
		},
		statuses() {
			return Object.keys(this.statusColor);
		},
		roles() {
			return this.$root.user.roles.length;
		},
		url() {
			return this.$root.isAdmin ? "/addons/stats-admin" : "/addons/stats";
		},
		skeletonCount() {
			return this.$root.isAdmin ? 4 : 1;
		},
	},
	methods: {
		get() {
			this.loading = true;
			axios
				.get(this.$root.apiURL + this.url, this.$root.apiOptions)
				.then((res) => {
					this.data = res.data;
				})
				.finally(() => {
					this.loading = false;
				});
		},
	},
	created() {
		this.get();
	},
	watch: {
		roles(n, o) {
			if (n != o && this.$root.isAdmin) {
				this.loading = true;
				this.get();
			}
		},
	},
};
</script>
