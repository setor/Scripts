// ==UserScript==
// @name          photosight_infscroll
// @description   Бесконечный скроллинг на сайте photosight.ru
// @author        Sergei Kuznetsov
// @version       1.5
// @namespace     net.setor.photosignt
// @include       http://www.photosight.ru/*
// ==/UserScript==

var scrollerTask = function () {

	var GRID_SELECTOR     = '.photolist';
	var PAGER_SELECTOR    = '.pages.width720.mb20';
	var NEXTPAGE_SELECTOR = PAGER_SELECTOR + ' .fr.ar a';

	var DEBUG_MODE = false;
	var version    = '1.2';

	var stop     = false;
	var pause    = false;
	var _window  = null;
	var _jQuery  = null;

	var log = function(msg) {
		if (DEBUG_MODE) {
			console.log('Photosight: ' + msg);
		}
	};

	var hasPhotoGrid = function() {
		return ( _jQuery(PAGER_SELECTOR).size() > 0 );
	};

	var scrollPhotoGrid = function() {

		if (stop) {
			log('stop');
			return;
		}
		else if (pause) {
			log('pause');
			return;
		}

		// Предотвращаем запуск данной ф-ции несколько раз единовременно
		pause = true;

		// Если осталась только ссылка "предыдущая"
		if ('Предыдущая' == _jQuery(NEXTPAGE_SELECTOR).text()) {
			stop = true;
			return false;
		}

		var nextPage = _jQuery(NEXTPAGE_SELECTOR).attr('href');

		if (!nextPage) {
			log('pager not found');
			stop = true;
			return;
		}

		log('pager found: ' + nextPage);

		_jQuery.get(nextPage, function (data) {

			_window.history.replaceState(nextPage, document.title, nextPage);

			var jData    = _jQuery(data);
			var dataGrid = jData.find(GRID_SELECTOR);

			// Дополняем текущий список новыми фотками
			_jQuery(GRID_SELECTOR).append(dataGrid.html());

			addGridEvents(_jQuery(GRID_SELECTOR));

			// Заменяем старый пагинатор новым
			_jQuery(PAGER_SELECTOR).html(jData.find(PAGER_SELECTOR).html());

			log('ok');

			pause = false;
		});
	};

	var addGridEvents = function(grid) {

		// Открывать все фотки в новом окне
		grid.find('a').attr('target', '_blank');
		grid.find('.oldpr').click(function() {
			_jQuery(this).find('img:first').addClass('clicked');
		});
	};

	var initialize = function() {

		if (typeof unsafeWindow != 'undefined') {
			// firefox
			_window = unsafeWindow;
		}
		else {
			// google chrome
			_window = window;
		}

		_jQuery = _window.jQuery;

		// не запускаем скрипт во фреймах
		if (_window.self != _window.top){
			log('Error: photosight in frame');
			return;
		}
		else if (!hasPhotoGrid()) {
			log('Error: photosight pager not found');
			return;
		}

		_jQuery('head').append('<style type="text/css">.clicked {border: 2px solid red !important;}</style>');
		addGridEvents(_jQuery(GRID_SELECTOR));

		_jQuery(document).scroll(function () {
			var scrollMaxY = document.documentElement.scrollHeight - document.documentElement.clientHeight;

			// Start loading approx 650 from the end of the page.
			if (window.scrollY > scrollMaxY - 650) {
				scrollPhotoGrid();
			}
		});
	};

	log('photosight infinite scroll v' + version );

	initialize();
};

if (navigator.userAgent.match(/Firefox/)) {
	unsafeWindow.onload = scrollerTask;
}
else if (navigator.userAgent.match(/Chrome/)) {
	var script = document.createElement("script");
	script.textContent = "(" + scrollerTask.toString() + ")();";
	document.body.appendChild(script);
}
else {
	alert("I do not know what to do :(");
}