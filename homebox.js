// $Id$
Drupal.homebox = {
  config: {}
};
Drupal.behaviors.homebox = function (context) {
  var $homebox = $('#homebox:not(.homebox-processed)', context).addClass('homebox-processed');

  if ($homebox.length > 0) {
    // Find all columns
    Drupal.homebox.$columns = $homebox.find('div.homebox-column');
    Drupal.homebox.name = $.grep($homebox.attr('class').split(' '), function (c) {
      return c.match(/^homebox-(?!processed)/);
    })[0].replace(/^homebox-/, '');

    // Equilize columns height
    Drupal.homebox.equalizeColumnsHeights();

    // Make columns sortable
    Drupal.homebox.$columns.sortable({
      items: '.homebox-portlet.homebox-draggable',
      handle: '.portlet-header',
      connectWith: Drupal.homebox.$columns,
      placeholder: 'homebox-placeholder',
      forcePlaceholderSize: true,
      over: function () {
        Drupal.homebox.equalizeColumnsHeights();
      },
      stop: function () {
        Drupal.homebox.equalizeColumnsHeights();
        Drupal.homebox.pageChanged();
      }
    });

    // Initialize popup dialogs
    Drupal.homebox.initDialogs();

    // Intialize popup links
    Drupal.homebox.initDialogLinks();

    $homebox.find('#homebox-add-link').click(function () {
      $homebox.find('#homebox-add').toggle();
    });

    // Equalize column heights after AJAX calls
    $homebox.ajaxStop(function () {
      Drupal.homebox.equalizeColumnsHeights();
    });
  }
};

/**
 * Declare all dialog windows
 */
Drupal.homebox.initDialogs = function () {
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
      'Delete': function () {
        Drupal.homebox.deleteItem($(this).find('input').val());
      },
      Cancel: function () {
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
      'Restore': function () {
        $(this).dialog('close');
        Drupal.homebox.restoreBoxes();
      },
      Cancel: function () {
        $(this).dialog('close');
      }
    }
  });
};

/**
 * Attach click events to all links which handle
 * dialog windows
 */
Drupal.homebox.initDialogLinks = function () {
  // Save settings link
  $('#homebox-save-link').click(function () {
    Drupal.homebox.saveBoxes();
  });

  // Restore to defaults link
  $('#homebox-restore-link').click(function () {
    $('#homebox-restore-confirmation').dialog('open');
  });
};

/**
 * Set all column heights equal
 */
Drupal.homebox.equalizeColumnsHeights = function () {
  var maxHeight = 0;
  Drupal.homebox.$columns.each(function () {
    if ($(this).parent('.homebox-column-wrapper').attr('style') !== 'width: 100%;') {
      $(this).height('auto');
      maxHeight = Math.max($(this).height(), maxHeight);
    }
  }).each(function () {
    if ($(this).parent('.homebox-column-wrapper').attr('style') !== 'width: 100%;') {
      $(this).height(maxHeight);
    }
  });
};

/**
 * Deletes user's settings via AJAX call, then
 * reloads the page to restore the defaults
 */
Drupal.homebox.restoreBoxes = function () {
  // Show in-progress dialog
  $('#homebox-restore-inprogress').dialog('open');

  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/restore',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: Drupal.homebox.name},
    success: function () {
      location.reload(); // Reload page to show defaults
    },
    error: function () {
      $('#homebox-restore-inprogress').html('<span style="color:red;">' + Drupal.t('Restore failed. Please refresh page.') + '</span>');
    }
  });
};

Drupal.homebox.maximizeBox = function (icon) {
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
 * Delete a custom block from the page
 */
Drupal.homebox.deleteItem = function (block) {
  $('#homebox-delete-custom-message').html(Drupal.t('Deleting item') + '...');

  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/delete',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: Drupal.homebox.name, block: block},
    success: function () {
      $('#homebox-delete-custom-message').html(Drupal.t('Refreshing page') + '...');
      location.reload(); // Reload page
    },
    error: function () {
      $('#homebox-delete-custom-message').html('<span style="color:red;">' + Drupal.t('Deletion failed. Please refresh page.') + '</span>');
    }
  });
};

Drupal.homebox.pageChanged = function () {
  $('#homebox-changes-made').show();
};

/**
 * Save the current state of the homebox
 */
Drupal.homebox.saveBoxes = function () {
  var blocks = {};

  // Show progress dialog
  $('#homebox-save-message').dialog('open');

  Drupal.homebox.equalizeColumnsHeights();
  Drupal.homebox.$columns.each(function (colIndex) {
    // Determine region
    colIndex = colIndex + 1;
    $(this).find('.homebox-portlet').each(function (boxIndex) {
      var $this = $(this),
        color = 'default';

      // Determine custom color, if any
      $.each($this.attr('class').split(' '), function (key, a) {
        if (a.substr(0, 14) === 'homebox-color-') {
          color = a.substr(14);
        }
      });

      // Build blocks object
      blocks[$this.attr('id').replace(/^homebox-block-/, '')] = {
        region: colIndex,
        status: $this.is(':visible'),
        color: color,
        open: $this.find('.portlet-content').is(':visible')
      };
    });
  });

  // Encode JSON
  blocks = JSON.stringify(blocks);

  $.ajax({
    url: Drupal.settings.basePath + '?q=homebox/js/save',
    type: 'POST',
    cache: 'false',
    dataType: 'json',
    data: {name: Drupal.homebox.name, blocks: blocks},
    success: function () {
      $('#homebox-save-message').dialog('close');
      $('#homebox-changes-made').hide();
    },
    error: function () {
      $('#homebox-save-message').html('<span style="color:red;">' + Drupal.t('Save failed. Please refresh page.') + '</span>');
    }
  });
};

Drupal.homebox.convertRgbToHex = function (rgb) {
  if (!jQuery.browser.msie) {
    // Script taken from
    // http://stackoverflow.com/questions/638948/background-color-hex-to-js-variable-jquery
    var parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    // parts now should be ["rgb(0, 70, 255", "0", "70", "255"]
    delete (parts[0]);
    for (var i = 1; i <= 3; i += 1) {
      parts[i] = parseInt(parts[i], 10).toString(16);
      if (parts[i].length === 1) {
        parts[i] = '0' + parts[i];
      }
    }
    return '#' + parts.join(''); // '0070ff'
  }
  else {
    return rgb;
  }
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
    $portletHeader.find('.portlet-maximize').click(function () {
      $(this).toggleClass('portlet-maximize');
      $(this).toggleClass('portlet-minimize');
      Drupal.homebox.maximizeBox(this);
      Drupal.homebox.equalizeColumnsHeights();
    });

    // Attach click event on minus
    $portletHeader.find('.portlet-minus').click(function () {
      $(this).toggleClass('portlet-minus');
      $(this).toggleClass('portlet-plus');
      $portlet.find('.portlet-content').toggle();
      Drupal.homebox.equalizeColumnsHeights();
      Drupal.homebox.pageChanged();
    });

    // Attach click event on minus
    $portletHeader.find('.portlet-minus').each(function () {
      if (!$portlet.find('.portlet-content').is(':visible')) {
        $(this).toggleClass('portlet-minus');
        $(this).toggleClass('portlet-plus');
        Drupal.homebox.equalizeColumnsHeights();
      }
    });

    // Attach double click event on portlet header
    $portlet.find('.portlet-title').dblclick(function () {
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
      Drupal.homebox.pageChanged();
    });

    // Attach click event on settings icon
    $portletSettings.click(function () {
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
    $portletHeader.find('.portlet-close').click(function () {
      $portlet.hide();
      Drupal.homebox.equalizeColumnsHeights();
      Drupal.homebox.pageChanged();
    });

    $.each($portlet.attr('class').split(' '), function (key, a) {
      if (a.substr(0, 14) === 'homebox-color-') {
        $portletHeader.attr('style', 'background: #' + a.substr(14));
        $portlet.find('.homebox-portlet-inner').attr('style', 'border: 1px solid #' + a.substr(14));
      }
    });

    // Add click behaviour to color buttons
    $portlet.find('.homebox-color-selector').click(function () {
      var color = $(this).css('background-color');

      $.each($portlet.attr('class').split(' '), function (key, value) {
        if (value.indexOf('homebox-color-') === 0) {
          $portlet.removeClass(value);
        }
      });

      // Add color classes to blocks
      // This is used when we save so we know what color it is
      $portlet.addClass('homebox-color-' + Drupal.homebox.convertRgbToHex(color).replace('#', ''));

      // Apply the colors via style attributes
      // This avoid dynamic CSS
      $portletHeader.attr('style', 'background: ' + Drupal.homebox.convertRgbToHex(color));
      $portlet.find('.homebox-portlet-inner').attr('style', 'border: 1px solid ' + Drupal.homebox.convertRgbToHex(color));
      Drupal.homebox.pageChanged();
    });

    // Add tooltips to icons
    $portlet.find('.portlet-icon').tipsy({
      gravity: 's',
      title: function () {
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
    $portletHeader.click(function () {
      $('.tipsy').remove();
    });

    // Delete custom item link
    $('.homebox-delete-custom-link').click(function () {
      // Place the block ID into the dialog
      $('#homebox-delete-custom-message input').val(
        $(this).attr('id').replace('delete-', '')
      );
      $('#homebox-delete-custom-message').dialog('open');
    });
  });
};
