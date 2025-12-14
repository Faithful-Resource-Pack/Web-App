<template>
	<v-list-item dense two-line class="my-2 d-flex align-center justify-space-between">
		<a :href="discordURL" target="_blank" rel="noopener noreferrer">
			<v-avatar>
				<v-img :src="$root.user?.avatar" :alt="`${$root.user.username}'s Avatar`">
					<template #placeholder>
						<div
							class="d-flex align-center justify-center white--text"
							style="height: 100%; background-color: #1c8a2e"
						>
							{{ $root.user.username?.[0] || "?" }}
						</div>
					</template>
				</v-img>
			</v-avatar>
		</a>
		<v-list-item-content class="mx-3">
			<v-list-item-title class="body-2" style="text-overflow: ellipsis; white-space: nowrap">
				{{ $root.user.username }}
			</v-list-item-title>
			<v-list-item-subtitle>{{ $root.user.discordUsername }}</v-list-item-subtitle>
		</v-list-item-content>
		<v-btn icon color="red lighten-1" @click="$root.logout">
			<v-icon>mdi-logout</v-icon>
		</v-btn>
	</v-list-item>
</template>

<script>
export default {
	name: "sidebar-user",
	computed: {
		discordURL() {
			return `https://discord.com/users/${this.$root.user.id}`;
		},
	},
};
</script>
