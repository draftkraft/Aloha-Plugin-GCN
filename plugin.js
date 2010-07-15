/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * create and register the GCN plugin
 */
GENTICS.Aloha.GCN = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.GCN');

/**
 * Configure the available languages
 */
GENTICS.Aloha.GCN.languages = ['en', 'de'];

/**
 * True if Aloha has been maximized in GCN
 */
GENTICS.Aloha.GCN.maximized = false;

/**
 * this stores references to GENTICS.Aloha.ui.Buttons, which are needed to update pressed states etc.
 */
GENTICS.Aloha.GCN.buttons = {};

/**
 * base url for the REST API
 */
GENTICS.Aloha.GCN.restUrl = '/CNPortletapp/rest';

/**
 * Initializes the GCN plugin which creates all editables
 */
GENTICS.Aloha.GCN.init = function () {
	var that = this;

	/**
	 * stores the maximize options which contains the frameset settings from the GCN frameset
	 */
	var maximizeOptions = null;
	
	if (this.isGCNFrame()) {
		// add stylesheet reference for the submenu
		jQuery('head').append('<link type="text/css" href="' +
				this.createGCNURL({
					'url' : that.settings.stag_prefix,
					params : {
					'do' : 20,
					'url' : 'lib/css/gui.css'
				}
				}) +
		'" rel="stylesheet">');
		
		// load the old GCN top menu
		// menu div
		jQuery('body').append('<div style="z-index: 999999; position: absolute; visibility: hidden"' + 
				' class="gentics_submenu" id="nodesubmenu1"> </div>');
		
		// menu js
		jQuery('head').append('<script type="text/javascript" src="' + 
				this.createGCNURL({
					'url' : this.settings.stag_prefix,
					'params' : {
						'do' : 20,
						'url' : 'lib/js/layer.js'
					}
				}) + '"></script>');
		jQuery('head').append('<script type="text/javascript" src="' + 
				this.createGCNURL({
					'url' : this.settings.stag_prefix,
					'params' : {
						'do' : 20,
						'url' : 'lib/js/tools.js'
					}
				}) + '"></script>');
		jQuery('head').append('<script type="text/javascript" src="' + 
				this.createGCNURL({
					'url' : this.settings.stag_prefix,
					'params' : {
						'do' : 20,
						'url' : 'lib/js/menu1.js'
					}
				}) + '"></script>');
	
		// update the top menu
		if (top.menu) {
			top.menu.location = this.createGCNURL({
				'url' : this.settings.stag_prefix,
				'params' : {
					'do' : 14004,
					'MENU_LAYER' : 0,
					'ass_pre_flapped' : 0,
					'aloha' : true
				}
			});
		}
		
		// hide the menu on html/body click
		jQuery('html').click(function () {
			hide_layer(get_layer('nodesubmenu1'));
		});
	}
	
	// Update the frame UI of GCN
	GENTICS.Aloha.GCN.updateFrameUI();
	
	jQuery(window).unload(function(){
		// Restore the frame UI if the page is left
		that.restoreFrameUI();

		// check if something needs top be saved
		for (var i in GENTICS.Aloha.editables) {
			if (GENTICS.Aloha.editables[i].isModified) {
				if (GENTICS.Aloha.editables[i].isModified()) {
					// if an editable has been modified, the user can confirm if he wants the page to be saved
					if (confirm(GENTICS.Aloha.i18n(GENTICS.Aloha, 'confirm_editable_modified'))) {
						that.savePage({silent : true});
						return false;
					}
					return;
				}
			}
		}
	});

	// Activate editables
	this.alohaEditables(this.settings.editables);

	// Make blocks not editable
	this.alohaBlocks(this.settings.blocks);

	// Display welcome messages - simple alerts for testing
	if (this.settings.welcomeMessages) {
		jQuery.each(this.settings.welcomeMessages, function (index, message) {
			alert(message.message);
		});
	}

	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		var editables = 0;
		var blocks = 0;
		
		if (this.settings.editables) {
			editables = this.settings.editables.length;
		}
		if (this.settings.blocks) {
			blocks = this.settings.blocks.length;
		}
		
		GENTICS.Aloha.Log.debug(this, "Loaded page with id { " + this.settings.id + " }.");
		GENTICS.Aloha.Log.debug(this, "Found " + editables + " editables and " + blocks + " blocks.");
	}

	var pageMenu = new Array();

	// menu button for the preview
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.preview'),
		onclick : function() {
			that.previewPage();
		}
	}));

	// menu button for editing
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.edit'),
		onclick : function() {
			that.editPage();
		}
	}));

	// menu button for the live preview
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.livepreview'),
		onclick : function() {
			that.savePage({
				onsuccess : function () {
					that.openGCNURL({
						url : that.settings.stag_prefix,
						popup : true,
						params : {
							live : that.settings.id,
							'do' : 14001
						}
					});
				},
				onfailure : function ()  {
					// TODO error handling
				},
				silent : true
			});
		}
	}));

	// this is a very ugly hack. When opened the editor in wiki mode (outside of
	// the GCN frames), we need to provide a serialized PHP array as back
	// parameter to the call to page properties, so that the dialog will lead us back to the wiki mode
	var propsBackParam = this.isGCNFrame() ? '' : 'a:3:{s:4:"REDO";s:5:"14012";s:6:"realid";s:'+String(this.settings.id).length+':"'+this.settings.id+'";s:4:"real";s:4:"edit";}';

	// menu button for the page properties
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.properties'),
		onclick : function() {
			that.openGCNURL({
				url : that.settings.stag_prefix,
				params : {
					'do' : 14000,
					PAGE_ID : that.settings.id,
					FOLDER_ID : that.settings.folderId,
					back : propsBackParam
				}
			});
		}
	}));

	// menu button for the object properties (only if opened within GCN frames)
//	if (this.isGCNFrame()) {
//		pageMenu.push(new GENTICS.Aloha.ui.Button({
//			label : this.i18n('button.objectproperties'),
//			onclick : function() {
//				that.openGCNURL({
//					url : that.settings.stag_prefix,
//					params : {
//						'do' : 10010,
//						type : 10007,
//						PAGE_ID : that.settings.id,
//						FOLDER_ID : that.settings.folderId
//					}
//				});
//			}
//		}));
//
//		// menu button for the time management (only if opened within GCN frames)
//		pageMenu.push(new GENTICS.Aloha.ui.Button({
//			label : this.i18n('button.timemanagement'),
//			onclick : function() {
//				that.openGCNURL({
//					url : that.settings.stag_prefix,
//					params : {
//						'do' : 14006,
//						PAGE_ID : that.settings.id
//					}
//				});
//			}
//		}));
//	}

	// Add the page button
	var pageButton = new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.page'),
		menu : pageMenu
	});
	
	GENTICS.Aloha.Ribbon.addButton(pageButton);
	
	// Add the language button and menu
	if (this.settings.languageMenu && this.settings.languageMenu.length > 0) {
		// menu for the language button
		var menu = Array();
		jQuery.each(this.settings.languageMenu, function(index, language){
			menu.push(new GENTICS.Aloha.ui.Button({
				label : language.name,
				icon : that.createGCNURL({
					'url' : that.settings.stag_prefix,
					params : {
						'do' : 14203,
						'base' : 'doc_hi.png',
						'lang' : language.code,
						'module' : 'content'
					}
				}),
				onclick : function() {
					that.openGCNURL({
						url : that.settings.stag_prefix,
						params : {
							'do' : 14015,
							't_type' : 10007,
							'redo' : 14001,
							'CONTENTGROUP_ID' : language.id
						}
					});
				}
			}));
		});
	
		// add the language button
		GENTICS.Aloha.Ribbon.addButton(new GENTICS.Aloha.ui.Button({
			label : this.i18n('button.language'),
			menu : menu
		}));
	}

	// parameters to the 'publish' url depend on whether we are in the GCN frame or in wiki mode
	var publishParams = this.isGCNFrame() ? {'do' : 14003, 'cmd' : 'pub'} : {'do' : 14012, 'realid' : this.settings.id, 'real' : 'pub'};
	var publishAtParams = this.isGCNFrame() ? {'do' : 14021} : {'do' : 14021, 'PAGE_ID' : this.settings.id, 'FOLDER_ID' : this.settings.folderId, 'back' : propsBackParam};

	var saveButtonMenu = Array();
	saveButtonMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.publish'),
		onclick : function() {
			that.openGCNURL({
				url : that.settings.stag_prefix,
				params : publishParams
			});
		}
	}));

	if (this.isGCNFrame()) {
		saveButtonMenu.push(new GENTICS.Aloha.ui.Button({
			label : this.i18n('button.publishat'),
			onclick : function() {
				that.openGCNURL({
					url : that.settings.stag_prefix,
					params : publishAtParams
				});
			}
		}));
	}

	// add the Save Button
	var saveButton = new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.save'),
		onclick : function() {
			that.savePage();
		},
		menu : saveButtonMenu
	});
	GENTICS.Aloha.Ribbon.addButton(saveButton);

	// add the Cancel button
	if (GENTICS.Aloha.settings.readonly) {
		GENTICS.Aloha.Ribbon.addButton(
			new GENTICS.Aloha.ui.Button({
				label : this.i18n('button.quit'),
				onclick : function() {
					that.quitEdit();
				}
			})
		);
	} else {
		var cancelButton = new GENTICS.Aloha.ui.Button({
			label : this.i18n('button.cancel'),
			onclick : function() {
				that.cancelEdit(function () {that.previewPage()});
			},
			menu : [
				new GENTICS.Aloha.ui.Button({
					label : this.i18n('button.quit'),
					onclick : function() {
						that.quitEdit();
					}
			    })
	        ]
		});
		GENTICS.Aloha.Ribbon.addButton(cancelButton);
	}

	if (this.isGCNFrame()) {
		// Add a separator before the rest of the buttons
//		GENTICS.Aloha.Ribbon.addSeparator();
//		
//		this.buttons.maximizeButton = new GENTICS.Aloha.ui.Button({
//			iconClass : 'GENTICS_maximize',
//			toggle : true,
//			onclick : function () {
//				that.toggleEditFrame();
//			}
//		});
//		
//		// set the maximize button's initial status
//		if (this.isEditFrameMaximized()) {
//			this.buttons.maximizeButton.setPressed(true);
//		}
//		
//		// Add the maximize button
//		GENTICS.Aloha.Ribbon.addButton(this.buttons.maximizeButton);
		
		
		// first of all hide the ribbon, as it's not needed in GCN frame mode
		GENTICS.Aloha.Ribbon.hide();
	}
	
	// Set the icon in the ribbon
	GENTICS.Aloha.Ribbon.setIcon('GENTICS_logo');
	
	// add insert contenttag menu to the floating menu
	var contentTagsMenu = new Array();
	var constructs = new Array();

	if (this.settings.constructCategories) {
		for (var i=0; i<this.settings.constructCategories.length; i++) {
			constructs = new Array();
			for (var j=0; j<this.settings.constructCategories[i].constructs.length; j++) {
				constructs.push(new GENTICS.Aloha.ui.Button({
					label : this.settings.constructCategories[i].constructs[j].name,
					icon : this.createGCNURL({
						'url' : that.settings.stag_prefix,
						params : {
							'do' : 11,
							'img' : 'constr/' + this.settings.constructCategories[i].constructs[j].icon,
							'module' : 'content'
						}
					}),
					constructId : this.settings.constructCategories[i].constructs[j].id,
					onclick : function() {
						that.createTag(this.constructId);
					}
				}));
			}
			
			contentTagsMenu.push(new GENTICS.Aloha.ui.Button({
				label : this.settings.constructCategories[i].name,
				icon : this.createGCNURL({
					'url' : that.settings.stag_prefix,
					params : {
						'do' : 11,
						'img' : 'constructopen.gif',
						'module' : 'content'
					}
				}),
				menu : constructs,
				onclick : function () {} // nothing to do here
			}));
		}

		if (contentTagsMenu.length > 0) {
			// add the insert tag button
			GENTICS.Aloha.FloatingMenu.addButton(
				'GENTICS.Aloha.continuoustext',
				new GENTICS.Aloha.ui.Button({
					tooltip : this.i18n('insert_tag'),
					icon : this.createGCNURL({
						'url' : that.settings.stag_prefix,
						params : {
							'do' : 11,
							'img' : 'constructopen.gif',
							'module' : 'content'
						}
					}),
					menu : contentTagsMenu,
					size : 'medium'
				}),
				GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
				1
			);
		}
	}
};

/**
 * Initialize the editables, by 'aloha'ing them
 * @param editables
 */
GENTICS.Aloha.GCN.alohaEditables = function (editables) {
	if (editables) {
		jQuery.each(editables, function(index, editable) {
			jQuery("#" + editable.id).aloha();
		});
	}
};

/**
 * Initialize the blocks by 'aloha'ing them
 * @param blocks
 */
GENTICS.Aloha.GCN.alohaBlocks = function (blocks) {
	if (blocks) {
		jQuery.each(blocks, function(index, block) {
			jQuery('#' + block.id).addClass('GENTICS_block').attr('contentEditable', false);

			// add the edit icon for the block
			if (!GENTICS.Aloha.settings.readonly) {
				var imgTag = jQuery('<img>');
				imgTag.attr('border', 0);
				imgTag.attr('src', block.iconurl);
				var buttonTag = jQuery('<button>');
				buttonTag.click(function () {
					GENTICS.Aloha.GCN.openTagFill(block.tagid);
				});
				buttonTag.attr('alt', block.icontitle);
				buttonTag.attr('title', block.icontitle);
				buttonTag.addClass('GENTICS_editicon');
				buttonTag.prepend(imgTag);
				jQuery('#' + block.id).prepend(buttonTag);
			}
		});
	}
};

/**
 * stores frameset informations for normalizing the GCN edit frame
 * used by normalizeEditFrame() and written by maximizeEditFrame()
 * 
 * the object is prefilled with basic fallback options, which
 * are assumed to generate a consistent frame layout
 */
GENTICS.Aloha.GCN.maximizeOptions = {
		fsContent_cols : '0,*,0',
		frameset0_cols : '315,*',
		frameset2_rows : '101,*'
};

/**
 * normalize or maximize the GCN edit frame for Aloha
 * @return void
 */
GENTICS.Aloha.GCN.toggleEditFrame = function() {
	if (!top.main) {
		// seems we're outside of gcn
		return;
	}

	if (this.isEditFrameMaximized()) {
		this.normalizeEditFrame();
	} else {
		this.maximizeEditFrame();
	}
};

/**
 * normalize the GCN edit frame
 * @return void 
 */
GENTICS.Aloha.GCN.normalizeEditFrame = function() {
	// restore settings from maximized options
	top.main.document.getElementById('fsContent').cols = this.maximizeOptions.fsContent_cols;
	top.document.getElementsByTagName('frameset')[0].cols = this.maximizeOptions.frameset0_cols;
	top.document.getElementsByTagName('frameset')[2].rows = this.maximizeOptions.frameset2_rows;
	
	this.buttons.maximizeButton.setPressed(false);
};

/**
 * maximize the GCN edit frame
 * @return void 
 */
GENTICS.Aloha.GCN.maximizeEditFrame = function() {
	// remember old fs settings
	this.maximizeOptions.fsContent_cols = top.main.document.getElementById('fsContent').cols;
	this.maximizeOptions.frameset0_cols = top.document.getElementsByTagName('frameset')[0].cols;
	this.maximizeOptions.frameset2_rows = top.document.getElementsByTagName('frameset')[2].rows;
	
	// now change the frameset settings
	top.main.document.getElementById('fsContent').cols = '0,*,0';		
	top.document.getElementsByTagName('frameset')[0].cols = '0,*';
	top.document.getElementsByTagName('frameset')[2].rows = '0,*';
	
	this.buttons.maximizeButton.setPressed(true);
};

/**
 * check if the edit frame is maximized right now
 * check is based on the .cols attribute of the frameset[0] frameset
 * fsContent is not reliable for this check, as it is hidden by aloha by default
 * @return true if the edit frame is maximized, false otherwise
 */
GENTICS.Aloha.GCN.isEditFrameMaximized = function () {
	if (!this.isGCNFrame()) {
		return false;
	}
	if (top.document.getElementsByTagName('frameset')[0].cols == '0,*') {
		return true;
	} else {
		return false;
	}
};

/**
 * Checks if we are in a GCN frame environment.
 * 
 * @return true if we are in a gcn frame environment, false otherwise. 
 */
GENTICS.Aloha.GCN.isGCNFrame = function() {
	if (!window.parent) {
		return false;
	}
	// check for the vertical assistant
	var assistant = jQuery('frame', window.parent.document).eq(0);
	if (assistant.attr('name') === 'ass') {
		return true;
	}
	// check for the horizontal assistant
	assistant = jQuery('frame', window.parent.document).eq(2);
	if (assistant.attr('name') === 'ass') {
		return true;
	}
	return false; 
};


/**
 * Removes the GCN assistant frame and removes the content from the main menu frame.
 * This function also stops the GCN loading bar.
 * 
 * It's save to call this function even when not running inside the GCN frame.
 * In this case the function will do nothing.
 * 
 * @return void
 */
GENTICS.Aloha.GCN.updateFrameUI = function () {
	if (this.isGCNFrame()) {
		var assistantFrameset = jQuery('frameset', window.parent.document);
		this.originalColumns = assistantFrameset.attr('cols');
		this.originalRows = assistantFrameset.attr('rows');
		if (this.originalColumns) {
			assistantFrameset.attr('cols', '0,*,0');
		}
		if (this.originalRows) {
			assistantFrameset.attr('rows', '*,0,0');
		}
		
		var menuFrame = jQuery(window.parent.parent.frames[2].document);
		// hide the progress bar
		menuFrame.find('#ProgressStatusInfo_0').hide();
//		// hide the menu
//		var menu = menuFrame.find('#menu');
//		
//		// Cells in the right menu
//		var rightCells;
//		// FF has a different setup of the menu frame
//		if(menu.next().size() > 0) {
//			menu.find('table').hide(); // main menu
//			rightCells = menuFrame.find('.menuRight').find('td');
//		} else {
//			var cells = menu.find('td');
//			cells.eq(0).hide();
//			cells.eq(1).hide();
//			rightCells = cells.eq(2).find('td');
//		};
//		
//		rightCells.hide();
//		if (rightCells.last) {
//			rightCells.last().show();
//		}
	}
};

/**
 * Restores the GCN UI so that it can be used like before.
 * 
 * It's save to call this function even when not running inside the GCN frame.
 * In this case the function will do nothing.
 * 
 * @return void
 */
GENTICS.Aloha.GCN.restoreFrameUI = function () {
	if (this.isGCNFrame()) {
		var assistantFrameset = jQuery('frameset', window.parent.document);
		if (this.originalColumns) {
			assistantFrameset.attr('cols', this.originalColumns);
		}
		if (this.originalRows) {
			assistantFrameset.attr('rows', this.originalRows);
		}
	}
};

/**
 * Cancel editing of the current page and call the callback function afterwards
 * @param callback callback function after editing was successfully cancelled
 */
GENTICS.Aloha.GCN.cancelEdit = function (callback) {
	var that = this;

	this.performRESTRequest({
		'url' : this.restUrl + '/page/cancel/' + this.settings.id,
		'description' : 'restcall.cancelpage',
		'success' : callback,
		'error' : function(data) {
			// TODO this is just a dummy implementation of messages
			alert(that.i18n('restcall.cancelpage.error'));
		}
 	});
};

/**
 * Quit editing of current page. Unlock the page and go back to page list or website (when opened in wiki mode)
 */
GENTICS.Aloha.GCN.quitEdit = function() {
	var that = this;

	if (this.isEditFrameMaximized()) {
		this.normalizeEditFrame();
	}
	
	this.cancelEdit(function() {
		if (that.settings.backurl) {
			document.location.href = that.settings.backurl;
		} else if (that.isGCNFrame()) {
			that.openGCNURL({
				'url' : that.settings.stag_prefix,
				'params' : {
					'do' : 13011
				}
			});
		} else {
			that.openGCNURL({
				'url' : that.settings.stag_prefix,
				'params' : {
					'do' : 14300,
					'close' : true
				}
			});
		}
	});
};

/**
 * Show current page in preview mode
 */
GENTICS.Aloha.GCN.previewPage = function () {
	var that = this;

	this.openGCNURL({
		url : '/CNPortletapp/alohapage',
		params : {
			realid : that.settings.id,
			language : jQuery(document).getUrlParam('language'),
			real : 'view'
		}
	});
};

/**
 * Show current page in edit mode
 */
GENTICS.Aloha.GCN.editPage = function () {
	var that = this;

	this.openGCNURL({
		url : '/CNPortletapp/alohapage',
		params : {
			realid : that.settings.id,
			language : jQuery(document).getUrlParam('language'),
			real : 'edit'
		}
	});
};

/**
 * Save the current page back to GCN
 * @param data might contain the following settings
 * - unlock: whether the page shall be unlocked (defaults to false)
 * - onsuccess: handler function for saving success (defaults to just showing a message)
 * - onfailure: handler function for saving failure (defaults to just showing a message)
 * - silent: do not display any messages when saving was successful
 */
GENTICS.Aloha.GCN.savePage = function (data) {
	var that = this;
	if (typeof data == 'undefined') {
		data = {};
	}

	// construct the save request object, first with the meta information
	var requestBody = {
		'unlock' : data.closeAfterSave ? true : false,
		'page' : {
			'id' : this.settings.id,
			'templateId' : this.settings.templateId,
			'folderId' : this.settings.folderId,
			'name' : this.settings.name,
			'fileName' : this.settings.fileName,
			'description' : this.settings.description,
			'priority' : this.settings.priority
		}
	};

	// now add the editables as tags
	requestBody.page.tags = {};
	for( var i = 0; i < GENTICS.Aloha.editables.length; ++i) {
		var editable = GENTICS.Aloha.editables[i];
		var gcnEditable = this.findLoadedEditable(editable.getId());
		if (gcnEditable) {
			// get the contents of the editable (blocks will already be replaced by <span> tags
			var content = editable.getContents();
			// now replace the <span> tags to <node> tags
			content = content.replace(/<span class=\"GENTICS_block\" id=\"(\w+)\">x<\/span>/g, '<node $1>');
			var properties = {};
			if (!requestBody.page.tags[gcnEditable.tagname]) {
				// create the tag entry
				requestBody.page.tags[gcnEditable.tagname] = {
					'name' : gcnEditable.tagname,
					'active' : true,
					'properties' : {}
				};
			}

			requestBody.page.tags[gcnEditable.tagname].properties[gcnEditable.partname] = {
				'type' : 'RICHTEXT',
				'stringValue' : content
			};
		} else {
			// TODO we did not find the editable, what now?
		}
	}

	var onsuccess = data ? data.onsuccess : undefined;

	var onfailure = data ? data.onfailure : undefined;
	if (typeof onfailure != 'function') {
		onfailure = function(data) {
			// TODO this is just a dummy implementation of messages
			alert(that.i18n('restcall.savepage.error'));
		};
	}

	// if data.silent was set to true, we don't show success messages
	var showMessages = data && data.silent ? false : true;

	// make an API call to the REST API for storing the page
	this.performRESTRequest({
		'url' : this.restUrl + '/page/save/' + this.settings.id,
		'body' : requestBody,
		'description' : 'restcall.savepage',
		'success' : function (data) {
			// set editables unmodified after successful save
			for (var i in GENTICS.Aloha.editables) {
				if (GENTICS.Aloha.editables[i].setUnmodified) {
					GENTICS.Aloha.editables[i].setUnmodified();
				}
			}

			// do our generic onsuccess handling
			if (showMessages && data.messages) {
				// TODO this is just a dummy implementation of messages
				jQuery.each(data.messages, function (index, message) {
					alert(message.message);
				});
			}

			// if an onsuccess handler has been defined it will be called here
			if (onsuccess) {
				onsuccess(data);
			}
		},
		'error' : onfailure
 	});
};

/**
 * publishes the current page
 * @return void
 */
GENTICS.Aloha.GCN.publishPage = function () {
	var that = this;
	this.savePage({
		onsuccess : function () {
			var publishParams = that.isGCNFrame() ? {'do' : 14003, 'cmd' : 'pub'} : {'do' : 14012, 'realid' : that.settings.id, 'real' : 'pub'};
			that.openGCNURL({
					url : that.settings.stag_prefix,
					params : publishParams
			});
		},
		onfailure : function ()  {
			// TODO error handling
		}
	});
};

/**
 * publishes the current page at a specific time
 * @return void
 */
GENTICS.Aloha.GCN.publishPageAt = function () {
	var that = this;
	this.savePage({
		onsuccess : function () {
			var propsBackParam = that.isGCNFrame() ? '' : 'a:3:{s:4:"REDO";s:5:"14012";s:6:"realid";s:'+String(that.settings.id).length+':"'+that.settings.id+'";s:4:"real";s:4:"edit";}';	
			var publishAtParams = that.isGCNFrame() ? {'do' : 14021} : {'do' : 14021, 'PAGE_ID' : that.settings.id, 'FOLDER_ID' : that.settings.folderId, 'back' : propsBackParam};
			that.openGCNURL({
					url : that.settings.stag_prefix,
					params : publishAtParams
			});
		},
		onfailure : function ()  {
			// TODO error handling
		}
	});
};


/**
 * Get the loaded editable with given id.
 * @param id Aloha editable id
 * @return the loaded editable from the settings with this id (if found)
 */
GENTICS.Aloha.GCN.findLoadedEditable = function (id) {
	if (this.settings.editables) {
		for (var i = 0; i < this.settings.editables.length; ++i) {
			if (this.settings.editables[i].id == id) {
				return this.settings.editables[i];
			}
		}
	}
};

/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all tables and deactivate them
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.GCN.makeClean = function (obj) {
	// find all blocks and replace by <span> tags, which we can find later and replace by <node tags>
	if (this.settings.blocks) {
		jQuery.each(this.settings.blocks, function(index, block) {
			obj.find('#' + block.id).replaceWith('<span class="GENTICS_block" id="' + block.tagname + '">x</span>');
		});
	}
};

/**
 * Perform a REST request to the GCN backend REST Service.
 * The method will automatically add the sid as request parameters, additional parameters may be given.
 * The data may contain the following properties:
 * - url: URL for the specific request, must start with / and must not contain request parameters
 * - params: additional request parameters
 * - body: request body as object, will be transformed into JSON and sent to the server
 * - success: callback method for successful requests
 * - error: callback method for errors
 * - async: whether the request shall be done asynchronously (true by default)
 * - description: i18n key of the readable description of this request (for display of end user messages in case of an error)
 * - type: POST or GET (defaults to POST)
 * @param data data of the REST request
 * @return void
 */
GENTICS.Aloha.GCN.performRESTRequest = function (data) {
	var that = this;

	if (!data.type) {
		data.type = 'POST';
	}

	var ajaxObject = {
		'type' : data.type,
		'dataType': 'json',
		'timeout' : 10000,
		'contentType': 'application/json; charset=utf-8',
		'data' : jQuery.toJSON(data.body)
	};

	ajaxObject.url = data.url + '?sid=' + jQuery(document).getUrlParam('sid') + '&time=' + (new Date()).getTime();

	// add requestParams if given
	if (data.params) {
		for (var paramName in data.params) {
			ajaxObject.url += '&' + paramName + '=' + encodeURI(data.params[paramName]);
		}
	}

	// do the request asynchronously or not
	if (data.async) {
		ajaxObject.async = data.async;
	}

	// add the success handler
	if (data.success) {
		ajaxObject.success = data.success;
	}

	// add the error handler
	if (data.error) {
		ajaxObject.error = data.error;
	}

	// do the request
	jQuery.ajax(ajaxObject);
};

/**
 * Creates an URL for GCN.
 * 
 * The method will automatically add the sid as request parameters, additional parameters may be given.
 * The data may contain the following properties:
 * - url: part of the URL for the specific request after /CNPortletapp/rest, must start with / and must not contain request parameters
 * - params: additional request parameters
 * @param data data of the new GCN URL
 * @return The created GCN URL as String
 */
GENTICS.Aloha.GCN.createGCNURL = function (data) {
	var url = data.url + '?sid=' + jQuery(document).getUrlParam('sid') + '&time=' + (new Date()).getTime();
	for (var paramName in data.params) {
		url += '&' + paramName + '=' + encodeURI(data.params[paramName]);
	}
	return url;
};

/**
 * Perform a redirect to another GCN URL.
 * 
 * The method will automatically add the sid as request parameters, additional parameters may be given.
 * The data may contain the following properties:
 * - url: part of the URL for the specific request after /CNPortletapp/rest, must start with / and must not contain request parameters
 * - params: additional request parameters
 * - popup: true when the URL shall be opened in a popup, false if not (default)
 * @param data data of the new GCN URL
 * @return void
 */
GENTICS.Aloha.GCN.openGCNURL = function (data) {
	var url = this.createGCNURL(data);
	
	if (this.isEditFrameMaximized()) {
		this.normalizeEditFrame();
	}
	
	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		this.log('debug', 'opening url: ' + url);
	}
	if (data.popup) {
		window.open(url);
	} else {
		document.location.href = url;
	}
};

/**
 * Save the page and open the tagfill dialog for the given tag in a new window
 * @param tagid id of the tag
 */
GENTICS.Aloha.GCN.openTagFill = function(tagid) {
	var that = this;

	var editdo = 10008;
	var block = this.getBlock(tagid);
	if (block && block.editdo) {
		editdo = block.editdo;
	}

	// value of the backParam parameter for call to tag_fill (do 10008)
	var tagfillBackParam = this.isGCNFrame() ? '' : 'realid|' + this.settings.id;

	var editLink = this.createGCNURL({
		'url' : this.settings.stag_prefix,
		'params' : {
			'do' : editdo,
			'id' : tagid,
			'type' : 'page',
			'keepsid' : 1,
			'backparam' : tagfillBackParam
		}
	});

	// lock all tag icons
	jQuery('button.GENTICS_editicon').attr('disabled', 'true');
	
	// open a blank tagfill window which will load the tagfill dialog after saving
	var tagFillWindow = window.open('about:blank',
			'nodeeditor', 'dependent=yes,status=yes,scrollbars=yes,width=870,height=550,resizable=yes');
	
	// save the page and open the tagfill popup afterwards
	this.savePage({
		'onsuccess' : function() {
			// redirect tagfill window
			if (tagFillWindow.document) {
				tagFillWindow.document.location = editLink;
			}
			
			// unlock all tag icons
			jQuery('button.GENTICS_editicon').attr('disabled', '');
		},
		'onfailure' : function(data) {
			// close the empty tagfill window
			if (tagFillWindow.document) {
				tagFillWindow.close();
			}
			
			alert(that.i18n('restcall.savepage.error'));

			// unlock all tag icons
			jQuery('button.GENTICS_editicon').attr('disabled', '');
		},
		'unlock' : false,
		'silent' : true
	});
};

/**
 * Create a new tag in the page
 * @param constructId construct id
 * @return void
 */
GENTICS.Aloha.GCN.createTag = function(constructId) {
	var that = this;

	// make an API call to the REST API for storing the page
	this.performRESTRequest({
		'url' : this.restUrl + '/page/newtag/' + this.settings.id,
		'params' : {
			'constructId' : constructId
		},
		'description' : 'restcall.createtag',
		'success' : function (data) {
			that.performRESTRequest({
				'url' : '/CNPortletapp/alohatag',
				'type' : 'GET',
				'params' : {
					'realid' : that.settings.id,
					'real' : 'edit',
					'template' : '<node ' + data.tag.name + '>',
					'language' : jQuery(document).getUrlParam('language')
				},
				'success' : function (data) {
					that.handleBlock(data, true);
				},
				'error' : function () {
					// TODO error message
					alert('Error');
				}
			});
		}
 	});
};

/**
 * Get the block with given tagid
 * @param tagid id of the tag
 * @return block information or false if not found
 */
GENTICS.Aloha.GCN.getBlock = function(tagid) {
	if (!this.settings.blocks) {
		return false;
	}
	for (var i = 0; i < this.settings.blocks.length; ++i) {
		if (this.settings.blocks[i].tagid == tagid) {
			return this.settings.blocks[i];
		}
	}

	return false;
};

/**
 * Reload the block with given tagid
 * @param tagid id of the tag
 */
GENTICS.Aloha.GCN.reloadBlock = function(tagid) {
	// first get the block
	var block = this.getBlock(tagid);
	var that = this;

	if (!block) {
		return;
	}

	// render the tag
	this.performRESTRequest({
		'url' : '/CNPortletapp/alohatag',
		'type' : 'GET',
		'params' : {
			'realid' : that.settings.id,
			'real' : 'edit',
			'template' : '<node ' + block.tagname + '>',
			'language' : jQuery(document).getUrlParam('language')
		},
		'success' : function (data) {
			that.handleBlock(data, false);
		},
		'error' : function () {
			// TODO error message
			alert('Error');
		}
	});
};

/**
 * Insert a new block at the given selection
 * @param data data with the following properties
 * - content: HTML content of the block
 * - editables: array of editables contained in the tag
 * - blocks: array of blocks contained in the tag (including the tag itself)
 * @param insert true, when the block shall be inserted at the current selection, false if not
 * @return void
 */
GENTICS.Aloha.GCN.handleBlock = function(data, insert) {
	var blockObj = jQuery(data.content);

	// find occurrances of the block and replace the html code
	jQuery('#' + blockObj.attr('id')).replaceWith( data.content );

	// insert the new tag code into the currently active editable
	if (insert) {
		GENTICS.Aloha.Markup.insertHTMLCode(data.content);
	}

	// Activate editables
	if (data.editables) {
		if (!this.settings.editables) {
			this.settings.editables = new Array();
		}
		for (var i = 0; i < data.editables.length; ++i) {
			this.settings.editables.push(data.editables[i]);
		}
		this.alohaEditables(data.editables);
	}

	// Make blocks not editable
	if (data.blocks) {
		if (!this.settings.blocks) {
			this.settings.blocks = new Array();
		}
		for (var i = 0; i < data.blocks.length; ++i) {
			this.settings.blocks.push(data.blocks[i]);
		}
		this.alohaBlocks(data.blocks);
	}
};
