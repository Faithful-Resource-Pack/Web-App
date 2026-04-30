<template>
	<v-form lazy-validation>
		<v-row
			v-for="(socialMedia, i) in localUser.media"
			:key="socialMedia.key"
			class="align-baseline"
		>
			<v-col cols="12" sm="3">
				<v-select
					v-model="socialMedia.type"
					:items="mediaTypes"
					:label="$root.lang().profile.social.type.label"
					:rules="mediaTypeRules"
				/>
			</v-col>
			<v-col cols="12" sm="9">
				<v-row class="align-baseline" dense>
					<v-col>
						<v-text-field
							v-model="socialMedia.link"
							clearable
							:placeholder="$root.lang().profile.social.link.placeholder"
							:label="$root.lang().profile.social.link.label"
							:rules="urlRules"
						/>
					</v-col>
					<v-col class="flex-grow-0 flex-shrink-0">
						<v-btn icon @click="removeSocialMedia(i)">
							<v-icon color="red lighten-1">mdi-minus</v-icon>
						</v-btn>
					</v-col>
				</v-row>
			</v-col>
		</v-row>
		<v-btn block color="secondary" @click="addSocialMedia">
			<v-icon left>mdi-plus</v-icon>
			{{ $root.lang().profile.social.add }}
		</v-btn>
	</v-form>
</template>

<script>
const emptySocial = () => ({
	key: crypto.randomUUID(),
	type: "",
	link: "",
});

export default {
	name: "social-section",
	props: {
		value: {
			type: Object,
			required: true,
		},
		validate: {
			type: Function,
			required: true,
		},
	},
	emits: ["input"],
	data() {
		return {
			localUser: {},
			mediaTypes: settings.socials,
			urlRules: [
				(u) =>
					this.validate(
						"social:valid",
						String.urlRegex.test(u),
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
		};
	},
	methods: {
		addSocialMedia() {
			this.localUser.media ||= [];
			this.localUser.media.push(emptySocial());
		},
		removeSocialMedia(index) {
			this.localUser.media.splice(index, 1);
		},
	},
	watch: {
		value(newValue) {
			this.localUser = newValue;
		},
		localUser(newValue) {
			this.$emit("input", newValue);
		},
	},
};
</script>
