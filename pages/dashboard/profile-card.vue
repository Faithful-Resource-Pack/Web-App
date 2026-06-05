<template>
	<dashboard-card
		:title="$root.lang().dashboard.titles.profile"
		to="/profile"
		:clickable="$root.isLoggedIn"
	>
		<v-card-text class="flex-grow-1 d-flex flex-column justify-space-between">
			<div class="d-flex justify-center align-center flex-md-column ga-3">
				<v-list-item-avatar rounded class="dashboard-stat ma-3" size="128">
					<v-img
						v-if="!$root.isLoggedIn"
						class="mx-auto"
						aspect-ratio="1"
						max-width="100%"
						width="200px"
						src="https://database.faithfulpack.net/images/branding/logos/transparent/hd/main_logo.png"
					/>
					<v-img v-else-if="user.avatar" :src="user.avatar" />
					<div v-else class="text-h5 text-center text--primary font-weight-medium">
						{{ user.username[0] }}
					</div>
				</v-list-item-avatar>
				<!-- left text on mobile -->
				<div class="text-md-center">
					<h3 class="text-h5 text--primary mb-1" style="word-break: break-word">
						<template v-if="$root.isLoggedIn">{{ user.username }}</template>
						<template v-else>{{ $root.lang().global.name }}</template>
					</h3>
					<span class="text--secondary">
						<template v-if="$root.isLoggedIn">@{{ user.discordUsername }}</template>
						<template v-else>{{ $root.lang().dashboard.profile.login_notice }}</template>
					</span>
				</div>
			</div>
			<v-btn v-if="!$root.isLoggedIn" text color="primary" :href="$root.loginURL">
				<v-icon left>mdi-login</v-icon>
				{{ $root.lang().dashboard.profile.login_button }}
			</v-btn>
			<v-btn
				v-else
				text
				color="primary"
				:disabled="user.anonymous"
				:href="`https://faithfulpack.net/user/${user.id}`"
				target="_blank"
				rel="noopener noreferrer"
			>
				<v-icon left>mdi-account-box-outline</v-icon>
				{{ $root.lang().profile.public_profile }}
			</v-btn>
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
