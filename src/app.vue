<template>
<div class="app-component">
	<div class="menu">
		<h1>App</h1>
		<ul>
			<li v-if="loggedIn">User: {{userID}}</li>
			<li v-else>
				<div class="login-form">
					<table>
						<tr>
							<td><input ref="usernameInput" type="text"/></td>
							<td><label>Username</label></td>
						</tr>
						<tr>
							<td><input ref="passwordInput" type="password"/></td>
							<td><label>Password</label></td>
						</tr>
						<tr>
							<td><button @click="logIn()">Log in</button></td>
						</tr>
					</table>
				</div>
			</li>
			<li><button @click="test()">Test</button></li>
			<li v-if="loggedIn"><button @click="logOut()">Log out</button></li>
			<li><button @click="exitServer()">Exit server</button></li>
		</ul>
	</div><!-- /class="menu" -->
</div>
</template>

<script>
import $ from 'jquery';
import {login, logout, test} from './session-ajax.js';

export default {
	data() {
		return {
			userID: null,
		};
	},
	computed: {
		loggedIn() {
			return !!this.userID;
		},
	},
	mounted() {
		test().then(response => {
			this.userID = /(\d+)/.exec(response)[1]; // "User ID: 1"
		}).catch(() => {
			// Not logged in
		});
	},
	methods: {
		exitServer() {
			$.post('/exit');
		},
		logIn() {
			let username = $(this.$refs.usernameInput).val();
			let password = $(this.$refs.passwordInput).val();
			login(username, password).then(response => {
				this.userID = parseInt(response, 10);
			}).catch(err => {
				window.alert('Login failed: ' + err.status);
			});
		},
		logOut() {
			logout().always(() => {
				this.userID = null;
			});
		},
		test() {
			test().then(response => {
				window.alert(response);
			}).catch(err => {
				window.alert(err.status);
			});
		},
	},
};
</script>

<style lang="scss">
.app-component {
	>.menu {
		.login-form {
			display: inline-block;
			border: thick solid green;
			padding: 1ex;
			td {
				margin: 1ex;
			}
			input {
				width: 100%;
				max-width: 300px;
			}
			label {
				margin-left: 1em;
			}
		} // .login-form
	} // >.menu
}
</style>
