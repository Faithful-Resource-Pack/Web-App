import { defineStore } from "pinia";
import discordTokenStore, { AUTH_STORAGE_KEY, CURRENT_USER_KEY } from "./discordTokenStore.js";
import axios from "axios";

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
			const discordToken = discordTokenStore();

			discordToken.$subscribe(() => {
				const { access_token } = discordToken;
				const id = localStorage.getItem(CURRENT_USER_KEY);
				// logged out
				if (access_token === undefined) return this.updateAccounts(id);
				if (isDev) console.log(`Discord Token: ${access_token}`);
				// defer localStorage write to authStore mutation (has access to discord id)
				setTimeout(
					() => this.updateAccounts(id, discordToken.refreshLogin()),
					new Date(discordToken.expires_at).getTime() - new Date().getTime(),
				);

				Promise.all([
					this.loadDiscordProfile(access_token).catch((err) => app.showSnackBar(err, "error")),
					this.loadFaithfulProfile(access_token).catch((err) => app.showSnackBar(err, "error")),
				]);
			});

			const authMethod = await discordToken.getAuthMethod();

			// not logged in
			if (!authMethod) return;
			await discordToken.authenticate(authMethod).catch((err) => app.showSnackBar(err, "error"));

			// https://stackoverflow.com/a/41061471/20327257
			if (new URLSearchParams(location.search).has("access_token"))
				history.replaceState(null, "", window.location.pathname);
		},
		switchAccount(id) {
			const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY))[id];
			// we can get the auth already from localstorage and skip the validation
			return discordTokenStore().authenticate(auth);
		},
		logout(logoutId) {
			const currentId = this.id;
			// not logged into account being logged out of; remove it from localStorage and update
			if (logoutId && logoutId !== currentId) return this.updateAccounts(logoutId);

			const discordToken = discordTokenStore();
			discordToken.$reset();

			// try to get next available account and log into that
			const accounts = Object.entries(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)));
			const nextAccountCandidate = accounts.find(([id]) => id !== currentId);
			if (nextAccountCandidate) return discordToken.authenticate(nextAccountCandidate[1]);

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
		async loadDiscordProfile(accessToken) {
			if (accessToken === undefined) return this.$reset();
			const res = await axios.get("https://discord.com/api/users/@me", {
				headers: { authorization: `Bearer ${accessToken}` },
			});

			const { id, global_name, username, avatar, banner } = res.data;
			localStorage.setItem(CURRENT_USER_KEY, id);
			this.updateAccounts(id, discordTokenStore().$state);

			this.$patch({
				// queue access token update here to prevent unnecessary rerenders
				access_token: accessToken,

				id,
				// if there's already a username prioritize that (getFaithfulProfile resolved first)
				username: this.username || global_name,
				discordUsername: username,
				avatar: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}?size=1024` : null,
				banner: banner ? `https://cdn.discordapp.com/banners/${id}/${banner}?size=1024` : null,
			});
		},
		async loadFaithfulProfile(accessToken) {
			const res = await axios.get(`${window.apiURL}/users/newprofile`, {
				headers: {
					discord: accessToken,
				},
			});
			this.$patch({
				username: res.data.username,
				uuid: res.data.uuid,
				roles: res.data.roles || [],
				anonymous: res.data.anonymous || false,
			});
		},
	},
});
