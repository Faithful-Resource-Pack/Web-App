<template>
	<v-container>
		<h4 class="text-h4 py-4">
			<v-btn large icon class="ml-2" to="/posts/list">
				<v-icon large>mdi-chevron-left</v-icon>
			</v-btn>
			{{ $root.lang().posts.titles.edit }}
			<span class="font-weight-light text--secondary">#{{ id }}</span>
		</h4>
		<post-form v-model="post" :loading="loading" />
	</v-container>
</template>

<script>
import axios from "axios";
import PostForm from "./form/index.vue";

export default {
	name: "edit-post",
	components: {
		PostForm,
	},
	data() {
		return {
			loading: true,
			post: {},
		};
	},
	computed: {
		id() {
			return this.$route.params.id;
		},
	},
	created() {
		axios
			.get(`${this.$root.apiURL}/posts/${this.id}`, this.$root.apiOptions)
			.then((res) => {
				this.post = res.data;
				// set default values for optional fields
				this.post.discontinued ||= false;
			})
			.catch((err) => {
				console.error(err);
				this.$root.showSnackBar(err, "error");
			})
			.finally(() => {
				this.loading = false;
			});
	},
};
</script>
