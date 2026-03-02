<template>
	<v-card class="main-container mb-2 pa-4">
		<loading-page v-if="loading" class="py-10">
			{{ $root.lang().addons.general.loading_addon }}
		</loading-page>
		<v-form v-else ref="form" v-model="validForm" lazy-validation>
			<a
				href="https://docs.faithfulpack.net/pages/manuals/add-on-rules"
				target="_blank"
				rel="noopener noreferrer"
			>
				<v-alert type="warning" class="pb-4" color="orange darken-3">
					<span style="color: inherit; text-decoration: underline">
						{{ $root.lang().addons.general.rules }}
					</span>
					<v-icon small>mdi-open-in-new</v-icon>
				</v-alert>
			</a>

			<div class="text-h5">{{ $root.lang().addons.general.title }}</div>
			<v-row>
				<!-- LEFT PART : INPUT -->
				<v-col :class="$vuetify.breakpoint.smAndDown && 'pb-0'">
					<!-- Addon name -->
					<v-text-field
						v-model="submittedForm.name"
						required
						clearable
						:rules="form.name.rules"
						:counter="form.name.counter.max"
						:label="$root.lang().addons.general.name.label"
						:hint="$root.lang().addons.general.name.hint"
					/>

					<!-- Addon authors selection -->
					<user-select
						v-model="submittedForm.authors"
						:users="users"
						:label="$root.lang().addons.general.authors.label"
						:hint="$root.lang().addons.general.authors.hint"
					/>
				</v-col>
				<!-- RIGHT PART: HEADER IMAGE PREVIEW -->
				<v-col
					cols="12"
					sm="3"
					class="d-flex align-center"
					:class="$vuetify.breakpoint.smAndDown && 'pt-0 pb-7'"
				>
					<v-responsive
						:aspect-ratio="$vuetify.breakpoint.smAndDown ? undefined : 16 / 9"
						min-height="100px"
					>
						<emitting-image
							v-if="header"
							deletable
							:src="header"
							@fullscreen="openPreview"
							@delete="removeHeader"
						/>
						<drop-zone
							v-else
							v-model="submittedForm.headerFile"
							:disabled="disabledHeaderInput"
							accept="image/jpg, image/jpeg"
							style="height: 100%"
							@change="updateHeader"
						>
							<v-icon small>mdi-image</v-icon>
							{{ $root.lang().addons.images.header.labels.drop }}
						</drop-zone>
					</v-responsive>
				</v-col>
			</v-row>

			<div class="text-h5 my-3">
				{{ $root.lang().addons.images.title }}
			</div>

			<!-- upload field for images -->
			<div class="my-5">
				<drop-zone
					v-model="submittedForm.carouselFiles"
					multiple
					accept="image/jpg, image/jpeg"
					style="height: 70px"
					@change="onCarouselChange"
				>
					<v-icon small>mdi-image</v-icon>
					{{ $root.lang().addons.images.carousel.labels.drop }}
				</drop-zone>
			</div>

			<image-previewer
				deletable
				:sources="carouselSources"
				:ids="screenIds"
				@delete="removeCarouselItem"
			/>

			<div class="text-h5 mb-3">{{ $root.lang().addons.titles.info }}</div>

			<!-- Addon description -->
			<tabbed-text-field
				v-model="submittedForm.description"
				:textareaProps="{
					clearable: true,
					rules: form.description.rules,
					counter: form.description.counter.max,
					hint: $root.lang().addons.info.description.hint,
					placeholder: $root.lang().addons.info.description.placeholder,
				}"
			/>

			<!-- Embed description -->
			<v-text-field
				v-model="submittedForm.embed_description"
				clearable
				:label="$root.lang().addons.info.embed_description.label"
				:hint="$root.lang().addons.info.embed_description.hint"
				:counter="form.embed_description.counter.max"
				persistent-hint
			/>

			<!-- only visible to admins on already-existing addons -->
			<v-text-field
				v-if="$root.isAdmin && !addonNew"
				v-model="submittedForm.slug"
				clearable
				:label="$root.lang().addons.general.slug.label"
				:hint="$root.lang().addons.general.slug.hint"
				:rules="form.slug.rules"
				:counter="form.slug.counter"
			/>

			<div class="text-h5 mb-3">{{ $root.lang().addons.compatibility.title }}</div>

			<v-chip-group
				v-model="submittedForm.selectedPacks"
				multiple
				mandatory
				class="d-flex flex-row align-center"
			>
				<span class="subtitle-1 text--secondary mt-1">
					{{ $root.lang().addons.compatibility.packs.label }}
				</span>
				<div class="px-2" />
				<v-chip
					v-for="pack in packs"
					:key="pack.value"
					filter
					:value="pack.value"
					:style="{ color: pack.color }"
				>
					{{ pack.label }}
				</v-chip>
			</v-chip-group>

			<v-chip-group
				v-model="submittedForm.selectedEditions"
				multiple
				mandatory
				class="d-flex flex-row align-center"
			>
				<span class="subtitle-1 text--secondary mt-1">
					{{ $root.lang().addons.compatibility.editions.label }}
				</span>
				<div class="px-2" />
				<v-chip
					v-for="edition in editions"
					:key="edition.value"
					filter
					:value="edition.value"
					:style="{ color: edition.color }"
				>
					{{ edition.value }}
				</v-chip>
			</v-chip-group>

			<v-checkbox
				v-model="submittedForm.options.optifine"
				class="pt-5"
				:label="$root.lang().addons.compatibility.optifine.label"
			/>

			<div class="text-h5">{{ $root.lang().addons.downloads.title }}</div>

			<!-- cannot use obj.key as index since it rerenders the form on change otherwise -->
			<v-row v-for="(obj, index) in submittedForm.downloads" :key="index" class="mt-1">
				<v-col cols="12" sm="3">
					<v-text-field
						v-model="obj.key"
						clearable
						:placeholder="$root.lang().addons.downloads.name.placeholder"
						:label="$root.lang().addons.downloads.name.label"
						:rules="downloadTitleRules"
					/>
				</v-col>
				<v-col cols="12" sm="9">
					<v-row
						v-for="(_link, indexLinks) in obj.links"
						:key="indexLinks"
						class="align-baseline"
						dense
					>
						<v-col>
							<v-text-field
								v-model="obj.links[indexLinks]"
								clearable
								:placeholder="$root.lang().addons.downloads.link.placeholder"
								:label="$root.lang().addons.downloads.link.label"
								:rules="downloadLinkRules"
							/>
						</v-col>
						<v-col v-if="indexLinks == 0" class="flex-grow-0 flex-shrink-0">
							<v-btn icon @click="addDownloadLink(index)">
								<v-icon color="lighten-1">mdi-plus</v-icon>
							</v-btn>
						</v-col>
						<v-col v-else class="flex-grow-0 flex-shrink-0">
							<v-btn icon @click="removeDownloadLink(index, indexLinks)">
								<v-icon color="red lighten-1">mdi-minus</v-icon>
							</v-btn>
						</v-col>
						<v-col v-if="index != 0 && indexLinks == 0" class="flex-grow-0 flex-shrink-0">
							<v-btn icon @click="removeDownloadGroup(index)">
								<v-icon color="red lighten-1">mdi-delete</v-icon>
							</v-btn>
						</v-col>
					</v-row>
				</v-col>
			</v-row>
			<div class="pb-3">
				<v-btn block color="secondary" @click="addDownloadGroup">
					<v-icon left>mdi-playlist-plus</v-icon>
					{{ $root.lang().global.btn.add_download }}
				</v-btn>
			</div>

			<div class="d-flex justify-end pa-2">
				<v-btn
					v-if="$root.isAdmin"
					:disabled="!validForm"
					color="primary"
					text
					@click="onSubmit(true)"
				>
					{{ $root.lang().global.btn.submit_and_approve }}
				</v-btn>
				<v-btn :disabled="!validForm" color="darken-1" text @click="onSubmit(false)">
					{{ $root.lang().global.btn.submit_for_review }}
				</v-btn>
			</div>
		</v-form>

		<fullscreen-preview v-model="previewOpen" :src="header" />
	</v-card>
</template>

<script>
import axios from "axios";

import ImagePreviewer from "./image-previewer.vue";
import EmittingImage from "@components/emitting-image.vue";
import FullscreenPreview from "@components/fullscreen-preview.vue";
import DropZone from "@components/drop-zone.vue";
import TabbedTextField from "@components/tabbed-text-field.vue";
import UserSelect from "@components/user-select.vue";
import LoadingPage from "@components/loading-page.vue";
import { is16x9, verifyImage } from "@helpers/images";

export default {
	name: "addon-form",
	components: {
		EmittingImage,
		ImagePreviewer,
		FullscreenPreview,
		DropZone,
		TabbedTextField,
		UserSelect,
		LoadingPage,
	},
	props: {
		addonNew: {
			type: Boolean,
			required: false,
			default: false,
		},
		addonData: {
			type: Object,
			required: false,
			default: null,
		},
		loading: {
			type: Boolean,
			required: false,
			default: false,
		},
		headerSource: {
			type: String,
			required: false,
			default: "",
		},
		screenSources: {
			type: Array,
			required: false,
			default: () => [],
		},
		screenIds: {
			type: Array,
			required: false,
			default: undefined,
		},
		disabledHeaderInput: {
			type: Boolean,
			required: false,
			default: false,
		},
	},
	data() {
		return {
			form: {
				files: {
					header: {
						rules: [
							(header) => !!header || this.$root.lang().addons.images.header.rules.image_required,
							(header) =>
								(header && header.size < this.form.files.header.counter.max) ||
								this.$root
									.lang()
									.addons.images.header.rules.image_size.replace(
										"%s",
										this.form.files.header.counter.max / 1000,
									),
						],
						counter: {
							max: 3000000,
						},
					},
					carousel: {
						rules: [
							(files) =>
								files
									.map(
										(file) =>
											file.size < this.form.files.carousel.counter.max ||
											this.$root
												.lang()
												.addons.images.header.rules.image_size.replace(
													"%s",
													this.form.files.header.counter.max / 1000,
												),
									)
									.filter((r) => typeof r === "string")[0] || true,
						],
						counter: {
							max: 3000000,
						},
					},
					value: "",
				},
				description: {
					rules: [
						(desc) =>
							!!desc || this.$root.lang().addons.info.description.rules.description_required,
						(desc) =>
							(desc && desc.length <= this.form.description.counter.max) ||
							this.$root
								.lang()
								.addons.info.description.rules.description_too_big.replace(
									"%s",
									this.form.description.counter.max,
								),
						(desc) =>
							(desc && desc.length >= this.form.description.counter.min) ||
							this.$root
								.lang()
								.addons.info.description.rules.description_too_small.replace(
									"%s",
									this.form.description.counter.min,
								),
					],
					counter: {
						min: 32,
						max: 4096,
					},
				},
				embed_description: {
					rules: [
						(desc) =>
							(desc && desc.length > this.form.embed_description.counter.max) ||
							this.$root
								.lang()
								.addons.info.embed_description.rules.too_big.replace(
									"%s",
									this.form.embed_description.counter.max,
								),
					],
					counter: {
						max: 160,
					},
				},
				name: {
					rules: [
						(name) => !!name || this.$root.lang().addons.general.name.rules.name_required,
						(name) =>
							(name && name.length <= this.form.name.counter.max) ||
							this.$root
								.lang()
								.addons.general.name.rules.name_too_big.replace("%s", this.form.name.counter.max),
						(name) =>
							(name && name.length >= this.form.name.counter.min) ||
							this.$root
								.lang()
								.addons.general.name.rules.name_too_small.replace("%s", this.form.name.counter.min),
					],
					counter: {
						min: 5,
						max: 30,
					},
				},
				slug: {
					rules: [
						(input) => !!input || this.$root.lang().addons.general.slug.rules.required,
						(input) =>
							(input && input.length <= this.form.slug.counter.max) ||
							this.$root
								.lang()
								.addons.general.slug.rules.too_big.replace("%s", this.form.slug.counter.max),
						(input) =>
							(input && input.length >= this.form.slug.counter.min) ||
							this.$root
								.lang()
								.addons.general.slug.rules.too_small.replace("%s", this.form.slug.counter.min),
						(input) =>
							/^[a-zA-Z0-9\-]+$/.test(input) ||
							this.$root.lang().addons.general.slug.rules.incorrect_format,
					],
					counter: {
						min: 3,
						max: 30,
					},
				},
			},
			submittedForm: {
				name: "",
				headerFile: undefined,
				carouselFiles: [],
				description: "",
				downloads: [
					{
						key: "",
						links: [""],
					},
				],
				authors: [],
				selectedEditions: ["Java"],
				selectedPacks: [],
				options: {
					tags: [],
					optifine: false,
				},
			},
			headerValid: false,
			headerValidating: false,
			headerError: "",
			carouselValid: true,
			carouselValidating: false,
			carouselError: "",
			carouselDoNotVerify: false,
			downloadTitleRules: [
				(u) => !!u || this.$root.lang().addons.downloads.name.rules.name_required,
				(u) => u !== " " || this.$root.lang().addons.downloads.name.rules.name_cannot_be_empty,
			],
			downloadLinkRules: [
				(u) => String.urlRegex.test(u) || this.$root.lang().addons.downloads.link.rule,
			],
			validForm: false,
			// todo: move this to pack API when all packs are supported
			packs: [
				{ label: "Faithful 32x", value: "32x", color: "#00a2ff" },
				{ label: "Faithful 64x", value: "64x", color: "#ff0092" },
			],
			editions: [
				{ value: "Java", color: "#1dd96a" },
				{ value: "Bedrock", color: "#eee" },
			],
			users: [],
			previewOpen: false,
		};
	},
	computed: {
		header() {
			if (!this.addonNew) return this.headerSource;
			if (this.headerValidating || !this.headerValid || !this.submittedForm.headerFile) return;
			return URL.createObjectURL(this.submittedForm.headerFile);
		},
		carouselSources() {
			return this.screenSources ? this.screenSources : [];
		},
		carouselFiles() {
			return this.submittedForm.carouselFiles;
		},
		submittedData() {
			const data = Object.merge({}, this.submittedForm);

			data.options.tags = [...data.selectedEditions, ...data.selectedPacks];
			delete data.selectedEditions;
			delete data.selectedPacks;

			// we treat files with different endpoint
			delete data.headerFile;
			delete data.carouselFiles;

			return data;
		},
		resolutions() {
			return this.packs.map((p) => p.value);
		},
	},
	methods: {
		updateHeader(file) {
			// delete not uploaded file
			if (!file) {
				if (this.addonNew) this.$emit("header", undefined, true);
				return;
			}

			// activate validation loading
			this.headerValidating = true;

			verifyImage(file, is16x9, this.$root.lang().addons.images.header.rules.image_ratio)
				.then(() => {
					this.headerValid = true;
					this.$emit("header", file);
					if (!this.addonNew) this.submittedForm.headerFile = undefined;
				})
				.catch((error) => {
					this.headerValid = false;
					this.headerError = error.message;
					console.error(error);

					// input is changed so we delete parent component value
					if (this.addonNew) this.$emit("header", undefined, true);
					// if not addon new will delete file

					this.$root.showSnackBar(error.message, "error");
				})
				.finally(() => {
					this.headerValidating = false;
				});
		},
		removeHeader() {
			this.$emit("header", undefined, true);
			this.submittedForm.headerFile = undefined;
		},
		// submittedForm.carouselFiles has already been updated, not param
		onCarouselChange() {
			if (this.carouselDoNotVerify) return;

			const files = this.submittedForm.carouselFiles;
			if (!files || files.length == 0) return;

			this.carouselValidating = true;
			Promise.all(
				files.map((f) =>
					verifyImage(f, is16x9, this.$root.lang().addons.images.header.rules.image_ratio),
				),
			)
				.then(() => {
					this.carouselValid = true;
					this.$emit("screenshot", files);
					this.submittedForm.carouselFiles = [];
				})
				.catch((error) => {
					console.error(error);
					this.carouselValid = false;
					this.carouselError = error.message;
					this.$root.showSnackBar(error, "error");
				})
				.finally(() => {
					this.carouselValidating = false;
				});
		},
		removeCarouselItem(_item, index, id) {
			this.carouselDoNotVerify = true;
			this.submittedForm.carouselFiles.splice(index, 1);
			this.$emit("screenshot", undefined, index, true, id);
			this.$nextTick(() => {
				this.carouselDoNotVerify = false;
			});
		},
		addDownloadGroup() {
			this.submittedForm.downloads.push({ key: "", links: [""] });
		},
		removeDownloadGroup(downloadIndex) {
			this.submittedForm.downloads.splice(downloadIndex, 1);
		},
		addDownloadLink(downloadIndex) {
			this.submittedForm.downloads[downloadIndex].links.push("");
		},
		removeDownloadLink(downloadIndex, linkIndex) {
			this.submittedForm.downloads[downloadIndex].links.splice(linkIndex, 1);
		},
		openPreview() {
			this.previewOpen = true;
		},
		onSubmit(approve = false) {
			const valid = this.$refs.form.validate();
			if (!valid) return;

			this.$emit("submit", this.submittedData, approve);
		},
		getUsers() {
			axios
				.get(`${this.$root.apiURL}/users/names`)
				.then((res) => {
					this.users = res.data.sort((a, b) => {
						if (!a.username && !b.username) return 0;
						if (!a.username && b.username) return 1;
						if (a.username && !b.username) return -1;

						return a.username > b.username ? 1 : b.username > a.username ? -1 : 0;
					});
				})
				.catch((err) => console.trace(err));
		},
	},
	watch: {
		addonData: {
			handler(data) {
				if (this.addonNew || !data) return;

				// deep copy
				data = structuredClone(data);
				data.headerFile = undefined;
				data.carouselFiles = [];
				data.selectedPacks = data.options.tags.filter((e) => this.resolutions.includes(e));
				data.selectedEditions = data.options.tags.filter((e) =>
					this.editions.some((ed) => ed.value === e),
				);
				this.submittedForm = data;
			},
			immediate: true,
			deep: true,
		},
	},
	beforeMount() {
		this.getUsers();
		this.submittedForm.authors = [this.$root.user.id];
	},
};
</script>
