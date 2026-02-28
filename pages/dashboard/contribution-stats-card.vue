<template>
	<dashboard-card
		id="contribution-stats-card"
		:title="$root.lang().dashboard.titles.contribution_stats"
		to="/users"
		:clickable="$root.isAdmin"
	>
		<v-card-text class="pb-4 flex-grow-1 d-flex align-stretch">
			<v-row v-if="data" dense>
				<v-col cols="12" class="d-flex align-stretch">
					<v-row dense class="d-flex">
						<v-col
							v-for="total in totals"
							:key="total.name"
							cols="12"
							:sm="6"
							class="d-flex align-stretch"
						>
							<dashboard-stat
								:label="$root.lang().dashboard.totals[total.name]"
								:value="total.value"
							/>
						</v-col>
					</v-row>
				</v-col>
			</v-row>
			<v-row v-else dense>
				<v-col cols="12" class="d-flex align-stretch">
					<v-row dense class="d-flex">
						<v-col
							v-for="i in 5"
							:key="`skeleton-${i}`"
							cols="12"
							sm="6"
							class="d-flex align-stretch"
						>
							<div class="dashboard-stat mb-0 rounded-lg pa-2">
								<v-card-title class="pa-0 d-inline text--primary">
									<v-skeleton-loader height="24" type="text" />
								</v-card-title>
							</div>
						</v-col>
					</v-row>
				</v-col>
			</v-row>
		</v-card-text>
	</dashboard-card>
</template>

<script>
import DashboardCard from "./dashboard-card.vue";
import DashboardStat from "@components/dashboard-stat.vue";

export default {
	name: "contribution-stats-card",
	components: {
		DashboardCard,
		DashboardStat,
	},
	data() {
		return {
			data: undefined,
		};
	},
	computed: {
		totals() {
			if (!this.data) return [];
			return this.data;
		},
	},
	methods: {
		onTotals(data) {
			this.data = data;
		},
	},
};
</script>
