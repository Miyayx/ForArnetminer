/**
 * Arnetminer Web Service
 * Arnetminer.org
 * bogao elivoa|gmail.com
 * v1.0 2010-10-23
 * v1.1 2010-11-01
 * 
 * Including sprintf
 */

/**
 * Cross Domain Ajax Support. Basic Support.
 */

// @published This file can't be moved.
function ArnetminerWebServiceClient() {

	/** Basic Config */
	this.imws_basic_config = {
		domain : "aminer.org", // domain used by webservice.
		resource_domain : undefined, // resource domain. Default to domain.
		username : '',
		load_js : [ 'res/js/jquery.min.js', '/res/imws/chain.js' ],
		// load_js : [ 'js/jquery.js', 'js/src/chain-0.2.js' ],
		load_css : [ '/res/imws/css/yui/init-context.css' ],
		load_ext_js : [],
		load_ext_css : [],

		page_fields_select : undefined, // used to set field_select in page
		// level.
		cross_site : true,
		animate : false,
		animate_fadeout : 200,
		animate_fadein : 800,
		debug : false
	};

	this.urlprefix = '/';
	this.resource_urlprefix = '/';

	/** Init WebService */
	this.init = function(overrideConfig) {
		// TODO init Web Service.(log usages window.location.href)

		// merge configs.
		this._config(overrideConfig);

		// process domain
		if (this.imws_basic_config.resource_domain == undefined) {
			this.imws_basic_config.resource_domain = this.imws_basic_config.domain;
		}

		// urlprefix
		if (this.imws_basic_config.cross_site == true) {
			this.urlprefix = [ 'http://', this.imws_basic_config.domain, '/' ].join('');
			this.resource_urlprefix = [ 'http://', this.imws_basic_config.resource_domain, '/' ].join('');
		}

		// Disabled. Should load early.
		this._loadJavascript();
		this._loadStyleSheet();
	};

	// merge configs to basic.
	this._config = function(overrideConfig) {
		// override config
		if (overrideConfig != undefined) {
			for (config in overrideConfig) {
				this.imws_basic_config[config] = overrideConfig[config];
			}
		}

		// override configs
		this.imws_basic_config['animate'] = false;
	};

	// dynamically load javascript
	this._loadJavascript = function() {
		for ( var i = 0; i < this.imws_basic_config.load_js.length; i++) {
			document.write(unescape([ "%3Cscript src='", this.resource_urlprefix, this.imws_basic_config.load_js[i],
					"' type='text/javascript'%3E%3C/script%3E" ].join('')));
		}
		for ( var i = 0; i < this.imws_basic_config.load_ext_js.length; i++) {
			document.write(unescape([ "%3Cscript src='", this.resource_urlprefix,
					this.imws_basic_config.load_ext_js[i], "' type='text/javascript'%3E%3C/script%3E" ].join('')));
		}
	};

	// dynamically load stylesheet
	this._loadStyleSheet = function() {
		for ( var i = 0; i < this.imws_basic_config.load_css.length; i++) {
			document.write(unescape([ "%3Clink href='", this.resource_urlprefix, this.imws_basic_config.load_css[i],
					"' type='text/css' rel='stylesheet' %3E%3C/script%3E" ].join('')));
		}
		for ( var i = 0; i < this.imws_basic_config.load_ext_css.length; i++) {
			document.write(unescape([ "%3Clink href='", this.resource_urlprefix,
					this.imws_basic_config.load_ext_css[i], "' type='text/css' rel='stylesheet' %3E%3C/script%3E" ]
					.join('')));
		}
	};

	/**
	 * Call AJAX By Create a Script TAG.
	 * 
	 * @param {Object}
	 *            url
	 * @param {Object}
	 *            callback
	 * @memberOf {TypeName}
	 */
	this.crossDomainAjax = function(url, callback) {
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		script.onload = script.onreadystatechange = function() {
			if ((!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
				callback && callback();
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				if (head && script.parentNode) {
					head.removeChild(script);
				}
			}
		};
		// Use insertBefore instead of appendChild to circumvent an IE6 bug.
		head.insertBefore(script, head.firstChild);
	};

	/**
	 * 
	 * @param {String}
	 *            containerId
	 * @param {Object}
	 *            render
	 * @param {Object}
	 *            param
	 * @memberOf {TypeName}
	 * @return void
	 */
	this.render = function(containerId, render, param, dataCallback, renderCallback) {
		var divContainer = $('#' + containerId);
		if (divContainer == undefined) {
			if (this.imws_basic_config.debug == true) {
				// alert('div' + containerId + ' not found;');
			}
			return;
		}

		var self = this;
		var renderContext = render();
		var wsconfig = this.imws_basic_config;
		var callback_name = 'cb_' + containerId;

		// Add page level "page_fields_select" config to param
		if (param['fields'] == undefined && wsconfig.page_fields_select != undefined) {
			param['fields'] = wsconfig.page_fields_select;
		}

		// get url
		var wsurl = renderContext.getWebServiceUrl(self.urlprefix, wsconfig.username, callback_name, param);

		/**
		 * Callback Function
		 */
		window[callback_name] = function(data) {
			// call data callback
			if (dataCallback != undefined) {
				dataCallback(data);
			}

			if (renderContext.validateJson != undefined) {
				valid = renderContext.validateJson(data);
			}
			if (!valid) {
				if (wsconfig.debug) {
					alert('[DEBUG]: Data not valid: ' + data);
				}
				return;
			}

			// put prefix into data.
			$(data).each(function(index) {
				data[index]['prefix'] = self.urlprefix;
			});

			// no animation
			if (!wsconfig.animate) {
				self._replaceContent(divContainer, renderContext, data);
				if (renderCallback) {
					renderCallback(data);
				}
				return;
			}

			// animation
			divContainer.fadeOut(wsconfig.animate_fadeout, function() {
				self._replaceContent(divContainer, renderContext, data);
			});
			divContainer.fadeIn(wsconfig.animate_fadein, function() {
				if (renderCallback) {
					renderCallback(data);
				}
			});
		};

		// Finally we call webservice.
		this.crossDomainAjax(wsurl);
	};

	// render a div
	this._replaceContent = function(container, renderContext, data) {
		try {
			container.addClass('yui3-cssreset yui3-cssbase yui3-cssfonts');
			container.addClass(renderContext.imws_style);
			container.html(renderContext.template);
			container.items(data).chain(renderContext.render);
		} catch (e) {
			if (this.imws_basic_config.debug == true) {
				alert(e);
			}
		}
	};

	/**
	 * Sometimes optimize this.
	 * 
	 * @param {Object}
	 *            containerId
	 * @param {Object}
	 *            dataCallback
	 * @param {Object}
	 *            renderCallback
	 * @memberOf {TypeName}
	 * @return {TypeName}
	 */
	this.renderNode = function(containerId, dataCallback, renderCallback) {
		var divContainer = $('#' + containerId);
		if (divContainer == undefined) {
			if (this.imws_basic_config.debug == true) {
				alert('div' + divId + ' not found;');
			}
			return;
		}
		var param = undefined;

		// parse type
		var type = this.__parseAttr(divContainer, "imws:type", true);

		// parse param (can be override)
		// var param = this.__parseAttr(divContainer, "imws:param", true);

		// parse separated param TODO walkthrough all parameters.
		var param = {}
		var imws_ids = divContainer.attr("imws_param:ids");
		if (imws_ids != undefined) {
			param['ids'] = imws_ids;
		}
		var imws_fields = divContainer.attr("imws_param:fields");
		if (imws_fields != undefined) {
			param['fields'] = imws_fields;
		}

		if (param == undefined) {
			if (this.imws_basic_config.debug) {
				alert("'param' not configed. for " + containerId);
			}
			return;
		}

		// call
		this.render(containerId, type, param, dataCallback, renderCallback);
	};

	// What
	this.__parseAttr = function(container, attrName, required) {
		var imws_value = undefined;
		var imws_str = container.attr(attrName);
		try {
			imws_value = eval(imws_str);
		} catch (e) {
			if (this.imws_basic_config.debug) {
				alert("Exception: " + attrName + "=" + imws_str + " not valid." + e);
			}
			return;
		}
		return imws_value;
	};

	/**
	 * @param {Object}
	 *            containerNames
	 */
	this.renderNodesDely = function(nPerTime, containerNames) {
		if (containerNames == undefined || containerNames.length == 0) {
			return;
		}
		if (containerNames.length == 1) {
			this.renderNode(containerNames[0]);
			return;
		}

		// Chain Call
		var self = this;
		var callback = undefined;
		for ( var i = containerNames.length - 1; i >= 0; i--) {
			var func = function() {
				var index = i;
				var containerName = containerNames[index];
				var _callback = callback;
				return function() {
					// do something.
					self.renderNode(containerName, undefined, _callback);
				};
			};
			callback = func();
		}

		callback();
	};
}

/**
 * sprintf() for JavaScript 0.7-beta1
 * http://www.diveintojavascript.com/projects/javascript-sprintf
 * 
 * Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com> All
 * rights reserved.
 */
var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for ( var output = []; multiplier > 0; output[--multiplier] = input) {/*
																				 * do
																				 * nothing
																				 */
		}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			} else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw (sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				} else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				} else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw (sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
				case 'b':
					arg = arg.toString(2);
					break;
				case 'c':
					arg = String.fromCharCode(arg);
					break;
				case 'd':
					arg = parseInt(arg, 10);
					break;
				case 'e':
					arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
					break;
				case 'f':
					arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
					break;
				case 'o':
					arg = arg.toString(8);
					break;
				case 's':
					arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg);
					break;
				case 'u':
					arg = Math.abs(arg);
					break;
				case 'x':
					arg = arg.toString(16);
					break;
				case 'X':
					arg = arg.toString(16).toUpperCase();
					break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+' + arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			} else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			} else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/
					.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							} else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							} else {
								throw ('[sprintf] huh?');
							}
						}
					} else {
						throw ('[sprintf] huh?');
					}
					match[2] = field_list;
				} else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw ('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			} else {
				throw ('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);

};