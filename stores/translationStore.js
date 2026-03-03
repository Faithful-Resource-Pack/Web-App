import moment from "moment";
import { defineStore } from "pinia";

// https://www.techonthenet.com/js/language_tags.php
const AVAILABLE_LANGS = Object.entries(import.meta.glob("/resources/strings/*.js")).map(
	([path, loadAsImport]) => {
		const name = path.split("/").pop().split(".")[0];
		return {
			id: name,
			short: name.includes("en") ? "en" : name.slice(-2).toLowerCase(),
			// automatically fetch default import
			load: () => loadAsImport().then((res) => res.default),
			bcp47: name.replace("_", "-"),
			file: path,
			iso3166: name.split("_")[1].toLowerCase(),
		};
	},
);

// dynamic import because vite, used for fallback translation

const LANG_KEY = "lang";
const LANG_DEFAULT = "en_US";
const { default: defaultLang } = await import(`../resources/strings/${LANG_DEFAULT}.js`);

export default defineStore("translation", {
	state: () => ({
		availableLangs: AVAILABLE_LANGS,
		loadedLangs: { [LANG_DEFAULT]: defaultLang },
		selectedLang: LANG_DEFAULT,
	}),
	actions: {
		async setLang(id) {
			localStorage.setItem(LANG_KEY, id);
			if (!Object.keys(this.loadedLangs).includes(id)) await this.loadLanguage(id);
			this.$patch({ selectedLang: id });
		},
		getLang() {
			const storedLang = localStorage.getItem(LANG_KEY) || LANG_DEFAULT;
			return AVAILABLE_LANGS.some((e) => storedLang === e.id) ? storedLang : LANG_DEFAULT;
		},
		async loadLanguage(langName) {
			const langObj = this.availableLangs.find((l) => l.id === langName);
			if (!langObj) return;

			moment.locale(langObj.bcp47);

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
	},
});
