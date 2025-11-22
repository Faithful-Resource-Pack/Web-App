// add injected methods to entire webapp
import "@helpers/utilityMethods.js";

// frameworks
import Vue from "vue";
import VueRouter from "vue-router";
import Vuetify from "vuetify";

// general dependencies
import axios from "axios";
import moment from "moment";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { createPinia } from "pinia";

// pinia stores
import { discordAuthStore } from "./stores/discordAuthStore.js";
import { discordUserStore } from "./stores/discordUserStore.js";
import { appUserStore } from "./stores/appUserStore.js";

// layout components and tabs
import ALL_TABS from "@helpers/tabs.js";
import NavAppBar from "@components/nav-app-bar.vue";
import NavSidebar from "@components/nav-sidebar.vue";
import SnackbarStatus from "@components/snackbar-status.vue";
import MissingPage from "./pages/404/index.vue";

Vue.config.devtools = import.meta.env.MODE === "development";
Vue.use(Vuetify);
Vue.use(VueRouter);

const pinia = createPinia();
Vue.use(pinia);

// dynamic import because vite, used for fallback translation
const { default: en_US } = await import("./resources/strings/en_US.js");

/**
 * PWA REGISTRATION
 */

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("/service-worker.js").catch((err) => {
		console.error("Failed to register PWA Service Worker:", err);
	});
}

/**
 * LANGUAGES
 */

// https://www.techonthenet.com/js/language_tags.php
const AVAILABLE_LANGS = Object.entries(import.meta.glob("/resources/strings/*.js")).map(
	([path, loadAsImport]) => {
		const name = path.split("/").pop().split(".")[0];
		return {
			id: name.includes("en") ? "en" : name.slice(-2).toLowerCase(),
			// automatically fetch default import
			load: () => loadAsImport().then((res) => res.default),
			bcp47: name.replace("_", "-"),
			file: path,
			iso3166: name.split("_")[1].toLowerCase(),
		};
	},
);

// language objects are lazy loaded only when requested
const LOADED_LANGS = {
	en: en_US,
};

const LANG_KEY = "lang";
const LANG_DEFAULT = "en";
const _get_lang = () => {
	const storedLang = localStorage.getItem(LANG_KEY);
	if (!storedLang) return LANG_DEFAULT;
	return AVAILABLE_LANGS.some((e) => storedLang === e.id) ? storedLang : LANG_DEFAULT;
};

/**
 * ROUTING
 */

const AUTH_STORAGE_KEY = "auth";
const MENU_KEY = "menu_key";
const MENU_DEFAULT = false;

/** @type {import("vue-router").RouteConfig[]} */
const missingRoute = { path: "*", name: "404", component: MissingPage };

const router = new VueRouter({
	mode: "history",
});

router.beforeEach((to, _from, next) => {
	Vue.nextTick(() => {
		if (to.name) document.title = `${to.name} - Faithful Web Application`;
		else document.title = "Faithful Web Application";
	});
	// redirect to dashboard if base url
	if (to.fullPath === "/") {
		next("/dashboard");
		return;
	}
	// replace hash router (legacy urls) with history router
	if (["/#", "/?#"].some((p) => to.fullPath.startsWith(p))) {
		const path = to.fullPath.replace("/#", "").replace("/?#", "");
		next(path);
		return;
	}

	next();
});

window.apiURL = import.meta.env.VITE_API_URL;
// fix trailing slash
if (apiURL.endsWith("/")) window.apiURL = window.apiURL.slice(0, -1);

function syncRoutes(routes) {
	// accepts any number of routes
	const curRoutes = router.getRoutes().map((r) => r.path);
	const diff = routes.filter((r) => !curRoutes.includes(r.path));
	diff.forEach((r) => router.addRoute(r));
}

// add all public routes
syncRoutes(
	ALL_TABS.filter((t) => t.roles === undefined)
		.flatMap((t) => t.subtabs)
		.filter((s) => s.public)
		.flatMap((s) => s.routes),
);
// add missing route last (prevents some weird fallback shenanigans)
router.addRoute(missingRoute);

async function loadSettings() {
	// set as global
	window.settings = await axios
		.get(`${window.apiURL}/settings/raw`)
		.then((res) => res.data)
		.catch((err) => {
			console.error(err);
			// don't completely break the webapp if settings can't be fetched
			return {};
		});
}

// start loading immediately (needed for some pages)
await loadSettings();

/**
 * VUE INITIALIZATION
 */

const app = new Vue({
	el: "#app",
	components: {
		NavAppBar,
		NavSidebar,
		SnackbarStatus,
	},
	data() {
		return {
			discordUser: discordUserStore(),
			discordAuth: discordAuthStore(),
			appUser: appUserStore(),
			badgeData: {},
			// incremented to force the lang() function to update (more granular than $forceUpdate)
			refreshLang: 0,
			selectedLang: _get_lang(),
			loadedLangs: LOADED_LANGS,
			availableLangs: AVAILABLE_LANGS,
			tabs: ALL_TABS.map((tab) => {
				tab.subtabs = tab.subtabs.map((s) => {
					s.to = s.routes[0].path;
					return s;
				});
				return tab;
			}),
			snackbar: {
				show: false,
				message: "",
				color: "",
				timeout: 4000,
				json: undefined,
			},
			drawerOpen: localStorage.getItem(MENU_KEY)
				? localStorage.getItem(MENU_KEY) === "true"
				: MENU_DEFAULT,
			theme: undefined,
			themes: {
				dark: "mdi-weather-night",
				system: "mdi-desktop-tower-monitor",
				light: "mdi-white-balance-sunny",
			},
			authListeners: [],
		};
	},
	methods: {
		/** log reactive object */
		log(...objs) {
			const cleaned = JSON.parse(JSON.stringify(objs));
			console.log(cleaned);
		},
		langToBCP47(lang) {
			return this.availableLangs.find((l) => l.id === lang)?.bcp47;
		},
		async loadLanguage(langName) {
			const langObj = this.availableLangs.find((l) => l.id === langName);
			if (!langObj) return;

			moment.locale(langObj.bcp47);

			// already cached, no need to load
			if (this.loadedLangs[langObj.id]) return;

			const strings = await langObj.load().catch((e) => {
				this.showSnackBar(e.toString(), "error");
			});
			this.loadedLangs[langObj.id] = Object.merge({}, en_US, strings || {});

			// wait until the data changes have pushed to refresh the lang function
			this.$nextTick(() => this.refreshLang++);
		},
		async loadBadge(cb, key) {
			if (!this.isAdmin) return;
			// use await to prevent sync callbacks not having a then() method
			const value = await cb(this);
			this.$set(this.badgeData, key, value);
			// since it's recursive you don't need setInterval
			return setTimeout(() => this.loadBadge(cb, key), 30000);
		},
		// reverse curried version of showSnackBar with json first
		makeJsonSnackBar(json = undefined) {
			return (...allArgs) => {
				if (allArgs.length < 2) allArgs.push("");
				if (allArgs.length < 3) allArgs.push(4000);
				allArgs.push(json);

				return this.showSnackBar(...allArgs);
			};
		},
		showSnackBar(message, color = "", timeout = 4000, json = undefined) {
			this.snackbar.show = true;
			this.snackbar.message = message;
			this.snackbar.color = color;
			this.snackbar.timeout = timeout;
			this.snackbar.json = json;
		},
		logout() {
			this.discordAuth.logout();
		},
		/** For debugging in sub-components */
		checkPermissions() {
			console.log(this.$route);
			console.log(this.$router.options.routes);
		},
		compileMarkdown(rawText) {
			if (!rawText) return "";
			return DOMPurify.sanitize(marked(rawText));
		},
		addToken(data) {
			data.token = this.user.access_token;
			return data;
		},
		emitConnected() {
			this.authListeners.forEach((cb) => cb(this.user.access_token));
		},
		addAccessTokenListener(listener) {
			this.authListeners.push(listener);
			if (this.isLoggedIn) listener(this.user.access_token);
		},
		/** @param {"dark" | "light"} theme */
		onMediaChange(theme) {
			// only if system theme
			if (this.theme !== "system") return;

			this.$vuetify.theme.dark = theme === "dark";

			// nice snackbar sentence
			this.showSnackBar(
				notify.sentence.replace("%s", this.lang().global.snackbar_system_theme.themes[theme]),
				"success",
				2000,
			);
		},
		syncRoutes(tabs) {
			return syncRoutes(tabs.flatMap((r) => r.subtabs).flatMap((s) => s.routes));
		},
		reloadSettings() {
			return loadSettings();
		},
	},
	computed: {
		user() {
			return {
				access_token: this.discordAuth.access_token,
				avatar: this.discordUser.discordAvatar,
				banner: this.discordUser.discordBanner,
				id: this.appUser.appUserId,
				username: this.appUser.appUsername || this.discordUser.discordName,
				roles: this.appUser.appUserRoles || [],
			};
		},
		apiURL() {
			if (
				Vue.config.devtools &&
				window.apiURL &&
				window.apiURL.includes("localhost") &&
				location.host !== "localhost"
			)
				return window.apiURL.replace("localhost", location.host.split(":")[0]);
			return window.apiURL;
		},
		apiOptions() {
			// can be adjusted with new auth values as needed
			return {
				headers: { discord: this.user.access_token },
			};
		},
		availableTabObjects() {
			return (
				this.tabs
					// first filter categories
					.filter((tab) => !tab.roles || tab.roles.some((r) => this.userRoles.includes(r)))
					.map((tab) => ({
						// must create a new object so if the user logs in the old tabs aren't deleted
						...tab,
						subtabs: tab.subtabs.filter((subtab) => {
							if (subtab.public) return true;
							// if there's no roles then it's available to all logged in users
							if (!subtab.roles) return this.isLoggedIn;
							return subtab.roles.some((r) => this.userRoles.includes(r));
						}),
					}))
					// then when subtabs are filtered filter again
					.filter((tab) => tab.subtabs.length)
			);
		},
		/**
		 * Check user perms & add (or not) tabs & routes following user perms
		 * @returns all tabs to be added in the html
		 */
		availableTabs() {
			return this.availableTabObjects.map((tab) => {
				tab.labelText = this.lang().global.tabs[tab.label]?.title;
				tab.subtabs = tab.subtabs.map((s) => {
					s.labelText = this.lang().global.tabs[tab.label]?.subtabs[s.label];
					return s;
				});
				return tab;
			});
		},
		/**
		 * Tell if the user is logged in
		 */
		isLoggedIn() {
			return this.user && this.user.id && this.user.id !== undefined;
		},
		/**
		 * Tell if the user has administrator permissions (manager/dev)
		 */
		isAdmin() {
			// if not logged in
			if (!this.isLoggedIn) return false;

			// if user not loaded
			if (!this.user) return false;

			// check roles
			return this.user.roles.includes("Administrator");
		},
		/**
		 * Get user's roles in real time
		 * @returns user discord roles
		 */
		userRoles() {
			return this.user.roles;
		},
		langBCP47() {
			return this.langToBCP47(this.selectedLang);
		},
		lang() {
			// add refreshLang to the vue effect subscription by mentioning it
			this.refreshLang;

			// use computed value since we can cache the strings
			const allStrings = this.loadedLangs[this.selectedLang] || Object.values(this.loadedLangs)[0];
			return (path, raw = false) => {
				// no path, return all strings
				if (!path) return allStrings;

				// traverse object using path string
				const selectedData = path.split(".").reduce((acc, cur) => acc?.[cur], allStrings);

				// warns user if string not found
				if (selectedData === undefined)
					console.warn(`Cannot find ${raw ? "data" : "string"} for "${path}"`);

				// if raw we can use whatever's there (for partial paths)
				if (raw) return selectedData;

				// Force return type to prevent undefined breaking string methods
				return String(selectedData);
			};
		},
		isDark() {
			return this.$vuetify.theme.dark;
		},
	},
	watch: {
		selectedLang: {
			handler(newValue) {
				localStorage.setItem(LANG_KEY, newValue);
				// load new language if it exists
				if (!Object.keys(this.loadedLangs).includes(newValue)) return this.loadLanguage(newValue);

				moment.locale(this.langBCP47);

				// forces this.lang to update
				this.refreshLang++;
			},
			immediate: true,
		},
		theme: {
			handler(n) {
				const availableThemes = Object.keys(this.themes);
				if (n === undefined) {
					let theme = localStorage.getItem("THEME");

					// input validation
					if (!this.themes[theme]) theme = availableThemes[0];

					this.theme = theme;
					return;
				}
				if (!this.themes[n]) {
					this.theme = availableThemes[0];
					return;
				}

				localStorage.setItem("THEME", String(n));
				const isDark =
					n !== "light" &&
					(n === "dark" || window.matchMedia("(prefers-color-scheme: dark)").matches);
				this.$vuetify.theme.dark = isDark;
			},
			immediate: true,
		},
		// alias for $vuetify.theme.dark
		isDark: {
			handler(n) {
				const arr = ["theme--light", "theme--dark"];
				if (n) arr.reverse();

				// handle css
				const html = document.querySelector("html");

				html.classList.add(arr[0]);
				html.classList.remove(arr[1]);
			},
			immediate: true,
		},
		drawerOpen(n) {
			// don't set preference on small screens (pointless)
			if (this.$vuetify.breakpoint.mobile) return;
			localStorage.setItem(MENU_KEY, String(n));
		},
		userRoles(n, o) {
			if (o === undefined || o.length === undefined) return;
			if (n.length === undefined) return;
			// only update routes based on your roles fetched (role list is longer)
			// leave if new role list is shorter or equal
			if (n.length <= o.length) return;

			// add all routes with no role
			this.$nextTick(() => {
				this.availableTabObjects
					.flatMap((t) => t.subtabs)
					.filter((s) => s.badge)
					.forEach((s) => this.loadBadge(s.badge, s.label));
			});
		},
		availableTabObjects(n) {
			this.syncRoutes(n);
		},
	},
	created() {
		moment.locale(this.langToBCP47(_get_lang()));

		if (this.$vuetify.breakpoint.mdAndDown) this.drawerOpen = false;

		this.discordAuth.apiURL = window.apiURL;
		this.discordAuth
			.tryLogin(location.search, localStorage.getItem(AUTH_STORAGE_KEY))
			.then(() => {
				// remove query parameters after login
				if (new URLSearchParams(location.search).has("access_token")) {
					location.search = "";
				}
			})
			.catch((err) => {
				console.error(err);
				this.showSnackBar(err, "error", 3000);
			});

		this.discordUser.watchDiscordAuth(this.discordAuth, (err) =>
			this.showSnackBar(err, "error", 3000),
		);
		this.appUser.watchDiscordAuth(this.discordAuth, this.apiURL, (err) =>
			this.showSnackBar(err, "error", 3000),
		);

		this.discordAuth.$subscribe(() => {
			if (this.discordAuth.access_token === undefined) {
				// remove
				localStorage.removeItem(AUTH_STORAGE_KEY);
				this.emitConnected();
			} else {
				if (Vue.config.devtools) console.log(`Discord Token: ${this.discordAuth.access_token}`);
				// persist
				localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.discordAuth.$state));
				setTimeout(
					() => this.discordAuth.refreshLogin(),
					new Date(this.discordAuth.expires_at).getTime() - new Date().getTime(),
				);
			}
		});
	},
	mounted() {
		// watch color schemes for light and dark
		window.matchMedia("(prefers-color-scheme: dark)").onchange = (ev) => {
			if (ev.matches) this.onMediaChange("dark");
		};
		window.matchMedia("(prefers-color-scheme: light)").onchange = (ev) => {
			if (ev.matches) this.onMediaChange("light");
		};
	},
	// plugins
	router,
	vuetify: new Vuetify({
		theme: {
			dark: true,
			themes: {
				dark: {
					primary: "#76c945",
					accent: "#00a2ff",
					success: "#22a831",
				},
				light: {
					primary: "#76c945",
					accent: "#00a2ff",
					success: "#22a831",
				},
			},
		},
	}),
});

if (Vue.config.devtools) window.app = app;
