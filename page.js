/**
 * Create the resource object & check for resource namespace
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};
GENTICS.Aloha.Repositories.Page = new GENTICS.Aloha.Repository('com.gentics.aloha.GCN.Page');

/**
 * Initialize the repository
 */
GENTICS.Aloha.Repositories.Page.init = function () {
	// set a template for rendering objects
	this.setTemplate('<span><b>{name}</b><br/>{path}</span>');
};

/**
 * Searches a resource for resource items matching query if objectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.Page.query = function( p, callback) {
	// check whether a magiclinkconstruct exists. If not, just do nothing, since setting GCN links is not supported
	if (!GENTICS.Aloha.GCN.settings.magiclinkconstruct) {
		callback.call(that);
	}
	var that = this;
	var params = {
		'query' : p.queryString,
		'links' : GENTICS.Aloha.GCN.settings.links
	};
	if (p.maxItems) {
		params['maxItems'] = p.maxItems;
	}
	// TODO handle errors
	GENTICS.Aloha.GCN.performRESTRequest({
		'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/folder/findPages',
		'params' : params,
		'success' : function(data) {
			for (var i = 0; i < data.pages.length; ++i) {
				data.pages[i] = that.getDocument(data.pages[i]);
			}
			callback.call(that, data.pages);
		},
		'type' : 'GET'
 	});
};

/**
 * Get the repositoryItem with given id
 * @param itemId {String} id of the repository item to fetch
 * @param callback {function} callback function
 * @return {GENTICS.Aloha.Repository.Object} item with given id
 */
GENTICS.Aloha.Repositories.Page.getObjectById = function (itemId, callback) {
	var that = this;

	if (itemId.match(/^10007./)) {
		itemId = itemId.substr(6);
	}
	GENTICS.Aloha.GCN.performRESTRequest({
		'url' : GENTICS.Aloha.GCN.settings.stag_prefix + GENTICS.Aloha.GCN.restUrl + '/page/load/' + itemId,
		'success' : function(data) {
			if (data.page) {
				callback.call(that, [that.getDocument(data.page)]);
			}
		},
		'type' : 'GET'
	});
};

/**
 * Transform the given data (fetched from the backend) into a repository item
 * @param {Object} data data of a page fetched from the backend
 * @return {GENTICS.Aloha.Repository.Object} repository item
 */
GENTICS.Aloha.Repositories.Page.getDocument = function(data) {
	if (!data) {
		return null;
	}

	// set the id
	data.id = "10007." + data.id;

	// make the path information shorter by replacing path parts in the middle with ...
	var path = data.path;
	var pathLimit = 55;

	if (path && (path.length > pathLimit)) {
		path = path.substr(0, pathLimit/2) + '...' + path.substr(path.length - pathLimit/2);
	}

	data.path = path;

	// TODO make this more efficient (don't make a single call for every url)
	if (data.url && GENTICS.Aloha.GCN.settings.renderBlockContentURL) {
		data.url = GENTICS.Aloha.GCN.renderBlockContent(data.url);
	}
	data.repositoryId = 'com.gentics.aloha.GCN.Page';
	return new GENTICS.Aloha.Repository.Document(data);
};
