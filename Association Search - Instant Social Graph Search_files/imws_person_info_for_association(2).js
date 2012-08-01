/**
 * render implements. Special for AssociationSearch, select na person.
 */
function PersonInfo() {
	var name = 'person info';
}

// Test pass
PersonInfo.NASelect = function() {

	var renderContext = {
		imws_style : 'imws_person_info_naselect',
		template : [
				'<table border="0" class="item"><tr>',
				'<td class="img" rowspan="3"><img class="PictureUrl" width="50px" /></td>',
				'<td class="name_block"></td>',
				'</tr>',
				'<tr><td class="right_info"><span class="profile_info"></span></td></tr>',
				'<tr><td><span class="statistic"></span></td></tr>', '</table>' ]
				.join(''),
		fields_used : 'id,name,homepage,position,affiliation,pictureUrl',
		fields_select : ':-alias,-phone,-fax,-email,-address,-university'
	};

	// functions
	renderContext.getWebServiceUrl = function(prefix, username, callback_name,
			param) {

		var person_param = '';
		if (param['id'] != undefined) {
			person_param = param['id'];
		} else if (param['ids'] != undefined) {
			person_param = param['ids'];
		}

		var fields = renderContext.fields_select;
		if (param['fields'] != undefined) {
			fields = param['fields'];
		}

		var url_meta = [ prefix, 'services/person/', person_param ];
		url_meta.push('?u=', username);
		url_meta.push('&o=tfff&output=js');
		url_meta.push('&callback=', callback_name);
		url_meta.push('&fields=', fields);
		return url_meta.join('');
	};

	renderContext.render = {
		'.name_block' : function(data, el) {
			var array = new Array();
			// name
			//safeTrim(str).replaceAll("[^\\w]+", " ").trim().replaceAll("\\s+", " ").replaceAll(" ", "-").trim()
			var translateName = data.Name.trim().replace(/[^\w]+/g, " ").trim().replace(/\s+/g, " ").replace(/ /g, "-").trim(); 
			array.push(sprintf('<a href="%sperson/%s-%s.html">%s</a> ',
					data.prefix, translateName, data.Id, data.Name));
			// Homepage logo
			if (data['Homepage']) {
				array
						.push(sprintf(
								'<a href="%s"><img src="%simages/homepage.jpg" width="16" /></a> ',
								data.Homepage, data.prefix))
				// SocialNetwork logo.
				array.push(sprintf('<a href="%sperson/%s-%s.html#sn">',
						data.prefix, translateName, data.Id));
				array
						.push(sprintf(
								'<img src="%simages/social.gif" alt="social network" width="16" /></a>',
								data.prefix));
			}

			return array.join('');
		},
		'.img' : function(data, el) {
			if (data['PictureUrl']) {
				var arr = new Array();
				arr
						.push(sprintf(
								'<img class="PictureUrl" src="%s" width="50px" title="%s"/>',
								data.PictureUrl, data.PictureUrl));
				return arr.join('');
			}
		},
		'.profile_info' : function(data, el) {
			var arr = new Array();
			if (data['Position']) {
				arr.push(data.Position);
			}
			if (data['Email']) {
				var emailStr = new Array();
				emailStr.push('<a href="mailto:', data.Email,
						'" class="mail JSnocheck" title="', data.Email, '">',
						data.Email, '</a>');
				arr.push(emailStr.join(''));
			}

			return arr.join('<br />');
		},
		'.statistic' : function(data, el) {
			if (data['Affiliation']) {
				return data.Affiliation;
			}
		}
	};

	// not used / backup
	renderContext.render_backup = {
		'.name_block' : function(data, el) {
			var nameb = new Array();
			nameb.push('<a href="{prefix}person/1-{Id}.html">{Name}</a> ');
			if (data['Homepage']) {
				nameb
						.push('<a href="{Homepage}"><img alt="homepage" src="{prefix}images/homepage.jpg" width="16" /></a> ');
			}
			nameb
					.push('<a href="{prefix}person/1-{Id}.html#sn"><img src="{prefix}images/social.gif" alt="social network" width="16" /></a>');
			return nameb.join('');
		},
		'.img' : function(data, el) {
			if (data['PictureUrl']) {
				return [ '<a href="{prefix}person/1-{Id}.html">',
						'<img class="PictureUrl" src="{PictureUrl}" width="50px" /></a>' ]
						.join('')
			}
		},
		'.profile_info' : function(data, el) {
			if (data['Position']) {
				return '{Position}';
			}
		},
		'.statistic' : function(data, el) {
			if (data['Affiliation']) {
				return '{Affiliation}';
			}
		}
	};

	renderContext.validateJson = function(data) {
		if (data != undefined) {
			if (data.Id != undefined && data.Id >= 0) {
				return true;
			}
			if (data.length > 0 && data[0].Id != undefined && data[0].Id >= 0) {
				return true;
			}
		}
		return false;
	}

	return renderContext;
}
