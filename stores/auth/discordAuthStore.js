import axios from "axios";
import { defineStore } from "pinia";

export const LEGACY_AUTH_STORAGE_KEY = "auth";
export const AUTH_STORAGE_KEY = "available_accounts";
export const CURRENT_USER_KEY = "current_user_id";

/** Base store to handle logins and Discord tokens */
export const discordAuthStore = defineStore("discordAuth", {
	state: () => ({
		/** @type {string} */
		access_token: undefined,
		/** @type {string} */
		refresh_token: undefined,
		/** @type {Date} */
		expires_at: undefined,
	}),
	actions: {
		parseSearchParams(search) {
			const params = new URLSearchParams(search);

			return {
				access_token: params.get("access_token"),
				refresh_token: params.get("refresh_token"),
				expires_at: this.expiryDurationToTime(params.get("expires_in")),
			};
		},
		parseLocalStorage() {
			// todo: remove this in a few months once everyone important has logged in at least once
			const legacyAuthJSON = localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);

			if (legacyAuthJSON !== null) {
				// convert to new format
				localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
				let auth;
				try {
					auth = JSON.parse(legacyAuthJSON);
				} catch (err) {
					console.error(err);
					return null;
				}

				if (!auth || !auth.expires_at) return null;

				// we can't set it at this point since we have no idea what account it's for
				return auth;
			}

			const authJSON = localStorage.getItem(AUTH_STORAGE_KEY);
			const currentID = localStorage.getItem(CURRENT_USER_KEY);

			let auth;
			try {
				auth = JSON.parse(authJSON)?.[currentID] ?? null;
			} catch (err) {
				console.error(err);
				return null;
			}

			if (!auth || !auth.expires_at) return null;

			return auth;
		},
		isAuthExpired(auth) {
			return new Date() > new Date(auth.expires_at);
		},
		isValidAuth(auth) {
			return auth && auth.access_token;
		},
		expiryDurationToTime(duration) {
			return new Date(new Date().getTime() + duration * 1000 - 60000);
		},
		async refreshLogin(auth = undefined) {
			if (auth === undefined) auth = this.$state;

			const json = await axios
				.post(`${window.apiURL}/auth/discord/refresh`, {
					refresh_token: auth.refresh_token,
				})
				.then((res) => res.data);

			return {
				access_token: json.access_token,
				refresh_token: json.refresh_token,
				expires_at: this.expiryDurationToTime(json.expires_in),
			};
		},
		logout() {
			this.$reset(); // ! Very important to reset all stores
		},
		async getAuthMethod() {
			// api returns tokens through search params, so prioritize those for login
			let auth = this.parseSearchParams(location.search);

			// nothing in search params, try localstorage
			if (!this.isValidAuth(auth)) auth = this.parseLocalStorage();

			// both api and localstorage auth tried, user is definitely not logged in at this point
			if (!this.isValidAuth(auth)) return null;
			return auth;
		},
		async loginWithAuth(auth) {
			const lastLogin = this.isAuthExpired(auth) ? this.refreshLogin(auth) : auth;
			const { access_token, refresh_token, expires_at } = await lastLogin;
			this.$patch({ access_token, refresh_token, expires_at });
		},
	},
});
