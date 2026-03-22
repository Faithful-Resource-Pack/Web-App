import { defineStore } from "pinia";
import { AUTH_STORAGE_KEY, CURRENT_USER_KEY, discordAuthStore } from "./discordAuthStore.js";
import { faithfulUserStore } from "./faithfulUserStore.js";
import { discordProfileStore } from "./discordProfileStore.js";

export default defineStore("auth", {
	state: () => ({
		authListeners: [],

		// user information
		access_token: undefined,

		id: undefined,
		discordUsername: undefined,
		avatar: undefined,
		banner: undefined,

		username: undefined,
		uuid: undefined,
		roles: [],
		anonymous: false,
	}),
	actions: {
		// need app/dev for snackbars and logging
		async login(app, isDev) {
			const discordAuth = discordAuthStore();
			const discordProfile = discordProfileStore();
			const faithfulUser = faithfulUserStore();

			discordProfile.watchDiscordAuth(discordAuth, (err) => app.showSnackBar(err, "error"));
			faithfulUser.watchDiscordAuth(discordAuth, (err) => app.showSnackBar(err, "error"));

			discordAuth.$subscribe(() => {
				const id = localStorage.getItem(CURRENT_USER_KEY);
				// logged out
				if (discordAuth.access_token === undefined) this.updateAccounts(id);
				else {
					if (isDev) console.log(`Discord Token: ${discordAuth.access_token}`);
					// defer localStorage write to authStore mutation (has access to discord id)
					setTimeout(
						() => discordAuth.refreshLogin(),
						new Date(discordAuth.expires_at).getTime() - new Date().getTime(),
					);
				}

				this.$patch({
					access_token: discordAuth.access_token,
				});
			});

			discordProfile.$subscribe(() => {
				localStorage.setItem(CURRENT_USER_KEY, discordProfile.discordId);
				this.updateAccounts(discordProfile.discordId, discordAuth.$state);

				this.$patch({
					id: discordProfile.discordId,
					// if there's already a username prioritize that (faithfulUser resolved first)
					username: this.username || discordProfile.discordDisplayName,
					discordUsername: discordProfile.discordUsername,
					avatar: discordProfile.discordAvatar,
					banner: discordProfile.discordBanner,
				});
			});

			faithfulUser.$subscribe(() => {
				this.$patch({
					username: faithfulUser.username,
					uuid: faithfulUser.uuid,
					roles: faithfulUser.roles || [],
					anonymous: faithfulUser.anonymous || false,
				});
			});

			try {
				const authMethod = await discordAuth.getAuthMethod();

				// not logged in
				if (!authMethod) return;
				await discordAuth.loginWithAuth(authMethod);

				// https://stackoverflow.com/a/41061471/20327257
				if (new URLSearchParams(location.search).has("access_token"))
					history.replaceState(null, "", window.location.pathname);
			} catch (err) {
				console.error(err);
				app.showSnackBar(err, "error", 3000);
			}
		},
		switchAccount(id) {
			const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY))[id];
			// we can get the auth already from localstorage and skip the validation
			return discordAuthStore().loginWithAuth(auth);
		},
		logout(logoutId) {
			const currentId = this.id;
			// not logged into account being logged out of; remove it from localStorage and update
			if (logoutId && logoutId !== currentId) return this.updateAccounts(logoutId);

			const discordAuth = discordAuthStore();
			discordAuth.logout();

			// try to get next available account and log into that
			const accounts = Object.entries(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)));
			const nextAccountCandidate = accounts.find(([id]) => id !== currentId);
			if (nextAccountCandidate) return discordAuth.loginWithAuth(nextAccountCandidate[1]);

			// no more accounts, fully reset everything
			localStorage.removeItem(CURRENT_USER_KEY);
			this.$reset();
		},
		addChangeListener(cb) {
			this.authListeners.push(cb);
		},
		// write account to localstorage without affecting existing ones
		updateAccounts(id, payload) {
			const cur = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "{}") || {};
			if (payload) cur[id] = payload;
			else delete cur[id];
			localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(cur));

			// only emit once localStorage is updated
			this.authListeners.forEach((cb) => cb(this.access_token));
		},
	},
});
