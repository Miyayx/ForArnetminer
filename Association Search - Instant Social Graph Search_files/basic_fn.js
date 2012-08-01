/*
 * basic_fn.js
 * # dependence: jquery 1.2.6
 *
 * Copyright (c) 2009 Bo Gao (elivoa@gmail.com)
 *
 * $Date: 2009-06-10 $
 */

/**
 * Trim a String
 */
function trim(s) {
	return s.replace(/^\s*/, "").replace(/\s*$/, "");
}

function deeptrim(s) {
	return s.replace(/\s+/g, " ").replace(/^\s*/, "").replace(/\s*$/, "");
}

/**
 * Warp an input box. Show default value if it's value is empty.
 * 
 * @param inputId
 * @param defaultValue
 * @return
 */
function warpDefaultInput(inputId, defaultValue) {
	var inputObj = $('#' + inputId);
	inputObj.focus(function() {
		if (inputObj.val() == defaultValue) {
			inputObj.val("");
		}
	});
	inputObj.blur(function() {
		if (inputObj.val() == "") {
			inputObj.val(defaultValue);
		}
	});
}

/**
 * Generate a statistic bar.
 * 
 * @param inputId
 * @param defaultValue
 * @return
 */
function graphic_bar(totalWidth, value, text) {
	document.write('<div class="left-align-bar" style="width:' + totalWidth + 'px;z-index:auto;">');
	document.write('<div class="text">');
	document.write(text);
	document.write('</div>');
	document.write('<div class="bar" style="width:' + value + 'px;">&nbsp;</div>');
	document.write('</div>');
}
