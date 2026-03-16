import { defineStore } from "pinia";

const LANG_KEY = "lang";
const DEFAULT_LANG_ID = "en_US";

// used for fallback translation
const { default: defaultLang } = await import(`../resources/strings/${DEFAULT_LANG_ID}.js`);

export default defineStore("translation", {
	state: () => ({
		availableLangs: Object.entries(import.meta.glob("/resources/strings/*.js"))
			.map(([path, loadAsImport]) => {
				const name = path.split("/").pop().split(".")[0];
				return {
					id: name,
					display: name.includes("en") ? "en" : name.slice(-2).toLowerCase(),
					// automatically fetch default import
					load: () => loadAsImport().then((res) => res.default),
					bcp47: name.replace("_", "-"),
					file: path,
					iso3166: name.split("_")[1].toLowerCase(),
				};
			})
			.reduce((acc, cur) => {
				acc[cur.id] = cur;
				return acc;
			}, {}),
		loadedLangs: { [DEFAULT_LANG_ID]: defaultLang },
		selectedLang: DEFAULT_LANG_ID,
	}),
	actions: {
		async setLang(id) {
			localStorage.setItem(LANG_KEY, id);
			if (!Object.keys(this.loadedLangs).includes(id)) await this.loadLanguage(id);
			this.$patch({ selectedLang: id });
		},
		supportedLang(lang) {
			return Object.keys(this.availableLangs).includes(lang);
		},
		getLang() {
			// navigator language uses bcp47 formatting, read from there if user hasn't overridden config
			const savedLangId = localStorage.getItem(LANG_KEY);
			if (this.supportedLang(savedLangId)) return savedLangId;

			// user hasn't ever interacted, try to figure out language from navigator.language
			const navigatorLangId = navigator.language.replace(/-/g, "_");
			if (this.supportedLang(navigatorLangId)) return navigatorLangId;

			// not directly supported, search for a close prefix
			const navigatorBase = navigatorLangId.split("_")[0];
			const bestMatch = Object.keys(this.availableLangs).find((l) => l.startsWith(navigatorBase));
			if (bestMatch) return bestMatch;

			// language isn't supported at all, just use english
			return DEFAULT_LANG_ID;
		},
		async loadLanguage(langName) {
			const langObj = this.availableLangs[langName];
			if (!langObj) return;

			// already cached, no need to load
			if (this.loadedLangs[langObj.id]) return;

			const strings = await langObj.load();

			this.$patch((store) => {
				store.loadedLangs[langObj.id] = Object.merge({}, defaultLang, strings || {});
			});
		},
		setup() {
			// incredible code
			this.setLang(this.getLang());
		},
	},
	getters: {
		// returns callback to support both lang("my.path.here") and lang().my.path.here
		lang() {
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
		current() {
			return this.availableLangs[this.selectedLang];
		},
	},
});
