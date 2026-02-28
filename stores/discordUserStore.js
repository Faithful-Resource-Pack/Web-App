import axios from "axios";
import { defineStore } from "pinia";

/** Handle Discord integration using tokens from the auth store */
export const discordUserStore = defineStore("discordUser", {
	state: () => ({
		discordUserURL: "https://discord.com/api/users/@me",
		/** @type {string} */
		discordId: undefined,
		/** @type {string} */
		discordAvatar: undefined,
		/** @type {string} */
		discordBanner: undefined,
		discordName: "",
		discordUsername: "",
	}),

	actions: {
		params(newDiscordUserURL) {
			this.$patch({
				discordUserURL: newDiscordUserURL || this.discordUserURL,
			});
		},
		async getInfo(accessToken) {
			const res = await axios.get(this.discordUserURL, {
				headers: { authorization: `Bearer ${accessToken}` },
			});
			return res.data;
		},
		watchDiscordAuth(authStore, app, onError) {
			// https://pinia.vuejs.org/core-concepts/state.html#Subscribing-to-the-state
			authStore.$subscribe(async (mutation) => {
				if (mutation.type === "patch function") return;

				const auth = authStore.$state;

				// logged out
				if (auth.access_token === undefined) return this.$reset();

				let json;
				try {
					json = await this.getInfo(auth.access_token);
				} catch (args) {
					onError(args);
				}

				app.updateAccounts(json.id, auth);

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
					discordName: json.global_name,
					discordUsername: json.username,
				});
			});
		},
	},
});
