<template>
	<div class="dashboard-page pa-2 py-sm-4 px-sm-6">
		<div class="text-h4 py-4">{{ greeting }}</div>

		<v-row class="dashboard-card-container">
			<v-col cols="12" sm="3">
				<profile-card v-if="$root.isLoggedIn" />
				<faithful-card v-else />
			</v-col>
			<v-col cols="12" sm="9">
				<texture-card :colors="colors" />
			</v-col>
			<v-col cols="12" sm="6">
				<addon-card />
			</v-col>
			<v-col cols="12" sm="6">
				<contribution-stats-card ref="cs" />
			</v-col>
			<v-col cols="12" sm="12">
				<contribution-activity-card :colors="colors" @stats="(t) => $refs.cs.onTotals(t)" />
			</v-col>
		</v-row>
	</div>
</template>

<script>
import AddonCard from "./addon-card.vue";
import ProfileCard from "./profile-card.vue";
import TextureCard from "./texture-card.vue";
import ContributionActivityCard from "./contribution-activity-card.vue";
import ContributionStatsCard from "./contribution-stats-card.vue";
import FaithfulCard from "./faithful-card.vue";

export default {
	name: "dashboardPage",
	components: {
		AddonCard,
		ProfileCard,
		TextureCard,
		ContributionActivityCard,
		ContributionStatsCard,
		FaithfulCard,
	},
	computed: {
		greeting() {
			return this.$root.user.username
				? this.$root.lang().dashboard.welcome_user.replace("%USER%", this.$root.user.username)
				: this.$root.lang().dashboard.welcome;
		},
		colors() {
			// https://colordesigner.io/gradient-generator
			if (this.$root.isDark)
				return ["#1e1e1e", "#303c27", "#425d30", "#537f38", "#65a33f", "#76c945"];
			return ["#f0f0f0", "#b5dd9e", "#a6d889", "#97d374", "#87ce5d", "#76c945"];
		},
	},
};
</script>

<style lang="scss">
.dashboard-card-container > * {
	display: flex;
	align-items: stretch;
}

.dashboard-stat {
	background-color: rgba(0, 0, 0, 0.05);
	width: 100%;
}

.theme--dark .dashboard-stat {
	background: rgba(0, 0, 0, 0.2);
}

.dashboard-page #addon-card .v-card__text p,
.dashboard-page #contribution-stats-card .v-card__text p {
	width: 100%;
}
</style>
