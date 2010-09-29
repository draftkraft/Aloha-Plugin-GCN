
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Create the Repositorys object. Namespace for Repositories
 * @hide
 */
if ( !GENTICS.Aloha.Repositories ) GENTICS.Aloha.Repositories = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Repositories.gcn = new GENTICS.Aloha.Repository('com.gentics.aloha.repositories.gcn');

/**
 * init Gentics Content.Node repository
 */
GENTICS.Aloha.Repositories.gcn.init = function() {
	var that = this;
	
};

/**
 * Searches a repository for object items matching query if objectTypeFilter.
 * If none found it returns null.
 */
GENTICS.Aloha.Repositories.gcn.query = function(queryString, objectTypeFilter, filter, inFolderId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var that = this;
	callback.call( that, []);
};

/**
 * Returns all tags for username in a tree style way
 */
GENTICS.Aloha.Repositories.gcn.getChildren = function(objectTypeFilter, filter, inFolderId, inTreeId, orderBy, maxItems, skipCount, renditionFilter, callback) {
	var that = this;

	var request = {
		url: 'http://dev42.office:99/data.json',
		type: 'POST',
		body: {node:832},
		success: function(data) {
			var items = [];
			// convert data
			if ( data ) {
				for (var i = 0; i < data.length; ++i) {
					items.push({
						id: data[i].id,
						displayName: data[i].name,
						repositoryId: that.repositoryId,
						objectType: data[i].cls,
						url: data[i].publishDir,
						hasMoreItems: (data[i].subFolders.length > 0)
					});
			    }
			}
			callback.call( that, items);
		}
	};
	
	GENTICS.Aloha.GCN.performRESTRequest(request);
};