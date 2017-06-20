import $ from 'jquery';

export function login(username, password) {
	return $.post('/ajax/login', {username, password});
}

export function logout() {
	return $.post('/ajax/logout');
}

export function test() {
	return $.get('/test');
}
