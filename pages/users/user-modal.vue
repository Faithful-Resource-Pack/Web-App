<template>
	<modal-form
		v-model="modalOpened"
		max-width="800"
		:title="modalTitle"
		@close="$emit('close')"
		@submit="send"
	>
		<v-row>
			<v-col cols="12" sm="9">
				<v-form ref="form" lazy-validation>
					<v-text-field
						v-model="formData.id"
						:color="color"
						required
						:disabled="!add"
						:label="$root.lang().database.users.modal.id"
					/>
					<v-text-field
						v-model="formData.username"
						:color="color"
						required
						clearable
						:label="$root.lang().database.users.modal.username"
					/>
					<v-text-field
						v-model="formData.uuid"
						:color="color"
						clearable
						:label="$root.lang().database.users.modal.uuid"
					/>
					<v-select
						v-model="formData.roles"
						:color="color"
						:item-color="color"
						required
						multiple
						small-chips
						deletable-chips
						:items="roles"
						:label="$root.lang().database.users.modal.roles"
					/>
					<v-checkbox
						v-model="formData.anonymous"
						class="extended-checkbox"
						:color="color"
						required
						clearable
					>
						<template #label>
							<p class="text--primary mb-2">
								{{ $root.lang().database.users.modal.anonymous }}
							</p>
							<p>{{ $root.lang().profile.general.anonymous.hint }}</p>
						</template>
					</v-checkbox>
				</v-form>
			</v-col>
			<v-col v-if="formData.uuid && $vuetify.breakpoint.smAndUp" cols="3">
				<img
					:src="`https://vzge.me/full/256/${formData.uuid}`"
					alt="Minecraft skin"
					style="width: 100%; max-width: 250"
				/>
			</v-col>
		</v-row>
	</modal-form>
</template>

<script>
import axios from "axios";

import ModalForm from "@layouts/modal-form.vue";

export default {
	name: "user-modal",
	components: {
		ModalForm,
	},
	props: {
		value: {
			type: Boolean,
			required: true,
		},
		add: {
			type: Boolean,
			required: false,
			default: false,
		},
		data: {
			type: Object,
			required: false,
			default: () => ({}),
		},
		roles: {
			type: Array,
			required: true,
		},
		color: {
			type: String,
			required: false,
			default: "primary",
		},
	},
	data() {
		return {
			modalOpened: false,
			formData: {
				username: "",
				roles: [],
				uuid: "",
				anonymous: false,
				id: "",
			},
			default: {
				username: "",
				roles: [],
				uuid: "",
				anonymous: false,
			},
		};
	},
	computed: {
		modalTitle() {
			return this.add
				? this.$root.lang().database.users.modal.add_user
				: this.$root.lang().database.users.modal.change_user;
		},
	},
	methods: {
		send() {
			const data = this.formData;
			const id = data.id;

			delete data.id; // excess property and therefore is not allowed
			delete data.media; // excess property and therefore is not allowed

			Object.keys(data).forEach((k) => (data[k] = data[k] === null ? this.default[k] : data[k]));

			axios
				.post(`${this.$root.apiURL}/users/${id}`, data, this.$root.apiOptions)
				.then(() => {
					this.$root.showSnackBar(this.$root.lang().global.ends_success, "success");
					this.$emit("close", true);
				})
				.catch((error) => {
					console.error(error);
					this.$root.showSnackBar(err, "error");
				});
		},
	},
	watch: {
		value(newValue) {
			this.modalOpened = newValue;
		},
		modalOpened(newValue) {
			this.$nextTick(() => {
				if (this.add)
					this.formData = {
						id: "",
						username: "",
						roles: [],
						uuid: "",
						anonymous: false,
					};
				else
					Object.keys(this.data).forEach((key) => {
						this.formData[key] = this.data[key];
					});
			});
			this.$emit("input", newValue);
		},
	},
};
</script>
