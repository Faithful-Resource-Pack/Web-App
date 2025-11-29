import axios from "axios";

// pages used in sidebar
import DashboardPage from "../pages/dashboard/index.vue";
import ProfilePage from "../pages/profile/index.vue";
import GalleryPage from "../pages/gallery/index.vue";
import AddonSubmissionsPage from "../pages/addon/addon-submissions.vue";
import NewAddonPage from "../pages/addon/new-addon-form.vue";
import EditAddonPage from "../pages/addon/edit-addon-form.vue";
import ReviewAddonsPage from "../pages/addon/review/index.vue";
import PostListPage from "../pages/post/post-grid.vue";
import EditPostPage from "../pages/post/edit-post.vue";
import NewPostPage from "../pages/post/new-post.vue";
import ContributionPage from "../pages/contribution/index.vue";
import UsersPage from "../pages/users/index.vue";
import TexturePage from "../pages/texture/index.vue";
import PackPage from "../pages/pack/index.vue";
import SettingsPage from "../pages/settings/index.vue";

/** @type {import("../resources/types.d.ts").SidebarTab[]} */
export default [
	{
		id: "general",
		subtabs: [
			{
				id: "dashboard",
				icon: "mdi-view-dashboard",
				public: true,
				// no name for dashboard (default page)
				routes: [{ path: "/dashboard", component: DashboardPage }],
			},
			{
				id: "profile",
				icon: "mdi-account",
				routes: [{ path: "/profile", component: ProfilePage, name: "Profile" }],
			},
			{
				id: "gallery",
				icon: "mdi-image-multiple",
				public: true,
				// note: first route will be matched by the sidebar
				routes: [
					{
						path: "/gallery",
						redirect: "/gallery/java/default/latest/all/",
					},
					{
						path: "/gallery/:edition/:pack/:version/:tag/:search*",
						component: GalleryPage,
						name: "Gallery",
					},
				],
			},
		],
	},
	{
		id: "addons",
		subtabs: [
			{
				id: "upload",
				icon: "mdi-plus-thick",
				routes: [
					{ path: "/addons/new", component: NewAddonPage, name: "New Add-on" },
					{ path: "/addons/edit/:id", component: EditAddonPage, name: "Edit Add-on" },
				],
			},
			{
				id: "submissions",
				icon: "mdi-plus-box-multiple",
				routes: [
					{
						path: "/addons/submissions",
						component: AddonSubmissionsPage,
						name: "Add-on Submissions",
					},
				],
			},
			{
				id: "review",
				roles: ["Administrator"],
				icon: "mdi-puzzle",
				badge: (app) =>
					axios.get(`${app.apiURL}/addons/pending`, app.apiOptions).then((r) => r.data.length || 0),
				routes: [
					{ path: "/addons/review", component: ReviewAddonsPage, name: "Add-on Review" },
					// legacy compatibility
					{ path: "/review/addons", redirect: "/addons/review" },
				],
			},
		],
	},
	{
		id: "posts",
		roles: ["Administrator"],
		subtabs: [
			{
				id: "list",
				icon: "mdi-format-list-bulleted-square",
				routes: [
					{
						path: "/posts/list",
						component: PostListPage,
						name: "All posts",
					},
				],
			},
			{
				id: "create",
				icon: "mdi-post",
				routes: [
					{
						path: "/posts/new",
						component: NewPostPage,
						name: "New post",
					},
					{
						path: "/posts/edit/:id",
						component: EditPostPage,
						name: "Edit post",
					},
				],
			},
		],
	},
	{
		id: "database",
		roles: ["Developer", "Administrator"],
		subtabs: [
			{
				id: "contributions",
				icon: "mdi-file-multiple",
				routes: [{ path: "/contributions", component: ContributionPage, name: "Contributions" }],
			},
			{
				id: "users",
				icon: "mdi-account-multiple",
				routes: [
					{ path: "/users", redirect: "/users/all" },
					{ path: "/users/:role?/:name*", component: UsersPage, name: "Users" },
				],
			},
			{
				id: "textures",
				icon: "mdi-texture",
				routes: [
					{ path: "/textures", redirect: "/textures/all" },
					{ path: "/textures/:tag?/:name*", component: TexturePage, name: "Textures" },
				],
			},
			{
				id: "packs",
				icon: "mdi-cube",
				routes: [
					{ path: "/packs", redirect: "/packs/all" },
					{ path: "/packs/:tag?/", component: PackPage, name: "Packs" },
				],
			},
			{
				id: "settings",
				icon: "mdi-cog",
				routes: [{ path: "/settings", component: SettingsPage, name: "Settings" }],
			},
		],
	},
];
