<template>
	<dashboard-card
		id="contribution-stats-card"
		:title="$root.lang().dashboard.titles.contribution_stats"
		to="/users"
		:clickable="$root.isAdmin"
	>
		<v-card-text>
			<v-row v-if="data.totals" dense class="d-flex">
				<v-col
					v-for="(value, key) in data.totals"
					:key="key"
					cols="12"
					sm="6"
					class="d-flex align-stretch"
				>
					<dashboard-stat :label="$root.lang().dashboard.totals[key] || key" :value="value" />
				</v-col>
			</v-row>
			<v-row v-else dense>
				<v-col v-for="i in 6" :key="`skeleton-${i}`" cols="12" sm="6" class="d-flex align-end">
					<div
						class="dashboard-stat mb-0 flex-grow-1 rounded-lg pa-2 d-flex align-center paragraph-loader"
					>
						<div class="d-flex align-end">
							<v-skeleton-loader class="loader mr-2" width="30" height="24" type="heading" />
							<v-skeleton-loader class="loader" width="120" min-height="14" type="text" />
						</div>
					</div>
				</v-col>
			</v-row>
		</v-card-text>
	</dashboard-card>
</template>

<script>
import DashboardCard from "./dashboard-card.vue";
import DashboardStat from "./dashboard-stat.vue";

export default {
	name: "contribution-stats-card",
	components: {
		DashboardCard,
		DashboardStat,
	},
	props: {
		data: {
			type: Object,
			required: false,
			default: () => ({}),
		},
	},
};
</script>
