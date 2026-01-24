<template>
	<v-container>
		<h4 class="text-h4 py-4">{{ $root.lang().profile.title }}</h4>

		<v-list
			class="main-container mb-2 pa-4"
			:class="{ 'mx-n3': !$vuetify.breakpoint.mdAndUp }"
			rounded
		>
			<v-list-item two-line>
				<v-list-item-avatar>
					<v-img :src="$root.user.avatar" />
				</v-list-item-avatar>

				<v-list-item-content>
					<v-list-item-title>
						{{ $root.discordUser.discordName || $root.user.username }}
						<span class="text--secondary">• {{ $root.user.id }}</span>
					</v-list-item-title>
					<v-list-item-subtitle>
						<v-chip
							v-for="role in $root.user.roles || []"
							:key="role"
							class="mr-1 px-2 my-1"
							x-small
						>
							{{ role }}
						</v-chip>
					</v-list-item-subtitle>
				</v-list-item-content>
			</v-list-item>

			<!-- ================ GENERAL SETTINGS ================ -->
			<div
				class="my-5 d-flex justify-space-between"
				:style="{
					alignItems: $vuetify.breakpoint.mdAndUp ? 'flex-start' : 'center',
					flexDirection: $vuetify.breakpoint.mdAndUp ? 'row' : 'column',
				}"
			>
				<v-col
					v-if="localUser.uuid && localUser.uuid.length == uuidMaxLength"
					cols="2"
					:sm="$vuetify.breakpoint.mdAndUp ? 3 : 2"
					class="d-flex justify-center"
					style="max-width: 200px"
				>
					<img
						alt="avatar"
						:src="
							($vuetify.breakpoint.mdAndUp
								? 'https://vzge.me/full/256/'
								: 'https://vzge.me/head/128/') + localUser.uuid
						"
					/>
				</v-col>
				<v-col
					:cols="hasUUID ? 10 : 12"
					:sm="hasUUID ? ($vuetify.breakpoint.mdAndUp ? 9 : 10) : 12"
					class="flex-grow-1 mx-0 px-0"
					style="max-width: 100%"
				>
					<div class="text-h6 mb-5">{{ $root.lang().profile.general.title }}</div>
					<v-form lazy-validation>
						<v-row>
							<v-col>
								<v-text-field
									v-model="localUser.username"
									required
									:rules="usernameRules"
									:counter="usernameMaxLength"
									clearable
									:label="$root.lang().profile.general.username.label"
									:hint="$root.lang().profile.general.username.hint"
								/>
							</v-col>
						</v-row>
						<v-row>
							<v-col cols="12" sm="9">
								<v-text-field
									v-model="localUser.uuid"
									placeholder="aaabbbcc-ddee-1122-3344-zzz555aadd33"
									:rules="uuidRules"
									:counter="uuidMaxLength"
									clearable
									:label="$root.lang().profile.general.uuid.label"
									:hint="$root.lang().profile.general.uuid.hint"
								/>
							</v-col>
							<v-col cols="12" sm="3">
								<v-tooltip
									:left="$vuetify.breakpoint.mdAndUp"
									:right="!$vuetify.breakpoint.mdAndUp"
									max-width="400px"
									min-width="250px"
								>
									<template #activator="{ on, attrs }">
										<!-- https://github.com/vuetifyjs/vuetify/issues/11345 -->
										<span v-bind="attrs" v-on="on">
											<v-checkbox
												v-model="localUser.anonymous"
												:label="$root.lang().profile.general.anonymous.label"
											/>
										</span>
									</template>
									<span>{{ $root.lang().profile.general.anonymous.hint }}</span>
								</v-tooltip>
							</v-col>
						</v-row>
					</v-form>
				</v-col>
			</div>

			<div class="text-h6 mb-5">{{ $root.lang().profile.general.bio.label }}</div>

			<tabbed-text-field
				v-model="localUser.bio"
				:textareaProps="{
					rules: bioRules,
					counter: bioMaxLength,
					placeholder: $root.lang().profile.general.bio.label,
					hint: $root.lang().profile.general.bio.hint,
				}"
			/>

			<div class="text-h6 my-5">{{ $root.lang().profile.social.title }}</div>
			<v-row class="mb-2">
				<v-col>
					<v-form lazy-validation>
						<v-row v-for="(socialMedia, i) in localUser.media" :key="socialMedia.key">
							<v-col cols="12" sm="3">
								<v-select
									v-model="socialMedia.type"
									:items="mediaTypes"
									:label="$root.lang().profile.social.type.label"
									:rules="mediaTypeRules"
								/>
							</v-col>
							<v-col cols="11" sm="8">
								<v-text-field
									v-model="socialMedia.link"
									clearable
									:placeholder="$root.lang().profile.social.link.placeholder"
									:label="$root.lang().profile.social.link.label"
									:rules="urlRules"
								/>
							</v-col>
							<v-col cols="1">
								<v-btn icon @click="removeSocialMedia(i)">
									<v-icon color="red darken-1">mdi-minus</v-icon>
								</v-btn>
							</v-col>
						</v-row>
						<v-btn block class="my-5" color="secondary" @click="addSocialMedia">
							{{ $root.lang().profile.social.add }}
							<v-icon right>mdi-plus</v-icon>
						</v-btn>
					</v-form>
				</v-col>
			</v-row>

			<div class="d-flex justify-end ma-2">
				<v-btn text color="error darken-1" @click="openDeleteModal">
					{{ $root.lang().profile.delete.btn }}
				</v-btn>
				<v-btn text color="darken-1" :disabled="!canSubmit" @click="send">
					{{ $root.lang().profile.save_changes }}
				</v-btn>
			</div>
		</v-list>

		<user-remove-confirm
			v-model="deleteModalOpened"
			:data="localUser"
			profile
			@close="deleteClosed"
		/>
	</v-container>
</template>

<script>
import axios from "axios";

import UserRemoveConfirm from "../users/user-remove-confirm.vue";
import TabbedTextField from "@components/tabbed-text-field.vue";

const emptySocial = () => ({
	key: crypto.randomUUID(),
	type: "",
	link: "",
});

export default {
	name: "profile-page",
	components: {
		UserRemoveConfirm,
		TabbedTextField,
	},
	data() {
		return {
			localUser: {},
			usernameMinLength: 3,
			usernameMaxLength: 24,
			uuidMaxLength: 36,
			bioMaxLength: 300,
			mediaTypes: settings.socials,
			validationObject: {},
			usernameRules: [
				(u) =>
					this.validate(
						"username:exists",
						u && typeof u === "string" && u.trim().length > this.usernameMinLength,
						this.$root
							.lang()
							.profile.general.username.rules.min.replace("%d", this.usernameMinLength),
					),
				(u) =>
					this.validate(
						"username:length",
						u && u.length <= this.usernameMaxLength,
						this.$root
							.lang()
							.profile.general.username.rules.max.replace("%d", this.usernameMaxLength),
					),
			],
			uuidRules: [
				(u) =>
					this.validate(
						"uuid:length",
						(u && u.length === this.uuidMaxLength) || !u,
						this.$root.lang().profile.general.uuid.rules.length,
					),
			],
			bioRules: [
				(b) =>
					this.validate(
						"bio:length",
						b.length <= this.bioMaxLength,
						this.$root.lang().profile.general.bio.rules.length.replace("%d", this.bioMaxLength),
					),
			],
			urlRules: [
				(u) =>
					this.validate(
						"social:valid",
						this.validURL(u),
						this.$root.lang().profile.social.link.rules.valid,
					),
			],
			mediaTypeRules: [
				(u) =>
					this.validate(
						"social:exists",
						u && typeof u === "string" && u.trim().length > 0,
						this.$root.lang().profile.social.type.rules.exists,
					),
				// this should be impossible under normal circumstances
				(u) =>
					this.validate(
						"social:valid",
						this.mediaTypes.includes(u),
						this.$root.lang().profile.social.type.rules.valid,
					),
			],
			deleteModalOpened: false,
		};
	},
	methods: {
		validURL(str) {
			if (!str || typeof str !== "string") return false;
			return String.urlRegex.test(str);
		},
		addSocialMedia() {
			this.localUser.media ||= [];
			this.localUser.media.push(emptySocial());
		},
		removeSocialMedia(index) {
			this.localUser.media.splice(index, 1);
		},
		validate(scope, value, msg) {
			const nonSocialScopes = ["username:", "uuid:", "bio:"];

			if (nonSocialScopes.some((tag) => scope.startsWith(tag))) {
				// socials are validated separately since there's multiple of them
				this.$set(this.validationObject, scope, value);
			}

			if (value) return true;
			return msg.toString();
		},
		send() {
			if (!this.$root.isLoggedIn) return;

			// fix if new user
			const data = {
				uuid: this.localUser.uuid || "",
				username: this.localUser.username || "",
				bio: this.localUser.bio || "",
				anonymous: this.localUser.anonymous || false,
				media: this.cleanedMedia,
			};

			axios
				.post(`${this.$root.apiURL}/users/profile/`, data, this.$root.apiOptions)
				.then(() => {
					this.$root.showSnackBar(this.$root.lang().global.ends_success, "success");
				})
				.catch((error) => {
					console.error(error);
					this.$root.showSnackBar(error, "error");
				});
		},
		openDeleteModal() {
			this.deleteModalOpened = true;
		},
		deleteClosed(success = false) {
			// user deleted, sign them out and put them on the dashboard
			if (success) {
				this.$router.push({ path: "dashboard" });
				this.$root.logout();
			}
		},
		getUserInfo() {
			if (!this.$root.isLoggedIn) return;

			axios
				.get(`${this.$root.apiURL}/users/profile/`, this.$root.apiOptions)
				.then((res) => {
					this.localUser = res.data;

					// fix if new user or empty user
					this.localUser.uuid ||= "";
					this.localUser.username ||= "";
					this.localUser.bio ||= "";
					this.localUser.media ||= [];
				})
				.catch((err) => {
					console.error(err);
					this.$root.showSnackBar(err, "error");
				});
		},
		update() {
			// prevents issues when deleting account
			this.$nextTick(() => this.getUserInfo());
		},
	},
	computed: {
		cleanedMedia() {
			return (this.localUser.media || [])
				.filter((m) => m.link && m.type)
				.map((m) => {
					delete m.key;
					return m;
				});
		},
		hasUUID() {
			return this.localUser.uuid && this.localUser.uuid.length === this.uuidMaxLength;
		},
		canSubmit() {
			// media handled separately since there's multiple
			if (
				(this.localUser.media || []).some((m) => {
					if (!this.validURL(m.link)) return true;
					if (!this.mediaTypes.includes(m.type)) return true;
					return false;
				})
			)
				return false;
			return Object.values(this.validationObject).every((v) => v === true);
		},
	},
	mounted() {
		this.$root.addAccessTokenListener(this.update);
	},
};
</script>
