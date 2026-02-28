import axios from "axios";
import { defineStore } from "pinia";

/** Handle Faithful API/database integration using tokens from the auth store */
export const faithfulUserStore = defineStore("faithfulUser", {
	state: () => ({
		/** @type {string} */
		id: undefined,
		/** @type {string} */
		username: undefined,
		/** @type {string} */
		uuid: undefined,
		/** @type {string[]} */
		roles: undefined,
		/** @type {boolean} */
		anonymous: false,
	}),
	actions: {
		async getOrCreateUser(accessToken) {
			const res = await axios.get(`${window.apiURL}/users/newprofile`, {
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
		watchDiscordAuth(authStore, onError) {
			// https://pinia.vuejs.org/core-concepts/state.html#Subscribing-to-the-state
			authStore.$subscribe(async (mutation) => {
				if (mutation.type === "patch function") return;

				const auth = authStore.$state;

				// logged out
				if (auth.access_token === undefined) {
					this.$reset();
					this.$patch({ id: this.$state.id });
					return;
				}

				try {
					const user = await this.getOrCreateUser(auth.access_token);
					this.$patch({
						id: user.id,
						username: user.username,
						uuid: user.uuid,
						roles: user.roles,
						anonymous: user.anonymous,
					});
				} catch (args) {
					onError(args);
				}
			});
		},
	},
});
