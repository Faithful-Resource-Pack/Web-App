import axios from "axios";
import { defineStore } from "pinia";

/** Handle Discord integration using tokens from the auth store */
export const discordProfileStore = defineStore("discordProfile", {
	state: () => ({
		/** @type {string} */
		discordId: undefined,
		/** @type {string} */
		discordAvatar: undefined,
		/** @type {string} */
		discordBanner: undefined,
		discordDisplayName: "",
		discordUsername: "",
	}),

	actions: {
		async getDiscordProfile(accessToken) {
			const res = await axios.get("https://discord.com/api/users/@me", {
				headers: { authorization: `Bearer ${accessToken}` },
			});
			return res.data;
		},
		watchDiscordAuth(authStore, onError) {
			// https://pinia.vuejs.org/core-concepts/state.html#Subscribing-to-the-state
			authStore.$subscribe(async (mutation) => {
				if (mutation.type === "patch function") return;

				const auth = authStore.$state;

				// logged out
				if (auth.access_token === undefined) return this.$reset();

				let json;
				try {
					json = await this.getDiscordProfile(auth.access_token);
				} catch (args) {
					onError(args);
				}

				this.$patch({
					discordId: json.id,
					discordAvatar:
						json.avatar == null
							? null
							: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}?size=1024`,
					discordBanner:
						json.banner == null
							? "https://database.faithfulpack.net/images/branding/backgrounds/main_background.png"
							: `https://cdn.discordapp.com/banners/${json.id}/${json.banner}?size=1024`,
					discordDisplayName: json.global_name,
					discordUsername: json.username,
				});
			});
		},
	},
});
