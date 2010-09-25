// $Id$
Drupal.homebox = {
  config: {}
};
Drupal.behaviors.homebox = function(context) {
  $homebox = $('#homebox:not(.homebox-processed)', context).addClass('homebox-processed');
  
  if ($homebox.length > 0) {
    // Find all columns
    Drupal.homebox.$columns = $homebox.find('div.homebox-column');
    
    // Equilize columns height
    Drupal.homebox.equalizeColumnsHeights();
    
    // Make columns sortable
    Drupal.homebox.$columns.sortable({
      items: '.homebox-portlet.homebox-draggable',
      handle: '.portlet-header',
      connectWith: Drupal.homebox.$columns,
      placeholder: 'homebox-placeholder',
      forcePlaceholderSize: true,
      over: function() {
        Drupal.homebox.equalizeColumnsHeights();
      },
      stop: function() {
        Drupal.homebox.equalizeColumnsHeights();
        $('#homebox-changes-made').show();
      }
    });
    
    // Add click behaviour to checkboxes that enable/disable blocks
    $togglers = $homebox.find('#homebox-settings input.homebox_toggle_box');
    $togglers.click(function() {
      if ($(this).attr('checked')) {
        el_id = $(this).attr('id').replace('homebox_toggle_', '');
        $('#' + el_id).show();
      }
      else{
        el_id = $(this).attr('id').replace('homebox_toggle_', '');
        $('#' + el_id).hide();
      };
      Drupal.homebox.equalizeColumnsHeights();
      $('#homebox-changes-made').show();
    });
    
    // Add region to place maximized portlets
    $homebox.find('.homebox-column-wrapper:first').before('<div class="homebox-maximized"></div>');
    
    // Initialize popup dialogs
    Drupal.homebox.initDialogs();
    
    // Intialize popup links
    Drupal.homebox.initDialogLinks();
    
    // Clear out add item form components
    $('#homebox-add-form-title').val('');
    $('#homebox-add-form-content').val('');
    
    // Equalize column heights after AJAX calls
    $homebox.ajaxStop(function(){
      Drupal.homebox.equalizeColumnsHeights();
    });
  }
};

/**
 * Declare all dialog windows
 */
Drupal.homebox.initDialogs = function() {
  // Put widget selection in a dialog window
  $('#homebox-settings').dialog({
    modal: true,
    autoOpen: false,
    width: 400
  });
    
  // Save settings progress dialog
  $('#homebox-save-message').dialog({
    modal: true,
    height: 100,
    autoOpen: false
  });
  
  // Deletion confirmation dialog
  $('#homebox-delete-custom-message').dialog({
    autoOpen: false,
	  modal: true,
    height: 145,
    width: 500,
    buttons: {
		  'Delete': function() {
				Drupal.homebox.deleteItem($(this).find('input').val());
			},
		  Cancel: function() {
			  $(this).dialog('close');
		  }
    }  
  }); 
  
  // Add item dialog
  $('#homebox-add-form').dialog({
    autoOpen: false,
	  modal: true,
    zIndex: 500,
    width: 500,
    height: 350,
    buttons: {
		  'Submit': function() {
        Drupal.homebox.addItem();
      },
      Cancel: function() {
        $('#homebox-add-form-status').hide();
        $('#homebox-add-form-title').val('');
        $('#homebox-add-form-content').val('');
				$(this).dialog('close');
			}
    }
  });
  
  // Restore to default in-progress dialog
  $('#homebox-restore-inprogress').dialog({
    autoOpen: false,
	  modal: true,
    height: 100
  });
  
  // Restore to default confirmation dialog
  $('#homebox-restore-confirmation').dialog({
    height: 160,
    width: 450,
    autoOpen: false,
	  modal: true,
		buttons: {
		  'Restore': function() {
			  $(this).dialog('close');
        Drupal.homebox.restoreBoxes();
      },
			Cancel: function() {
			  $(this).dialog('close');
      }
    }
  });
};

/**
 * Attach click events to all links which handle
 * dialog windows
 */
Drupal.homebox.initDialogLinks = function() {
  // Edit content link
  $('#homebox-edit-link').click(function() {
    $('#homebox-settings').dialog('open');
  });
    
  // Save settings link
  $('#homebox-save-link').click(function() {
    Drupal.homebox.saveBoxes();
  });
    
  // Restore to defaults link
  $('#homebox-restore-link').click(function() {
    $('#homebox-restore-confirmation').dialog('open');
  });
    
  // Add items link
  $('#homebox-add-link').click(function() {
    $('#homebox-add-form').dialog('open');
  });
};

/**
 * Set all column heights equal
 */
Drupal.homebox.equalizeColumnsHeights = function() {
  maxHeight = 0;
  Drupal.homebox.$columns.each(function() {
    if ($(this).parent('.homebox-column-wrapper').attr('style') != 'width: 100%;') {
      $(this).height('auto');
      currentHeight = $(this).height();
      if (maxHeight < currentHeight) {
        maxHeight = currentHeight;
      };
    };
  }).each(function() {
    if ($(this).parent('.homebox-column-wrapper').attr('style') != 'width: 100%;') {
      $(this).height(maxHeight);
    }
  });
};

/**
 * Deletes user's settings via AJAX call, then
 * reloads the page to restore the defaults
 */
Drupal.homebox.restoreBoxes = function() {
  // Show in-progress dialog
  $('#homebox-restore-inprogress').dialog('open');
  
  // Determine page name
  name = $('#homebox').find('input:hidden.name').val();
  
  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/restore',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: name},
    success: function() {
      location.reload(); // Reload page to show defaults
    },
    error: function() {
      $('#homebox-restore-inprogress').html('<span style="color:red;">' + Drupal.t('Restore failed. Please refresh page.') + '</span>');
    }
  });
};  

Drupal.homebox.maximizeBox = function(icon) {
  // References to active portlet and its homebox
  var portlet = $(icon).parents('.homebox-portlet');
  var homebox = $(icon).parents('#homebox');

  // Only fire this action if this widget isnt being dragged
  if (!$(portlet).hasClass('ui-sortable-helper')) {
    // Check if we're maximizing or minimizing the portlet
    if ($(portlet).hasClass('portlet-maximized')) {
      // Minimizing portlet
         
      // Move this portlet to its original place (remembered with placeholder)
      $(portlet).insertBefore($(homebox).find('.homebox-maximized-placeholder'))
        .toggleClass('portlet-maximized');
          
      // Remove placeholder
      $(homebox).find('.homebox-maximized-placeholder').remove();
        
      // Show columns again
      $(homebox).find('.homebox-column').show();
         
      // Show close icon again
      $(portlet).find('.portlet-close').show();
       
      // Show the save button
      $('#homebox-save-link').show();
      $('#homebox-minimize-to-save').hide();
      
      // Restore the checkbox under "Edit Content"
      $('input#homebox_toggle_' + $(portlet).attr('id')).removeAttr('disabled');
    }
    else {
      // Maximizing portlet
         
      // Add the portlet to maximized content place and create a placeholder 
      // (for minimizing back to its place)
      $(portlet)
        .before('<div class="homebox-maximized-placeholder"></div>')
        .appendTo($(icon).parents('#homebox').find('.homebox-maximized'))
        .toggleClass('portlet-maximized');
           
      // Hide columns - only show maximized content place (including maximized widget)
      $(homebox).find('.homebox-column').hide();

      // Hide close icon (you wont be able to return if you close the widget)
      $(portlet).find('.portlet-close').hide();  
      
      // Hide the save button
      $('#homebox-save-link').hide();
      $('#homebox-minimize-to-save').show();
    
      // Disable the checkbox under "Edit content"
      $('input#homebox_toggle_' + $(portlet).attr('id')).attr('disabled', 'disabled');
    }    
  }
};

/**
 * Add a custom block
 */
Drupal.homebox.addItem = function() {
  var block = {};
  var title = $('#homebox-add-form-title').val();
  var content = $('#homebox-add-form-content').val();
  
  // Make sure both fields are supplied
  if (!title || !content) {
    $('#homebox-add-form-status').show();
    $('#homebox-add-form-status').html(Drupal.t('All fields are required.'));
    return;
  }
  
  // Place data into the custom block object
  block = {
		title: title,
		body: content
	}
	
	// Encode the block
	block = JSON.stringify(block);

  // Show progress message
  $('#homebox-add-form').html(Drupal.t('Adding item') + '...');

  // Save current configuration
  // We pass the custom block in, because it will be added
  // after the full save is executed, only if successful 
  Drupal.homebox.saveBoxes(block);
};

/**
 * The AJAX call for adding an item
 * 
 * This needs to be separate so that .saveBoxes()
 * can call it after a successful AJAX save
 */
Drupal.homebox.addItemAjax = function(name, block) {
  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/add',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: name, block: block},
    success: function() {
      $('#homebox-add-form').html(Drupal.t('Refreshing page') + '...');
      location.reload(); // Reload page
    },
    error: function() {
      $('#homebox-add-form').html('<span style="color:red;">' + Drupal.t('Save failed. Please refresh page.') + '</span>');
    }
  });
};

/**
 * Delete a custom block from the page
 */
Drupal.homebox.deleteItem = function(block) {
  var name = $('#homebox').find('input:hidden.name').val();
  
  $('#homebox-delete-custom-message').html(Drupal.t('Deleting item') + '...');
  
  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/delete',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: name, block: block},
    success: function() {
      $('#homebox-delete-custom-message').html(Drupal.t('Refreshing page') + '...');
      location.reload(); // Reload page
    },
    error: function() {
      $('#homebox-delete-custom-message').html('<span style="color:red;">' + Drupal.t('Deletion failed. Please refresh page.') + '</span>');
    }
  });
};

/**
 * Save the current state of the homebox
 * 
 * @param save
 *   Optionally, A JSON-encoded custom block object. This is passed in
 *   because we want to first save the current state, then add the
 *   custom block so changes are preserved, and that we can only
 *   add if and when the first ajax call is successful.
 */
Drupal.homebox.saveBoxes = function(save) {
  var color = new String();
  var block = new String();
  var name = $('#homebox').find('input:hidden.name').val();
  var blocks = {};
  
  // Show progress dialog
  $('#homebox-save-message').dialog('open');

  Drupal.homebox.equalizeColumnsHeights();
  Drupal.homebox.$columns.each(function(colIndex) {
    // Determine region
    var colIndex = colIndex + 1;
    $(this).find('.homebox-portlet').each(function(boxIndex) {
      // Determine block name
      block = $(this).find('input:hidden.homebox').val();
      
      // Determine visibility
      visible = 0;
      if ($(this).is(':visible')) {
        visible = 1;
      };

      // Determine custom color, if any
      attributes = $(this).attr('class').split(' ');
      color = 'default';
      for (a in attributes) {
        if (attributes[a].substr(0, 14) == 'homebox-color-') {
          color = attributes[a].substr(14);
        }
      }
      
      // Build blocks object
      blocks[block] = {
        region: colIndex,
        status: visible,
        color: color,
        open: $(this).find('.portlet-content').is(':visible')
      }
    });
  });
 
  // Encode JSON
  blocks = JSON.stringify(blocks);
  
  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/save',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: name, blocks: blocks},
    success: function() {
      $('#homebox-save-message').dialog('close');
      $('#homebox-changes-made').hide();
      
      if (save) {
        // If a block was passed in, save it as a
        // custom block after ajax success.
        Drupal.homebox.addItemAjax(name, save); 
      }
    },
    error: function() {
      $('#homebox-save-message').html('<span style="color:red;">' + Drupal.t('Save failed. Please refresh page.') + '</span>');
    }
  });
};

Drupal.homebox.convertRgbToHex = function(rgb) {
  if (!jQuery.browser.msie) {
    // Script taken from
    // http://stackoverflow.com/questions/638948/background-color-hex-to-js-variable-jquery
    var parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    // parts now should be ["rgb(0, 70, 255", "0", "70", "255"]
    delete (parts[0]);
    for (var i = 1; i <= 3; ++i) {
      parts[i] = parseInt(parts[i]).toString(16);
      if (parts[i].length == 1) parts[i] = '0' + parts[i];
    }
    return '#' + parts.join(''); // '0070ff'
  } else {
    return rgb;
  };
};

Drupal.behaviors.homeboxPortlet = function (context) {
  $('.homebox-portlet:not(.homebox-processed)', context).addClass('homebox-processed').each(function () {
    var $portlet = $(this),
      $portletHeader = $portlet.find('.portlet-header'),
      $portletSettings = $portletHeader.find('.portlet-settings'),
      $portletConfig = $portlet.find('.portlet-config');

    // Restore classes saved before AHAH, they back some page-wide
    // settings.
    if (Drupal.homebox.config[$portlet.attr('id')] !== undefined) {
      $portlet.attr('class', Drupal.homebox.config[$portlet.attr('id')]);
    }

    // Prevent double-clicks from causing a selection
    $portletHeader.disableSelection();

    // Attach click event to maximize icon
    $portletHeader.find('.portlet-maximize').click(function() {
      $(this).toggleClass('portlet-maximize');
      $(this).toggleClass('portlet-minimize');
      Drupal.homebox.maximizeBox(this);
      Drupal.homebox.equalizeColumnsHeights();
    });  
    
    // Attach click event on minus
    $portletHeader.find('.portlet-minus').click(function() {
      $(this).toggleClass('portlet-minus');
      $(this).toggleClass('portlet-plus');
      $portlet.find('.portlet-content').toggle();
      Drupal.homebox.equalizeColumnsHeights();
      $('#homebox-changes-made').show();
    });
    
    // Attach click event on minus
    $portletHeader.find('.portlet-minus').each(function() {
      if (!$portlet.find('.portlet-content').is(':visible')) {
        $(this).toggleClass('portlet-minus');
        $(this).toggleClass('portlet-plus');
        Drupal.homebox.equalizeColumnsHeights();
      };
    });
    
    // Attach double click event on portlet header
    $portlet.find('.portlet-title').dblclick(function() {
      if ($portlet.find('.portlet-content').is(':visible')) {
        $portletHeader.find('.portlet-minus').toggleClass('portlet-plus');  
        $portletHeader.find('.portlet-minus').toggleClass('portlet-minus');
      }
      else {
        $portletHeader.find('.portlet-plus').toggleClass('portlet-minus');
        $portletHeader.find('.portlet-plus').toggleClass('portlet-plus'); 
      }
      
      $portlet.find('.portlet-content').toggle();
      
      Drupal.homebox.equalizeColumnsHeights();
      $('#homebox-changes-made').show();
    });
    
    // Attach click event on settings icon
    $portletSettings.click(function() {
      $portletConfig.toggle();
      Drupal.homebox.equalizeColumnsHeights();
    });
    // Show settings if there are error messages
    if ($portletConfig.find('>.messages').length) {
      $portletSettings.trigger('click');
    }
    // Save classes on submit
    $portletConfig.find('.form-submit').click(function () {
      Drupal.homebox.config[$portlet.attr('id')] = $portlet.attr('class');
    });
    
    // Attach click event on close
    $portletHeader.find('.portlet-close').click(function() {
      $portlet.hide();
      // Uncheck input settings
      $('#homebox_toggle_' + $portlet.attr('id')).attr('checked', false);
      Drupal.homebox.equalizeColumnsHeights();
      $('#homebox-changes-made').show();
    });

    var attributes = $portlet.attr('class').split(' ');
    for (a in attributes) {
      if (attributes[a].substr(0, 14) == 'homebox-color-') {
        $portletHeader.attr('style', 'background: #' + attributes[a].substr(14));
        $portlet.find('.homebox-portlet-inner').attr('style', 'border: 1px solid #' + attributes[a].substr(14));
      }
    }
    
    // Add click behaviour to color buttons
    $portlet.find('.homebox-color-selector').click(function () {
      color = $(this).css('background-color');
      $.each($portlet.attr('class').split(' '), function (key, value) {
        if (value.indexOf('homebox-color-') === 0) {
          $portlet.removeClass(value);
        };
      });
      
      // Add color classes to blocks
      // This is used when we save so we know what color it is
      $portlet.addClass('homebox-color-' + Drupal.homebox.convertRgbToHex(color).replace('#', ''));
      
      // Apply the colors via style attributes
      // This avoid dynamic CSS
      $portletHeader.attr('style', 'background: ' + Drupal.homebox.convertRgbToHex(color));
      $portlet.find('.homebox-portlet-inner').attr('style', 'border: 1px solid ' + Drupal.homebox.convertRgbToHex(color));
      $('#homebox-changes-made').show();
    });
    
    // Add tooltips to icons
    $portlet.find('.portlet-icon').tipsy({
      gravity: 's',
      title: function() {
        switch ($(this).attr('class').replace('portlet-icon portlet-', '')) {
          case 'close':
            return Drupal.t('Close');
          case 'maximize':
            return Drupal.t('Maximize');
          case 'minimize':
            return Drupal.t('Minimize');
          case 'minus':
            return Drupal.t('Collapse');
          case 'plus':
            return Drupal.t('Expand');
          case 'settings':
            return Drupal.t('Settings');
        }
      }
    });
    
    // Remove tooltips on header clicks
    $portletHeader.click(function() {
      $('.tipsy').remove();
    });

    // Delete custom item link
    $('.homebox-delete-custom-link').click(function() {
      // Place the block ID into the dialog
      $('#homebox-delete-custom-message input').val(
        $(this).attr('id').replace('delete-', '')
      );
      $('#homebox-delete-custom-message').dialog('open');
    });
  });
}
