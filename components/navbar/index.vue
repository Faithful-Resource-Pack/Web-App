<template>
	<v-app-bar app dense>
		<v-app-bar-nav-icon
			:title="$root.lang().global.navbar.labels.sidebar"
			@click="$emit('drawer')"
		/>

		<v-spacer />
		<v-menu left offset-y transition="slide-y-transition">
			<template #activator="{ on, attrs }">
				<v-btn
					min-width="0"
					class="px-1 ms-2"
					elevation="0"
					:aria-label="$root.lang().global.navbar.labels.theme"
					v-bind="attrs"
					v-on="on"
				>
					<v-icon>mdi-theme-light-dark</v-icon>
					<v-icon small>mdi-chevron-down</v-icon>
				</v-btn>
			</template>
			<v-list class="pt-0" dense nav>
				<v-subheader
					class="font-weight-black text-uppercase text-center justify-center text--primary"
				>
					{{ $root.lang().global.themes.title }}
				</v-subheader>
				<v-list-item
					v-for="(icon, key) in themes"
					:key="key"
					class="cursor-pointer text-left"
					:class="{ 'v-list-item--active': $root.theme === key }"
					dense
					@click="$emit('theme', key)"
				>
					<v-list-item-icon class="me-4">
						<v-icon>{{ icon }}</v-icon>
					</v-list-item-icon>
					<v-list-item-title>
						{{ $root.lang().global.themes.options[key] }}
					</v-list-item-title>
				</v-list-item>
				<v-divider />
				<v-list-item>
					<v-list-item-icon class="me-4">
						<!-- ripple clips into the list item margins for some reason -->
						<v-simple-checkbox
							:ripple="false"
							:disabled="$root.isDark"
							:value="darkSidebar"
							@input="updateDarkSidebar"
						/>
					</v-list-item-icon>
					<!-- make label clickable -->
					<v-list-item-title
						:class="$root.isDark ? 'text--secondary' : 'text--primary cursor-pointer'"
						@click="updateDarkSidebar"
					>
						{{ $root.lang().global.themes.dark_sidebar }}
					</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
		<v-menu right offset-y transition="slide-y-transition">
			<template #activator="{ on, attrs }">
				<v-btn
					min-width="0"
					class="px-1 ms-2"
					elevation="0"
					:aria-label="$root.lang().global.navbar.labels.translations"
					v-bind="attrs"
					v-on="on"
				>
					<v-icon>mdi-translate</v-icon>
					<v-icon small>mdi-chevron-down</v-icon>
				</v-btn>
			</template>
			<v-list class="pt-0" dense nav>
				<v-subheader
					class="font-weight-black text-uppercase text-center justify-center text--primary"
				>
					{{ $root.lang().global.translations }}
				</v-subheader>
				<v-list-item
					v-for="lang in languages"
					:key="lang.bcp47"
					class="cursor-pointer text-left"
					:class="{ 'v-list-item--active': lang.id === $root.selectedLang }"
					dense
					@click="$emit('lang', lang.id)"
				>
					<v-list-item-avatar
						min-width="24"
						:width="24"
						max-width="24"
						:height="18"
						class="rounded-0"
					>
						<v-img
							:src="`https://flagcdn.com/24x18/${lang.iso3166}.png`"
							:srcset="`
								https://flagcdn.com/32x24/${lang.iso3166}.png 2x,
								https://flagcdn.com/48x36${lang.iso3166}.png 3x`"
							width="24"
							height="18"
						/>
					</v-list-item-avatar>
					<v-list-item-title class="uppercase">{{ lang.id }}</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>

		<v-menu
			v-if="$root.isLoggedIn"
			right
			min-width="200px"
			offset-y
			transition="slide-y-transition"
		>
			<template #activator="{ on, attrs }">
				<img
					v-bind="attrs"
					class="mx-1 ms-2"
					style="height: 32px; aspect-ratio: 1 !important; border-radius: 100%"
					:src="$root.user?.avatar"
					:alt="`${$root.user.username}'s Avatar`"
					v-on="on"
				/>
			</template>
			<v-list dense nav>
				<v-list-item two-line style="min-height: 0">
					<v-list-item-avatar left class="my-0">
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
					</v-list-item-avatar>
					<v-list-item-content>
						<v-list-item-title class="body-2" style="text-overflow: ellipsis; white-space: nowrap">
							{{ $root.user.username }}
						</v-list-item-title>
						<v-list-item-subtitle>{{ $root.user.discordUsername }}</v-list-item-subtitle>
					</v-list-item-content>
				</v-list-item>
				<v-divider class="my-1" />
				<v-list-item
					:disabled="$root.user.anonymous"
					:href="`https://faithfulpack.net/user/${$root.user.id}`"
					target="_blank"
					rel="noopener noreferrer"
				>
					<v-list-item-icon class="me-4">
						<v-icon>mdi-open-in-new</v-icon>
					</v-list-item-icon>
					<v-list-item-title>{{ $root.lang().global.navbar.profile.view }}</v-list-item-title>
				</v-list-item>
				<v-list-item to="/profile">
					<v-list-item-icon class="me-4">
						<v-icon>mdi-pencil</v-icon>
					</v-list-item-icon>
					<v-list-item-title>{{ $root.lang().global.navbar.profile.edit }}</v-list-item-title>
				</v-list-item>
				<v-list-item @click="openAccountManager">
					<v-list-item-icon class="me-4">
						<v-icon>mdi-account-switch</v-icon>
					</v-list-item-icon>
					<v-list-item-title>{{ $root.lang().global.navbar.profile.manage }}</v-list-item-title>
				</v-list-item>
				<v-list-item @click="copyID">
					<v-list-item-icon class="me-4">
						<v-icon>mdi-identifier</v-icon>
					</v-list-item-icon>
					<v-list-item-title>{{ $root.lang().global.navbar.profile.copy }}</v-list-item-title>
				</v-list-item>
				<v-list-item
					class="red--text lighten-1"
					color="red lighten-1"
					@click="() => $root.logout()"
				>
					<!-- I have no idea why vuetify requires this to be specified red three times -->
					<v-list-item-icon class="me-4">
						<v-icon color="red lighten-1">mdi-logout</v-icon>
					</v-list-item-icon>
					<v-list-item-title class="red--text lighten-1">
						{{ $root.lang().global.logout }}
					</v-list-item-title>
				</v-list-item>
			</v-list>
		</v-menu>
		<v-btn v-else small color="primary" class="mx-1 ms-2" :href="$root.discordAuth.discordAuthURL">
			<v-icon left>mdi-login</v-icon>
			Log in
		</v-btn>
		<account-manager v-model="accountManagerOpen" />
	</v-app-bar>
</template>

<script>
import AccountManager from "./account-manager.vue";

export default {
	name: "nav-app-bar",
	components: {
		AccountManager,
	},
	props: {
		themes: {
			type: Object,
			required: true,
		},
		languages: {
			type: Array,
			required: true,
		},
		darkSidebar: {
			type: Boolean,
			required: true,
		},
	},
	data() {
		return {
			accountManagerOpen: false,
		};
	},
	methods: {
		openAccountManager() {
			this.accountManagerOpen = true;
		},
		copyID() {
			navigator.clipboard.writeText(this.$root.user.id);
			this.$root.showSnackBar(this.$root.lang().global.navbar.profile.copied, "success");
		},
		updateDarkSidebar() {
			if (!this.$root.isDark) this.$emit("update:darkSidebar", !this.darkSidebar);
		},
	},
};
</script>
