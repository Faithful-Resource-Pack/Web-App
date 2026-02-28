import axios from "axios";
import { defineStore } from "pinia";

/** Handle Faithful API/database integration using tokens from the auth store */
export const appUserStore = defineStore("appUser", {
	state: () => ({
		/** @type {string} */
		appUserId: undefined,
		/** @type {string} */
		appUsername: undefined,
		/** @type {string[]} */
		appUserRoles: undefined,
		/** @type {boolean} */
		appUserAnonymous: undefined,
	}),
	actions: {
		async getOrCreateUser(rootApiURL, accessToken) {
			const res = await axios.get(`${rootApiURL}/users/newprofile`, {
				headers: {
					discord: accessToken,
				},
			});
			return res.data;
		},
		/**
		 * @author TheRolf
		 * @param {import("pinia").Store} authStore
		 */
		watchDiscordAuth(authStore, rootApiURL, onError) {
			// https://pinia.vuejs.org/core-concepts/state.html#Subscribing-to-the-state
			authStore.$subscribe(async (mutation) => {
				if (mutation.type === "patch function") return;

				const auth = authStore.$state;

				// logged out
				if (auth.access_token === undefined) {
					this.$reset();
					this.$patch({ appUserId: this.$state.appUserId });
					return;
				}

				try {
					const user = await this.getOrCreateUser(rootApiURL, auth.access_token);
					this.$patch({
						appUserId: user.id,
						appUsername: user.username,
						appUserRoles: user.roles,
						appUserAnonymous: user.anonymous,
					});
				} catch (args) {
					onError(args);
				}
			});
		},
	},
});
