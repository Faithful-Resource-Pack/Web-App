<template>
	<dashboard-card :title="$root.lang().dashboard.titles.textures" to="/gallery" clickable>
		<v-card-text class="pb-3">
			<v-row v-if="data.total_textures" class="py-0 my-0" dense>
				<v-col cols="6" sm="3">
					<dashboard-stat
						:label="$root.lang().dashboard.textures.total"
						:value="data.total_textures"
					/>
				</v-col>
				<v-col v-for="(count, edition) in data.textures_by_edition" :key="edition" cols="6" sm="3">
					<dashboard-stat :label="edition" :value="count" />
				</v-col>
				<v-col cols="6" sm="3">
					<dashboard-stat :label="$root.lang().dashboard.textures.versions" :value="versions" />
				</v-col>
			</v-row>
			<v-row v-else class="py-0 my-0" dense>
				<v-col v-for="i in 4" :key="`user-stats-${i}`" cols="12" sm="3">
					<div
						class="dashboard-stat mb-0 flex-grow-1 rounded-lg pa-2 d-flex align-center paragraph-loader"
					>
						<div class="d-flex align-end">
							<v-skeleton-loader class="loader mr-2" width="30" height="24" type="heading" />
							<v-skeleton-loader class="loader" width="60" min-height="14" type="text" />
						</div>
					</div>
				</v-col>
			</v-row>
			<detailed-treemap
				:loading="!Object.keys(data).length"
				:series="series"
				:labels="labels"
				:colors="colors"
			/>
		</v-card-text>
	</dashboard-card>
</template>

<script>
import axios from "axios";

import DashboardCard from "./dashboard-card.vue";
import DetailedTreemap from "@components/detailed-treemap.vue";
import DashboardStat from "./dashboard-stat.vue";

export default {
	name: "texture-card",
	components: {
		DashboardCard,
		DetailedTreemap,
		DashboardStat,
	},
	props: {
		colors: {
			type: Array,
			required: true,
		},
	},
	data() {
		return {
			data: {},
			// faster to use existing versions since it's already cached
			versions: Object.values(settings.versions || {}).flat().length,
		};
	},
	computed: {
		sortedEntries() {
			return Object.entries(this.data.textures_by_tags || {}).sort((a, b) => b[1] - a[1]);
		},
		series() {
			return this.sortedEntries.map((tagRecord) => tagRecord[1]);
		},
		labels() {
			return this.sortedEntries.map((tagRecord) => tagRecord[0]);
		},
	},
	created() {
		axios.get(`${this.$root.apiURL}/textures/stats`).then((res) => {
			this.data = res.data;
		});
	},
};
</script>
