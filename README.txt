// $Id$
 _                          _                  ____  
| |__   ___  _ __ ___   ___| |__   ___ __  __ |___ \ 
| '_ \ / _ \| '_ ` _ \ / _ \ '_ \ / _ \\ \/ /   __) |
| | | | (_) | | | | | |  __/ |_) | (_) |>  <   / __/ 
|_| |_|\___/|_| |_| |_|\___|_.__/ \___//_/\_\ |_____|
                                                     

Welcome to Home box 2.


REQUIREMENTS
------------

 * jQuery UI 6.x-1.3 - http://drupal.org/project/jquery_ui
 * jQuery UI 1.6
   - Grab jQuery UI package from Google Code - http://jquery-ui.googlecode.com/files/jquery.ui-1.6.zip
 * PHP >= 5.2
   - This is required for JSON support.


RECOMMENDED
---------------------

The following modules are not required but recommended for integration or ease of use:

 * Color picker - http://drupal.org/project/colorpicker
 * Views -  http://drupal.org/project/views
 * Advanced Help - http://drupal.org/project/advanced_help


INSTALLATION
------------

 * Enable jQuery UI modules
 * Be sure to follow instructions from README.txt in jQuery UI module

   --- IMPORTANT ---- Begin
   Be sure to grab jQuery UI package from Google Code - http://jquery-ui.googlecode.com/files/jquery.ui-1.6.zip

   If not sure read this http://drupal.org/node/463270
   --- IMPORTANT ---- End

 * Enable optional modules if you want (see list above)
 * Enable Home box module
 * Visit the Status Report page and make sure there are no Home box errors
 * Go to Administer > Site building > Home box
 * Create an new page


UPGRADING FROM 1.x TO 2.x
-------------------------

Sorry, but there is no upgrade path between the 1.x version of Home box and the 2.x version.
In order for Home box 2 to work correctly, you must completely uninstall any previous versions
and cleanly install this version.


CONTROLLING ACCESS TO HOME BOX PAGES
------------------------------------

Access controls for Home box pages (not the admin interface) are no longer located in the standard
Drupal permissions table. When creating/editing each Home box page, you can choose which roles are
allowed to view the page. Unlike other Drupal components, if you do not choose any roles, then only 
admins can view the page. So, choose at least one role. For obvious reasons, anonymous users will
not be able to save pages or add custom items.


CREATING PANELS-LIKE HOME BOX LAYOUTS
-------------------------------------

One of Home box 2's new features, is the ability to easily create panels-like layouts. After creating
a new Home box page, click the 'Settings' link. Under the 'Custom column widths' fieldset, you can 
specify the width percentage of each region. If you wanted to create a layout like:

[-----top----]
[--l--][--r--]
[---bottom---]

You'd use widths of 100, 50, 50, and 100.


"CUSTOM ITEMS"
--------------

Another new feature in Home box 2 is the ability for users to enter custom items into their Home box.
Each Home box page has the option to turn this on or off. If set on, users can enter as many custom
blocks as they like - supplying a block title and body (full HTML allowed). This is useful if they want
to paste code for an external widget.

 
PROFILE INTEGRATION
-------------------

Home box 2 integrates with Drupal's core profile module. After creating a page, you can navigate
to admin/user/homebox and choose any available Home box page to reside as a tab on user's profiles.
User's can only view their own Home box profile tab.


ORGANIC GROUPS INTEGRATION
--------------------------

Similar to the previously mentioned, Home box integrates with the Organic Groups module. You have the option
to have a Home box page reside as a group homepage tab, or become the new group homepage itself. You must
enable the homebox_og module then navigate to admin/og/homebox.


FEATURES INTEGRATION
--------------------

Home box 2 has the ability to import and export pages, as well as have them live in code. Because of this,
Home box has been made to integrate with the Features.module. For more information about Features, please
visit http://drupal.org/project/features.


API
---

Modules can now ship with a Home box completely in code. See homebox_example.module for an example and
documentation.
