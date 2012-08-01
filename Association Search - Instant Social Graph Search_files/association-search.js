/*
 * Depends on: jquery, jquery-ui
 */

/**
 * Global vars
 */
var ass_page_context = {
	old_ajaxrequest : undefined,
	old_query : undefined,
	old_path_ajaxrequest : undefined,
	old_path_timer : undefined
}

/**
 * OnLoad
 */
$(document).ready(function() {
	$('#sn-search-box').focus();
	if ($.trim($('#sn-search-box').val()) == '') {
		$('#cover').show();
		$('#sn_h').hide();
		//		$('#sn_h').css('visibility', 'visible');
		//$('#ass_paths').css('visibility', 'visible');
		//		$('#sn_h').css('visibility') == 'visible';
	} else {
		appear();
	}

	var eventObj = $("#sn-search-box");
	enableSocialNetworkSuggest("sn-search-box", 300);
	/* first time to call render flash.*/
	actionEvent(eventObj, eventObj.val());

	$(window).resize(function() {
		$('#sn_h').css('border', 'solid 0px red');
	});
});

function appear() {
	if ($('#cover').css('display', 'block')) {
		$('#cover').hide();
	}
	$('#sn_h').show();
	//	if ($('#sn_h').css('visibility') == 'hidden') {
	//		alert('appear');
	//		$('#cover').hide();
	//		$('#sn_h').css('visibility', 'visible');
	//		$('#ass_paths').css('visibility', 'visible');
	//	}
}

$(window).unload(function() {
	$.ajax( {
		url : 'association.do',
		data : {
			m : 'leavePage'
		}
	});
})

/*
 * Enable Search Box
 */
function enableSocialNetworkSuggest(keyId, dely) {
	var eventObj = $("#" + keyId);
	eventObj.keyup(function(event) {
		var keyc;
		if (window.event) {
			keyc = event.keyCode;
		} else if (event.which) {
			keyc = event.which;
		}
		if (keyc !== 27 && keyc != 40 && keyc != 38 && keyc != 13) {
			var query1 = eventObj.val();
			setTimeout(function() {
				var query2 = trim(eventObj.val());
				if (query2 === query1) {
					if (query2 !== "" && query2 !== null) {
						if (ass_page_context.old_query == undefined
								|| ass_page_context.old_query !== query2) {
							ass_page_context.old_query = query2;
							actionEvent(eventObj, query2);
						}
					}
				}
			}, dely);
		}
	});
}

/*
 * On query change.(really need resent ajax)
 */
function actionEvent(eventObj, query) {
	var date = new Date().getTime();
	// refresh page
	if (ass_page_context.old_ajaxrequest != undefined
			&& ass_page_context.old_ajaxrequest !== null) {
		ass_page_context.old_ajaxrequest.abort();
	}
	ass_page_context.old_ajaxrequest = $.ajax( {
		url : '/association-candidates',
		data : {
			time : date,
			selected_ids : '' + window['ass_na_naids'],
			query : query
		},
		success : function(data) {
			if (data == undefined || trim(data) == '') {
				$('#msg_final_persons').html(' No Person Found! ');
				$('#ass_candidates').html('');
				return;
			}

			appear();

			$('#msg_final_persons').html('');
			var finalNaids = data.split(',');
			renderPersonList(finalNaids);

			refreshGraph(query, finalNaids);

			/* delay call get path.*/
			if (false) {
				var delay_path = 5000;
				if (ass_page_context.old_path_timer != undefined) {
					clearTimeout(ass_page_context.old_path_timer);
				}
				ass_page_context.old_path_timer = setTimeout(function() {
					refreshPaths(finalNaids);
				}, delay_path);
			}
		}
	});
}

function trigerPath() {
	if (ass_page_context.old_path_timer != undefined) {
		clearTimeout(ass_page_context.old_path_timer);
	}
	ass_page_context.old_path_timer = setTimeout(function() {
		refreshPaths(window['ass_na_naids']);
	}, 1);
}

/*
 * Refresh SocialGraph using query and naids. Auto select
 */
function refreshGraph(query, naids) {
	// if remember na select, this must be done here.
	var date = new Date().getTime();
	// refresh flash
	var asg = undefined;
	if (navigator.appName.indexOf("Microsoft") != -1) {
		asg = window["graphsearch2"]
		// asg = window[].getElementById("graphsearch");
	} else {
		asg = document.getElementById("graphsearch");
		//asg = document["graphsearch"]
	}

	var url = "/association-RelationJson/?time=" + date + "&query=" + query;
	if (naids != null && naids != undefined) {
		var naidstr = naids.join(',')
		url += "&naids=" + naidstr;
		url += "&expand=" + naidstr;
	}
	try {
		asg.sendRequest(url);
	} catch (err) {
	}
}

function refreshPaths(finalNaids) {
	var pdivMsg = $('#ass_old_paths_msg');
	var pdiv = $('#ass_old_paths');
	if (finalNaids.length >= 2) {
		pdivMsg.html("Loading...");
		pdiv.html("");
		var url = "/association-paths/?first=" + finalNaids[0]
				+ ":&second=" + finalNaids[1] + ":"
		pdiv.load(url, function() {
			pdivMsg.html("");
		});
	} else {
		pdiv.html("Not available!");
	}
}

function renderPersonList(naids) {
	var personArea = $('#ass_candidates');
	if (personArea != undefined) {
		personArea.attr('imws_param:ids', naids.join(','));
		wsClient.renderNode('ass_candidates', undefined, function() {
			window['ass_na_naids'] = naids;
			personArea.find('>table').each(function(i, val) {
				try {
					$(val).attr('naid', naids[i]);					
					$(val).attr('index', i);
					$(val).click(function() {
						openNASelector(val, naids[i], i)
					})
				} catch (err) {
				}
			});
		});
	}
}

function openNASelector(node, naid, index) {

	/* get name */
	var name = $(node).find('.name_block a').html();

	// create dialog if not exist.
	var na_dialog = $('#na_dialog');
	if (na_dialog.length == 0) {
		na_dialog = $("<div id='na_dialog' title='Select which \"" + name
				+ "\" you want to link:	' style='height: auto'><p></p></div>");
		$("body").append(na_dialog);
	} else {
		var title = $('#ui-dialog-title-na_dialog');
		title.html('Select which \"' + name + '\" you want to link:	');
		//na_dialog.style.height = "auto";
		//na_dialog.attr("style", "height: auto; width: auto");		
	}

	na_dialog.html('Loading...');
	na_dialog.dialog( {
		modal : true,
		width : 980,
		draggable : true,
		buttons : {
			"Select" : function() {
				$(this).dialog("close");
				/* refresh */
				var naids = window['ass_na_naids']
				renderPersonList(naids);
				refreshGraph($('#sn-search-box').val(), naids)
			},
			"Cancel" : function() {
				$(this).dialog("close");
			}
		}
	});
	
	//na_dialog.load('/association-na_scroller.jsp?naid=' + naid + '&index='
	//		+ index);
	na_dialog.load('/association-na_scroller?naid=' + naid + '&index='
			+ index);
	na_dialog.dialog();
}

function na_scholar_select(obj, naid, index) {
	$('.na_person').removeClass('selected');
	$(obj).addClass('selected');
	if (index >= 0 && window['ass_na_naids'] != undefined) {
		window['ass_na_naids'][index] = naid;
	}
}

/**
 * Trim a String
 */
function trim(s) {
	return s.replace(/^\s*/, "").replace(/\s*$/, "");
}
