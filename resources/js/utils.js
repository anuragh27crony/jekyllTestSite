var build_name=[] ;
var build_history_path= [];
var build_content= [];
var no_of_builds=0;


function get_build_content_data(){
	return build_content;
}

function get_build_name(){
	return build_name;
}

function set_no_last_builds(no_last_builds) {
	no_of_builds=no_last_builds;
}

function createCORSRequest(method, url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		// XHR for Chrome/Firefox/Opera/Safari.
		xhr.open(method, url, true);

	} else if (typeof XDomainRequest != "undefined") {
		// XDomainRequest for IE.
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
		// CORS not supported.
		xhr = null;
	}
	return xhr;
}

function get_url_auth_token(client_id, client_secret, auth_code) {
	var url = 'https://github.com/login/oauth/access_token?client_id='
			+ client_id + '&client_secret=' + client_secret + '&code='
			+ auth_code;
	return url;
}

function fetch_git_auth_token(client_id, client_secret, auth_code) {
	var access_token = null;
	var xhr = createCORSRequest('POST', get_url_auth_token(client_id,
			client_secret, auth_code));
	xhr.setRequestHeader('Accept', 'application/json');
	if (!xhr) {
		throw new Error('CORS not supported');
	}

	xhr.send();

	xhr.onload = function() {
		if (xhr.status == 200) {
			var responseText = xhr.responseText;
			responseJson = JSON.parse(responseText);
			access_token = responseJson.access_token;
			console.log('Extracted auth token is ' + access_token);
			if (access_token != null) {
				console.log(access_token);
				var gh = new GitHub({
					token : access_token
				});

				const
				reportsRepo = gh.getRepo('Teletrax', 'RobotReports');
				var history = reportsRepo.getContents('master',
						'PCD/stats/history', true,
						history_dir_contents_callback);
				history.then(function() {
					for (index in build_name) {
						var buildData = reportsRepo.getContents('master',
								build_history_path[index], true,
								build_contents_callback);
					}

				});
			}
		}
	}
}

function history_dir_contents_callback(error, result, request) {
	if (error == null && request.status == 200) {
		var len = result.length;
		var index = 0;
		for (index = len - 1; index > len - 1 - no_of_builds; index--) {
			build_name.push(result[index].name)
			build_history_path.push(result[index].path)

		}
	} else {
		console.log(error);
		console.log(request);
	}
}

function build_contents_callback(error, result, request) {
	if (error == null && request.status == 200) {
		var len = result.length;
		var index = 0;
		var data = [];

		var requests =[];
		for (i = 0; i < result.length; i++) {
			 (function (i){
				 requests[i] =createCORSRequest('GET', result[i].download_url);
	                requests[i].onload = function () {
	                    if (requests[i].readyState == 4 && requests[i].status == 200) {
	                    	var jsonData=JSON.parse(requests[i].responseText);
	                    	data.push(jsonData);
	                    }
	                };
	                requests[i].send();
	            })(i);
		}
		build_content.push(data);
		if(build_content.length == build_name.length){
			draw_history_graph();
		}
	} else {
		console.log(error);
		console.log(request);
	}
}


function draw_history_graph(){
	var failed_axis_label = [];
	var passed_axis_label  = [];

	// Matrox 2008 Standard
	// Matrox 2008 Web
	// Osprey 2008 Standard
	// Osprey 2008 Web
	// Osprey 2012 Standard

	failed_axis_label.push('Matrox 2008 Standard');
	failed_axis_label.push('Matrox 2008 Web');
	failed_axis_label.push('Osprey 2008 Standard');
	failed_axis_label.push('Osprey 2008 Web');
	failed_axis_label.push('Osprey 2012 Standard');


	var line_label=build_name;
	var line_data= [];
	var len=failed_axis_label.length;
	
	console.log(build_content);

	for (build in build_content){
		line_data[build]= [len].fill(0);
		var build_data=build_content[build];
		for(item in failed_axis_label){
			var search_text=failed_axis_label[item]
			var index= search_json_array(build_data,search_text);
			if(index != -1){
				line_data[build][index]=build_data[index].aggr.pass;
			}
		}
	}
	console.log(line_data);
	console.log(line_label);
}

function search_json_array(json_array,search_text){
	var index=-1;
	var array_data=json_array;
	console.log("Search Text is >> "+search_text);
	for (item in array_data){
		if(array_data[item].env == search_text){
			index = item;
			break;
		}
	}
return index;
}
