<template>
	<dashboard-card :title="$root.lang().dashboard.titles.textures" to="/gallery" clickable>
		<v-card-text class="pb-3">
			<v-row v-if="totalTextures" class="py-0 my-0" dense>
				<v-col cols="6" sm="3">
					<dashboard-stat :label="$root.lang().dashboard.textures.total" :value="totalTextures" />
				</v-col>
				<v-col v-for="(count, edition) in texturesByEdition" :key="edition" cols="6" sm="3">
					<dashboard-stat :label="edition" :value="count" />
				</v-col>
				<v-col cols="6" sm="3">
					<dashboard-stat :label="$root.lang().dashboard.textures.versions" :value="versions" />
				</v-col>
			</v-row>
			<v-row v-else class="py-0 my-0" dense>
				<v-col v-for="i in 4" :key="`user-stats-${i}`" cols="12" sm="3">
					<div
						style="min-height: 56px"
						class="dashboard-stat mb-0 rounded-lg pa-3 d-flex align-center"
					>
						<v-skeleton-loader height="24" type="heading" width="100%" />
					</div>
				</v-col>
			</v-row>
			<detailed-treemap
				:loading="totalTextures === 0"
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
import DashboardStat from "@components/dashboard-stat.vue";

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
			totalTextures: 0,
			versions: Object.values(settings.versions || {}).flat().length,
			texturesByEdition: {},
			texturesByTags: {},
		};
	},
	computed: {
		sortedEntries() {
			return Object.entries(this.texturesByTags).sort((a, b) => b[1] - a[1]);
		},
		series() {
			return this.sortedEntries.map((tagRecord) => tagRecord[1]);
		},
		labels() {
			return this.sortedEntries.map((tagRecord) => tagRecord[0]);
		},
	},
	created() {
		// todo: probably make this api-side
		axios.get(`${this.$root.apiURL}/textures/raw`).then((res) => {
			const data = Object.values(res.data);
			this.totalTextures = data.length;
			const { byEditions, byTags } = data
				.flatMap((texture) => texture.tags)
				.reduce(
					(acc, cur) => {
						if (["Java", "Bedrock"].includes(cur)) {
							acc.byEditions[cur] ||= 0;
							++acc.byEditions[cur];
						} else {
							acc.byTags[cur] ||= 0;
							++acc.byTags[cur];
						}
						return acc;
					},
					{ byEditions: {}, byTags: {} },
				);
			this.texturesByEdition = byEditions;
			this.texturesByTags = byTags;
		});
	},
};
</script>
