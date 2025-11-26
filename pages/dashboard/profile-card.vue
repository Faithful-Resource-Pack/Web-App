<template>
	<dashboard-card
		:title="$root.lang().dashboard.titles.profile"
		to="/profile"
		clickable
		class="d-flex flex-column"
	>
		<v-card-text v-if="user" class="d-flex flex-column justify-space-between flex-grow-1">
			<div class="text-center">
				<v-list-item-avatar
					tile
					class="rounded-lg mb-5 mt-3"
					:class="user.avatar ? 'transparent' : 'primary'"
					size="120"
				>
					<v-img v-if="user.avatar" :src="user.avatar" />
					<div v-else class="text-h5 text-center text--primary font-weight-medium">
						{{ user.username[0] }}
					</div>
				</v-list-item-avatar>
				<h5 class="text-h5 text--primary mb-2">
					{{ user.username }}
				</h5>
				<span class="text--secondary">
					{{ user.id }}
				</span>
			</div>

			<div v-if="user.roles.length" class="dashboard-stat text-center rounded-lg pa-3">
				<p v-for="role in user.roles" :key="role" class="mb-0">{{ role }}</p>
			</div>
		</v-card-text>
	</dashboard-card>
</template>

<script>
import DashboardCard from "./dashboard-card.vue";

export default {
	name: "profile-card",
	components: {
		DashboardCard,
	},
	computed: {
		user() {
			return this.$root.user;
		},
	},
};
</script>
