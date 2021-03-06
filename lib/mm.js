// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

/**
 * @fileOverview Main app library where is defined the global namespace "MM".
 * @author <a href="mailto:jleyva@cvaconsulting.com">Juan Leyva</a>
 * @version 1.2
 */

/**
  * @namespace Holds all the MoodleMobile specific functionallity.
 */
var MM = {
    config: {},
    plugins: {},
    models: {},
    collections: {},
    deviceType: 'phone',
    deviceOrientation: 'notSet',
    clickType: 'click',
    quickClick: 'click',
    deviceReady: false,
    deviceOS: '',
    logData: [],
    inComputer: false,
    touchMoving: false,
    scrollType: '',
    mq: 'only screen and (min-width: 768px) and (-webkit-min-device-pixel-ratio: 1)',
    currentPlugin: undefined,
    mainSiteLoginCallback: undefined,

    /**
     * Initial setup of the app: device type detection, routes, models, settings.
     * This function is executed once the config.json file is loaded and previously to loading the app plugins.
     *
     * @this {MM}
     * @param {Object.<>} Settings loaded from /config.json.
     */
    init: function(config) {
        MM.log('Initializating app');
        this.config = config;
        this.setEventTypes();
        this.setDeviceOS();
        this.setInComputerState();
        this.setDeviceType();
        this.getDeviceOrientation();
        this.loadCordova();
        this.loadBackboneRouter();
        this.registerCoreModels();
        this.checkAjax();
        this.loadRoutes();
        this.setUpNavigation();
        this.setUpBackboneHistory();
    },

    isOnline: function () {
        //test to see if there is an internet connection every 10 seconds.
        MM.online_status = navigator.onLine;
        setInterval(function () {
            var element = $('#online-status');
            var oldStatus = element.attr('title');
            if (navigator.onLine === false) {
                element.addClass('off');
            } else {
                element.removeClass('off');
            }
            element.attr('title', (navigator.onLine ? 'online' : 'offline'));
            if (element.attr('title') !== oldStatus) {
                // Message based on current connection status.
                if (navigator.onLine) {
                    MM.widgets.dialog(
                        MM.lang.s("connectionrestored"), {
                            'title':MM.lang.s("connectionrestored"),
                            'autoclose':5000,
                            'buttons':{}
                        }
                    );

                } else {
                    MM.widgets.dialog(
                        MM.lang.s("connectionlost"), {
                            'title':MM.lang.s("connectionlost"),
                            'autoclose':5000,
                            'buttons':{}
                        }
                    );
                }
            }
        }, 10000);
    },

    updateMenuItemsIndicators: function() {
        MM.moodleWSCall(
            'tm_webservice_get_item_counts',
            {},
            function(res) {
                var updatables = MM.getConfig('menu_items_indicators_updatable');
                _.each(updatables, function(up) {
                    var val = parseInt(res[up.wskey]);
                    var $el = $("#"+up.indicator);
                    if (val > 0) {
                        $el.text(val).css('visibility', 'visible');
                    } else if (up.hideWhenZero) {
                        $el.css('visibility', 'hidden');
                    }
                });
            },
            {cache: false},
            undefined,
            true
        );
    },

    assignCurrentPlugin: function(plugin) {
        this.currentPlugin = plugin;
        $(document).on('side_menu_toggled', plugin.resize);
    },

    setUpBackboneHistory: function() {
        MM.numPlugins = 0;
        if (MM.config.plugins !== undefined) {
            MM.numPlugins = MM.config.plugins.length;
        }
        MM.numPluginsLoaded = 0;
        MM.layoutLoaded = false;

        $(document).on('pluginLoaded', function() {
            MM.numPluginsLoaded ++;
            MM._setUpBackboneHistory();
        });

        $(document).on('layoutLoaded', function() {
            MM.layoutLoaded = true;
            MM._setUpBackboneHistory();
        });
    },

    _setUpBackboneHistory: function() {
        if (MM.layoutLoaded && MM.numPluginsLoaded >= MM.numPlugins) {
            Backbone.history.start();
        }
    },

    _setUpNavigation: function() {
        // Find out what our navigation plugin should be
        MM.navigation.init(MM.config.menu_type);

        // Tell the panels object so it can resize appropriately
        MM.panels.setupInitialView();

        // Put content into the panel
        if (MM.site !== undefined) {
            MM.navigation.populate();
        }

        // But don't show it.
        MM.navigation.hide();
    },

    _setUpHomepage: function() {
        MM.homepage.init();
        if (window.location.href.indexOf('#') < 0) {
            MM.Router.navigate(MM.config.homepageurl, {trigger:true});
        }
    },

    siteLoaded: false,
    langLoaded: false,
    menuPluginLoaded: false,
    homepagePluginLoaded: false,

    setUpNavigation: function() {
        $(document).on('siteLoaded', function() {
            MM.siteLoaded = true;
            MM.setUpNavigationHandler();
        });

        $(document).on('langLoaded', function() {
            MM.langLoaded = true;
            MM.setUpNavigationHandler();
        });

        $(document).on('pluginLoaded', function(ev, plugin) {
            if (plugin.settings.type == 'menu') {
                MM.menuPluginLoaded = true;
            } else if (plugin.settings.name == MM.getConfig('homepage')) {
                MM.homepagePluginLoaded = true;
            }
            MM.setUpNavigationHandler();
        });
    },

    setUpNavigationHandler: function() {
        if (
            MM.siteLoaded === true &&
            MM.langLoaded === true &&
            MM.menuPluginLoaded === true &&
            MM.homepagePluginLoaded === true 
        ) {
            MM._setUpHomepage();
            MM._setUpNavigation();
        }
    },

    /**
     * Set which events we should bind interaction handlers to.
     */
    setEventTypes: function() {
        if (MM.util.isTouchDevice()) {
            MM.clickType = 'touchend';
            MM.quickClick = 'touchstart';
        } else {
            MM.clickType = 'click';
            MM.quickClick = 'click';
        }
    },

    /**
     * Detect the current device type (tablet or phone).
     */
    setDeviceType: function() {
        if (MM.inComputer || matchMedia(MM.mq).matches) {
            this.deviceType = 'tablet';
            $('body').addClass('tablet');
        } else {
            this.deviceType = 'phone';
            $('body').addClass('phone');
        }
    },
    getDeviceOrientation: function(e) {
        switch(window.orientation)
        {
            case -90:
            case 90:
                this.deviceOrientation = 'landscape';
                break;
            default:
                this.deviceOrientation = 'portrait';
                break;
        }

        MM.log( "device.orientation : " + this.deviceOrientation);
        MM.deviceOrientation = this.deviceOrientation;
    },

    /**
     * Required to test against different user agents
     * @return string The userAgent in lowercase.
     */
    _getUserAgent: function() {
        return navigator.userAgent.toLowerCase();
    },

    /**
     * Set the current device OS, based on the userAgent string.
     */
    setDeviceOS: function() {
        this.deviceOS = 'null';
        var userAgent = MM._getUserAgent();
        if (userAgent.indexOf('ipad') !== -1) {
            this.deviceOS = 'ios';
        } else if (userAgent.indexOf('iphone') !== -1) {
            this.deviceOS = 'ios';
        } else if (userAgent.indexOf('android') !== -1) {
            this.deviceOS = 'android';
        }
    },

    /**
     * Set the inComputer flag if the app is running in a computer (as opposed to
     * a mobile device).
     */
    setInComputerState: function() {
        MM.inComputer = navigator.userAgent.indexOf('Chrome') >= 0 ||
                        navigator.userAgent.indexOf('Safari') >= 0 ||
                        navigator.userAgent.indexOf('MSIE') >= 0 ||
                        navigator.userAgent.indexOf('Firefox') >= 0;
        MM.inComputer = MM.inComputer && navigator.userAgent.indexOf('Mobile') == -1;
        // Check deviceOs
        MM.inComputer = MM.deviceOS != "ios" && MM.deviceOS != "android";
        // Check if Phonegap Javascript is loaded.
        MM.inComputer = MM.inComputer && typeof(window.device) == "undefined";
        MM.inComputer = MM.inComputer && !MM.deviceReady;

        MM.webApp = location.href.indexOf('http') == 0;
    },

    /**
     * Load the cordova emulator if necessary (if the app isn't running on a
     * mobile device).
     */
    loadCordova: function() {
        // If we are testing in a computer, we load the Cordova emulating javascript, waiting a few seconds.
        // If meanwhile Phonegap is loaded, the loadEmulator will do nothing.
        if (MM.inComputer || MM.webApp) {
            setTimeout(function() {
                MM.log('MM: Loading Cordova Emulator, we are in a ' + navigator.userAgent);
                MM.cordova.loadEmulator();
            }, 5000);
        }
    },

    beforeRoute:function(route, name) {
        if (MM.currentPlugin !== undefined) {
            // Is the route we're going to in this plugin?
            var found = _.find(MM.currentPlugin.routes, function(pluginRoute) {
                return pluginRoute[0] == route;
            });

            // If it's not then the plugin needs to clean up after itself.
            if (found === undefined) {
                if (MM.currentPlugin.cleanUp !== undefined &&
                    typeof(MM.currentPlugin.cleanUp) == "function"
                ) {
                    MM.currentPlugin.cleanUp();
                }

                MM.panels.resetView();
            }
        }
    },

    afterRoute: function(route, name) {
        if (MM.currentPlugin !== undefined) {
            MM.currentPlugin.resize();
            window.scrollTo(0,0);
        }
    },

    /**
     * Load the Backbone URL router.
     * Monkey patch to include a beforeRoute and afterRoute event
     * https://github.com/jashkenas/backbone/pull/494
     */
    loadBackboneRouter: function() {
        var appRouter = Backbone.Router.extend({
            route:function(route, name, callback) {
                return Backbone.Router.prototype.route.call(
                    this, route, name, function() {
                        MM.beforeRoute(route, name);
                        callback.apply(this, arguments);
                        MM.afterRoute(route, name);
                    }
                );
            }
        });
        MM.Router = new appRouter;
    },

    /**
     * Set default values for future ajax requests.
     * Even jQuery say this isn't recommended.
     * TODO: Remove.
     */
    checkAjax: function() {
        $.ajaxSetup({'error': MM._defaultErrorFunction});
    },

    /**
     * The default error function as set in MM.checkAjax
     * Moved outside of checkAjax for ease of testing.
     */
    _defaultErrorFunction: function(xhr, textStatus, errorThrown) {
    },

    /**
     * Load the core models.
     * @param {integer} myParam Description
     * @return {boolean} Description
     */
    registerCoreModels: function() {
        // Load Models.
        // Elements for the core storage model.
        MM.storage = {
            setting: {
                type: 'model',
                global: true,
                bbproperties: {
                    initialize: function() {
                        MM.config[this.get('name')] = this.get('value');
                   }
                }
            },
            settings: {type: 'collection', model: 'setting', global: true},
            site: {type: 'model', 'global':true},
            sites: {type: 'collection', model: 'site', 'global':true},
            user: {type: 'model'},
            users: {type: 'collection', model: 'user'},
            cacheEl: {type: 'model'},
            cache: {type: 'collection', model: 'cacheEl'},
            syncEl: {type: 'model'},
            sync: {type: 'collection', model: 'syncEl'},
            course: {type: 'model'},
            courses: {type: 'collection', model: 'course'}
        };
    },

    /**
     * Loads the settings from the database, putting each name value pair
     * in the config.
     * @return {void}
     */
    loadSettings: function() {
        // Load settings from database.
        var siteSpecific = MM.db.getSiteConfig();

        _.each(siteSpecific, function(setting) {
            MM.config[setting.get('name')] = setting.get('value');
        });
    },

    /**
     * Generic function for getting config settings.
     *
     * @param {string}  name     Name of the setting
     * @param {string}  optional Optional value if the config doesn't exist
     */
    getConfig: function(name, optional) {
        if (typeof MM.config[name] != 'undefined') {
            return MM.config[name];
        }

        if (typeof optional != 'undefined') {
            return optional;
        }

        return;
    },

    /**
     * Generic function for setting config settings.
     * Config sites can be global (default) or by site (you need to specify the flag site then)
     * @param {String}  name  The name of the setting
     * @param {String}  value The value of the setting
     * @param {Boolean} site  TRUE if the config is site specific, FALSE otherwise.
     */
    setConfig: function(name, value, site) {
        var setting = {
            id: name,
            name: name,
            value: value
        };

        MM.db.insert('settings', setting);
    },

    /**
     * Used to test the deviceConnected function as Jasmine can't mock
     * the navigator object.
     *
     * @return {Object} The network object if one exists.
     */
    _getNetwork: function() {
        return navigator.network;
    },

    /**
     * Checks if the device is connected to Internet
     * We use Cordova API for that, if the config setting "dev_offline" is set we return allways not connected.
     *
     * @return {boolean} True if the device is connected.
     */
    deviceConnected: function() {
        var connected = true;

        var network = MM._getNetwork();
        if (typeof(network) != 'undefined') {
            var networkState = network.connection.type;
            connected = (networkState != Connection.NONE && networkState != Connection.UNKNOWN);
            MM.log('Internet connection checked ' + connected);
        }

        var offline = MM.getConfig('dev_offline');
        if (typeof(offline) != 'undefined' && offline) {
            // Ugly hack for only emulate offline if we are logged in the app.
            var displayed = $('#main-wrapper').css('display');
            if (displayed == 'block') {
                MM.log('Returning not connected (forced by settings)');
                connected = false;
            }
        }
        return connected;
    },

    /**
     * Loads the non site specific CSS layout of the app and handles orientation/state changes.
     */
    loadLayout: function() {
        MM.log('Loading layout');

        // Load up all the models required for storage
        this.loadGlobalModels(MM.storage);

        // Load the settings that populate the global storage collections.
        this.loadSettings();

        if (typeof MM.config.presets.url != 'undefined') {
            $('#url').val(MM.config.presets.url);
        }
        if (typeof MM.config.presets.username != 'undefined') {
            $('#username').val(MM.config.presets.username);
        }

        $(window).bind('orientationchange', MM.orientationChangeHandler);

        var mq = matchMedia(MM.mq);
        mq.addListener(MM.mediaQueryChangeHandler);
        if (mq.matches) {
            MM.setUpTabletModeLayout();
        } else {
            MM.setUpPhoneModeLayout();
        }

        // Make the background color fill all the screen for the add site page.
        $('#add-site').css('height', $(document).innerHeight());

        $("#panel-left, #panel-center, #panel-right").addClass("overflow-scroll");

        // First we try to use native scrolling for overflow divs.
        if (MM.util.isTouchDevice() && MM.util.overflowScrollingSupported()){
            MM.setUpOverflowScrolling();
        } else {
            if (MM.deviceType == "phone" && !MM.util.overflowScrollingSupported()) {
                MM.setUpNativeScrolling();
            } else {
                MM.setUpJavascriptScrolling();
            }
        }

        // Display the add site screen if no sites added.
        var current_site = MM.getConfig('current_site');

        if (typeof(current_site) != 'undefined' &&
            current_site &&
            current_site.id &&
            MM.db.get('sites', current_site.id)
        ) {
            MM.loadSiteModels(MM.storage);

            // We should wait for Phonegap/Cordova prior to start calling WS, etc..
            MM.loadSite(current_site.id);
        } else {
            var tpl = MM.tpl.render(
                $('#add-site_template').html(),
                {'sites':MM.db.all('sites').models}
            );
            $('#add-site').html(tpl);

            // Add site events.
            $('#add-site form').on('submit', this.addSite);

            $('#url').combobox();
            $(document).on('combobox:select', function(event, ui) {
                var val = ui.item.value;
                var site = MM.db.where('sites', {'siteurl':val});
                if (site.length > 0) {
                    var site = site[0];
                    $("#url").combobox('setValue', val);
                    $('#username').val(site.get('username'));
                    $('.remember-option[data-option=1]').trigger('click');
                }

                return false;
            });
            $("#url").combobox('setValue', document.location.origin + MM.getConfig('installationdir'));

            // Display the initial screen in first access.
            $('#add-site').css('display', 'block');

            // Add listeners
            $(".remember-option").on('click', function() {
                $('.remember-option.selected').removeClass('selected');
                $(this).addClass('selected');
                if ($(this).data('option') === 1) {
                    var url = $("#url").combobox('value');
                    var username = $("#username").val();

                    // If the site exists AND we have a token already, then
                    // the user doesn't need to login.
                    if (MM._siteExists(url, username) === true &&
                        MM.db.get('sites', hex_md5(url + username)).get('token') !== undefined
                    ) {
                        $("#add-site #password").css('visibility', 'hidden');
                    }
                } else {
                    $("#add-site #password").css('visibility', 'visible');
                }

                return false;
            });
        }

        // Load additional Js files, see MOBILE-239
        MM.loadExtraJs();

        $(document).trigger('layoutLoaded');

        return true;
    },

    /**
     * Handle device orientation change events.
     * @param {object} e The event object.
     */
    orientationChangeHandler: function(e) {
        MM.log("MM: orientationchange fired, old width old height " + $(document).innerHeight());
        $('#main-wrapper, #panel-left').css('height', $(document).innerHeight());

        var dH = $(document).height();
        var wH = $(window).height();
        var diH = $(document).innerHeight();

        var newH = (dH > wH) ? dH : wH;
        newH = (diH > newH) ? diH : newH;

        headerHeight = $('header.header-main').height();
        $('#main-wrapper').css('height', newH);
        $('#panel-left, #panel-center, #panel-right').css(
            'height', newH - headerHeight
        );

        var attributes = {
            maximum_available_height:(newH - headerHeight)
        };
        $(document).trigger('orientation_change', attributes);

        MM.log("MM: orientation change fired, new height " + newH);
    },

    /**
     * Handle media query change events, refresh the viewport.
     * @param {object} mq The media query object.
     */
    mediaQueryChangeHandler: function(mq) {
        MM.log('media queries match');
        if (mq.matches && MM.deviceType == 'phone') {
            // We were in phone resolution view, now we are in tablet resolution view. Reload all the layout.
            location.href = "index.html";
        } else if (!mq.matches && MM.deviceType == 'tablet') {
            // We were in tablet resolution view, now we are in phone view. Reload all the layout
            location.href = "index.html";
        }
    },

    /**
     * Set up tablet mode layout.
     */
    setUpTabletModeLayout: function() {
        // Swipe detection.
        $('#panel-center, #panel-right').swipe({
            swipeLeft: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe' + direction + ' fingers ' + fingerCount);
                MM.navigation.hide();
            },
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe' + direction + ' fingers ' + fingerCount);
                MM.navigation.show();
            },
            click: function(event, direction, distance, duration, fingerCount) {
            },
            threshold: 50,
            excludedElements: "button, input, select, textarea, .noSwipe, a"
        });
    },

    /**
     * Set up phone mode layout.
     */
    setUpPhoneModeLayout: function() {
        $('#panel-center, #panel-right').swipe({
            swipeRight: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe right');
                MM.panels.goBack();
            },
            swipeLeft: function(event, direction, distance, duration, fingerCount) {
                MM.log('Swipe left');
                MM.panels.goFront();
            },
            click: function(event, direction, distance, duration, fingerCount) {
            },
            threshold: 50,
            excludedElements: "button, input, select, textarea, .noSwipe, a"
        });
    },

    /**
     * Set up overflow scrolling.
     */
    setUpOverflowScrolling: function() {
        MM.log('Overflow supported');
        MM.scrollType = "Native overflow scrolling touch";
        MM.util.setPanelsScreenHeight();
        $("#panel-left, #panel-center, #panel-right").addClass("touch-overflow-scroll");
        // We must detect that are touch moving for avoid opening links fired by javascript events...
    },

    /**
     * Set up native scrolling.
     */
    setUpNativeScrolling: function() {
        MM.log("Omitting using overflow scroll");
        MM.scrollType = "Native scrolling";
        MM.util.setPanelsMinScreenHeight();
        $("#main-wrapper").css("overflow", "visible");
        $("#panel-left, #panel-center, #panel-right").addClass("no-overflow");
        MM.util.avoidHorizontalScrolling();
    },

    /**
     * Set up javascript scrolling.
     */
    setUpJavascriptScrolling: function() {
        MM.scrollType = "Javascript scrolling";
        MM.util.setPanelsScreenHeight();
        // These lines makes the iPad scroll working (not momentum).
        MM.util.touchScroll('left');
        MM.util.touchScroll('center');
        MM.util.touchScroll('right');
    },

    /**
     * Loads the HTML and CSS specific for a site.
     *
     * @param {string} siteId The site id.
     */
    loadSite: function(siteId) {
        MM.log('Loading site');
        MM.site = MM.db.get('sites', siteId);
        MM.sync.init();
        MM.setUpConfig();
        MM.setUpLanguages();
        MM.isOnline();
        MM.updateMenuItemsIndicators();
        MM.setUpTouchMoveDetection();
        setInterval(MM.updateMenuItemsIndicators, MM.getConfig('menu_items_indicators_update_interval'));
        // Top menu
        // Menu items for the navigation bar:
        var menu_items = MM.config.menu_items;
        var values = _.reduce(menu_items, function(memo, menu_item_name) {
            if (MM.plugins[menu_item_name] !== undefined) {
                var menu_item = MM.plugins[menu_item_name];
                var item = {};
                item.href = menu_item.settings.menuURL;
                item.name = menu_item.settings.name;
                item.id = menu_item.settings.name;
                item.title = menu_item.settings.title;
                item.icon = menu_item.settings.icon;
                item.alticon = menu_item.settings.alticon;
                memo.push(item);
            }

            return memo;
        }, []);

        var output = MM.tpl.render(
            $("#top_bar_template").html(),
            {
                'menu_items':values
            }
        );
        MM.panels.html('top', output);

        $('#mainmenu').bind(MM.quickClick, function(e) {
            var visible = MM.navigation.toggle();
            $(document).trigger('side_menu_toggled', visible);
            e.preventDefault();
            e.stopPropagation();
        });

        $("#panel-top").find("a.item").on(MM.quickClick, function(e) {
            var element = $(e.target).closest("a");
            var href = element.attr('href');
            if (MM.navigation.visible === true) {
                MM.navigation.toggle();
            }
            MM.Router.navigate(href, {trigger:true});
            return false;
        });

        // Hide the Add Site panel.
        $('#add-site').css('display', 'none');
        // Display the main panels.
        $('#main-wrapper').css('display', 'block');

        // Sites loaded, tell things that rely on the site
        $(document).trigger('siteLoaded');
        window.addEventListener('orientationchange', MM.getDeviceOrientation);
    },

    setUpTouchMoveDetection: function() {
        $("body").on("touchmove", function() {
            MM.touchMoving = true;
        });
        $("body").on("touchstart", function() {
            MM.touchMoving = false;
        });
    },

    /**
     * Set up config.
     */
    setUpConfig: function() {
        if (MM.config.current_site.id != MM.site.id) {
            MM.setConfig('current_site', MM.site.toJSON());
        }
        MM.setConfig('current_token', MM.site.get('token'));
    },

    /**
     * Set up languages.
     */
    setUpLanguages: function() {
        MM.lang.setup();
        for (var el in MM.config.plugins) {
            var index = MM.config.plugins[el];
            var plugin = MM.plugins[index];
            if (typeof plugin == 'undefined') {
                continue;
            }
            if (plugin.settings.lang.component != "core") {
                MM.lang.setup(plugin.settings.name);
            }
        }
        MM.lang.sync();
    },

    /**
     * Load cached remote CSS.
     */
    loadCachedRemoteCSS: function() {
        // For ios, better to use CSS3 transitions (hardware accelerated).
        if (MM.deviceOS == 'ios') {
            MM.setConfig('dev_css3transitions', true);
        }

        // Init sync processes.
        MM.sync.init();

        // Load cached remote CSS
        var remoteCSS = MM.cache.getElement('css', true);
        if (remoteCSS) {
            $('#mobilecssurl').html(remoteCSS);
        } else {
            $('#mobilecssurl').html('');
        }

        // Sync CSS and lang
        MM.sync.css();
        MM.lang.sync();
    },

    getClickType: function() {
        return MM.clickType;
    },

    /**
     * Show add site panel
     */
    showAddSitePanel: function() {
        $('#add-site').css('display', 'block');
    },

    /**
     * Prepare a site to be stored in the database.
     *
     * @param {!Object} Javascript event.
     */
    addSite: function(e) {

        e.preventDefault();

        var siteurl = $.trim($('#url').combobox('value'));
        var username = $.trim($('#username').val());
        var password = $.trim($('#password').val());
        var remember = !!$('.remember-option.selected').data('option');

        // Convert siteurl to lower case for avoid validation problems. See MOBILE-294
        siteurl = siteurl.toLowerCase();

        // Does the site already exist?
        // If yes, replace remember and log in.
        // If no, check for all the details
        if (MM._siteExists(siteurl, username) && remember === true) {
            var site = MM.db.get('sites', hex_md5(siteurl + username));
            site.set({'remember':remember});

            // Save the site as the 'current' site
            MM.setConfig('current_site', site.toJSON());

            // Now we have a 'current' site, we can set up the storage
            // required for it.
            MM.loadSiteModels(MM.storage);

            MM.loadSite(site.id);

            MM.closeModalLoading();
        } else {
            // Check for keywords for demo sites
            if (username && !siteurl && !password) {
                $.each(MM.config.demo_sites, function (index, site) {
                    if (username == site.key) {
                        siteurl = site.url;
                        username = site.username;
                        password = site.password;
                        return false; // break
                    }
                });
            }

            // Delete the last / if present
            if (siteurl.charAt(siteurl.length - 1) == '/') {
                siteurl = siteurl.substring(0, siteurl.length - 1);
            }

            var stop = false;
            var msg = '';

            // If localhost doesn't feature in the url and the url doesn't validate
            // then stop.
            // We are not going to do this anymore see https://tracker.moodle.org/browse/MOBILE-453.
            if (siteurl.indexOf('http://localhost') == -1 && !MM.validateURL(siteurl)) {
                msg += MM.lang.s('siteurlrequired') + '<br/>';
                stop = true;
            }

            if (!username) {
                msg += MM.lang.s('usernamerequired') + '<br/>';
                stop = true;
            }
            if (!password) {
                msg += MM.lang.s('passwordrequired');
                stop = true;
            }

            if (stop) {
                MM.popErrorMessage(msg);
                return;
            }
            MM.saveSite(username, password, siteurl, remember);
        }
    },

    /**
     * Validates a URL for a specific pattern.
     * @param {String} url The url to test against the pattern
     * @return {bool} TRUE if the url matches the expected pattern.
     *                FALSE otherwise.
     */
    validateURL: function(url) {
/*
schema      (https?|ftp):\/\/
basic auth  (((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?
ip address  (((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|
subdomain   ((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+
domain      (([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)
port        (:\d*)?)
controller  (\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+
method      (\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?
arguments   (\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?
anchor      (\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
*/
        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url)
    },

    /**
     * Saves a site in the database
     *
     * @param {string} username User name.
     * @param {string} password Password.
     * @param {string} siteurl The site url.
     * @param {bool}   remember Whether to autofill the siteURL/username on login
     * @return {boolean} Allways returns false
     */
    saveSite: function(username, password, siteurl, remember) {
        MM.showModalLoading(MM.lang.s("authenticating"));
        var loginURL = siteurl + '/login/token.php';
        MM.siteurl = siteurl;
        // Now, we try to get a valid token.
        $.ajax({
            url:loginURL,
            type:'POST',
            timeout: 10000,
            data:{
                username: username,
                password: password,
                service: MM.config.wsservice
            },
            dataType:"json",
            success:function(json) {
                MM.widgets.dialogClose();
                if (typeof(json.token) != 'undefined') {

                    // After getting a token, log-in the user, so they can access
                    // SCORM content straight-away.
                    MM.processMainSiteLogin(siteurl, username, password);

                    var mytoken = json.token;
                    MM.setConfig('current_token', mytoken);
                    var preSets = {
                        wstoken: mytoken,
                        siteurl: MM.siteurl,
                        silently: true,
                        cache: 0
                    };

                    // We have a valid token, try to get the site info.
                    MM.moodleWSCall('moodle_webservice_get_siteinfo', {}, function(d) {
                        // Now we check for the minimum required version.
                        // We check for WebServices present, not for Moodle version.
                        // This may allow some hacks like using local plugins for adding missin functions in previous versions.
                        var validMoodleVersion = false;
                        $.each(d.functions, function(index, el) {
                            // core_get_component_strings Since Moodle 2.4
                            if (el.name.indexOf("component_strings") > -1) {
                                validMoodleVersion = true;
                                return false;
                            }
                        });
                        if (!validMoodleVersion) {
                            MM.popErrorMessage(MM.lang.s('invalidmoodleversion') + "2.6");
                            return false;
                        }

                        // Create the credentials for this site
                        d.id = hex_md5(d.siteurl + username);
                        d.token = mytoken;
                        d.remember = remember;

                        // Save the site as the 'current' site
                        MM.setConfig('current_site', d);

                        // Now we have a 'current' site, we can set up the storage
                        // required for it.
                        MM.loadSiteModels(MM.storage);

                        // Finally add the site to the DB.
                        var site = MM.db.insert('sites', d);
                        MM.loadSite(site.id);

                        MM.closeModalLoading();
                    }, preSets);
                } else {
                    MM.widgets.dialogClose();
                    var error = MM.lang.s('invalidaccount');
                    if (typeof(json.error) != 'undefined') {
                        error = json.error;
                    } else {
                        // On an error, we try http instead https if possible.
                        if (siteurl.indexOf("https://") === 0) {
                            MM.saveSite(username, password, siteurl.replace("https://", "http://"));
                            return;
                        }
                    }
                    MM.popErrorMessage(error);
                }
            },
            error:function(xhr, textStatus, errorThrown) {
                // On an error, we try http instead https if possible.
                if (MM.siteurl.indexOf("https://") === 0) {
                    MM.saveSite(username, password, MM.siteurl.replace("https://", "http://"));
                    return;
                }
                var error = MM.lang.s('cannotconnect');
                if (xhr.status == 404) {
                    error = MM.lang.s('invalidscheme');
                }
                MM.popErrorMessage(error);
            }
        });
        return false;
    },

    _siteExists: function(url, username) {
        return MM.db.get('sites', hex_md5(url + username)) !== undefined;
    },

    /**
     * Register a plugin in the main Namespaces "MM"
     * This makes possible to access all the plugin functions and variables from the main namespace.
     * This function is called when a module is being loaded.
     *
     * @param {!Object} And object representing a plugin.
     */
    registerPlugin: function(plugin) {
        var pluginName = plugin.settings.name;

        // Load the plugin in the main Namespace.
        this.plugins[pluginName] = plugin;

        for (var el in plugin.routes) {
            var route = plugin.routes[el];
            // Route[0] URL to match, Route[1] id, Route[2] function to call on match.
            this.Router.route(route[0], route[1], this.plugins[pluginName][route[2]]);
        }

        // For each plugin record which storage requirements it needs.
        for (var el in plugin.storage) {
            MM.storage[el] = plugin.storage[el];
        }

        // Load default strings.
        if (plugin.settings.lang.component != 'core') {
            MM.lang.loadPluginLang(pluginName, JSON.parse(plugin.settings.lang.strings));
        }

        // Sync hooks (like cron jobs)
        if (typeof(plugin.sync) != 'undefined') {
            MM.sync.registerHook(pluginName, plugin.sync);
        }

        $(document).trigger('pluginLoaded', plugin);
    },

    /**
     * Creates a new store for the specified model name.
     *
     * @param {String} The model name to make a store in respect of.
     *
     * @return {Store} A store object for the model.
     */
    _createNewStore: function(modelName) {
        return new Store(modelName);
    },

    /**
     * Loads backbone Models which are site specific. Goes through the supplied
     * elements looking for those with the 'global' property not true
     *
     * @param {Array.<Object>} elements The models to be loaded
     */
    loadSiteModels: function(elements) {
        for (var el in elements) {
            var obj = elements[el];
            if (obj.global !== true) {
                // This allow plugins to load Backbone properties to models and collections.
                if (typeof obj.bbproperties == 'undefined') {
                    obj.bbproperties = {};
                }

                if (obj.type == 'model') {
                    this.models[el] = Backbone.Model.extend(obj.bbproperties);
                } else if (obj.type == 'collection') {
                    obj.bbproperties.model = this.models[obj.model];
                    obj.bbproperties.localStorage = MM._createNewStore(el);
                    var col = Backbone.Collection.extend(obj.bbproperties);

                    // Now the instance.
                    if (this.collections[MM.config.current_site.id] === undefined) {
                        this.collections[MM.config.current_site.id] = {};
                    }
                    this.collections[MM.config.current_site.id][el] = new col();
                }
            }
        }
    },

    /**
     * Loads backbone Models which are global ( not site specific ). Goes through
     * the supplied elements looking for those with the 'global' property set to
     * true.
     *
     * @param {Array.<Object>} elements The models to be loaded.
     */
    loadGlobalModels: function(elements) {
        for (var el in elements) {
            var obj = elements[el];
            if (obj.global === true) {
                // This allow plugins to load Backbone properties to models and collections.
                if (typeof obj.bbproperties == 'undefined') {
                    obj.bbproperties = {};
                }

                if (obj.type == 'model') {
                    this.models[el] = Backbone.Model.extend(obj.bbproperties);
                } else if (obj.type == 'collection') {
                    obj.bbproperties.model = this.models[obj.model];
                    obj.bbproperties.localStorage = MM._createNewStore(el);
                    var col = Backbone.Collection.extend(obj.bbproperties);

                    // Now the instance.
                    this.collections[el] = new col();
                }
            }
        }
    },

    /**
     * Loads backbone routes.
     */
    loadRoutes: function() {
        var routes = [
            ['helpmelogin', 'helpmelogin', MM.util.helpMeLogin],
            ['logout', 'logout', MM.logoutUser],
            ['refresh', 'refresh', MM.refresh]
        ];

        for (var el in routes) {
            var route = routes[el];
            MM.Router.route(route[0], route[1], route[2]);
        }
    },

    /**
     * Verifies the presets, setting them to default values in the event
     * they don't exist.
     * @param {Object} preSets The presets to check
     * @return {Object} The completed list of presets.
     */
    _verifyPresets: function(preSets) {
        if (typeof(preSets) == 'undefined' || preSets == null) {
            preSets = {};
        }
        if (typeof(preSets.cache) == 'undefined') {
            preSets.cache = 1;
        }
        if (typeof(preSets.sync) == 'undefined') {
            preSets.sync = 0;
        }
        if (typeof(preSets.silently) == 'undefined') {
            preSets.silently = false;
        }
        if (typeof(preSets.omitExpires) == 'undefined') {
            preSets.omitExpires = false;
        }

        if (typeof(preSets.wstoken) == 'undefined') {
            preSets.wstoken = MM.config.current_token;
            if (!preSets.wstoken) {
                MM.popErrorMessage(MM.lang.s("unexpectederror"));
                return false;
            }
        }

        if (typeof(preSets.siteurl) == 'undefined') {
            preSets.siteurl = MM.config.current_site.siteurl;
            if (!preSets.siteurl) {
                MM.popErrorMessage(MM.lang.s("unexpectederror"));
                return false;
            }
        }

        return preSets;
    },

    /**
     * Gets the data from the cache if the presets have opted we can use
     * the cache.
     * @param {Object}   preSets       Preset values for this call.
     * @param {Object}   ajaxData      The data to send with the ajax call
     * @param {Function} callBack      The callback to use in the event of success
     * @param {Function} errorCallBack The callback to use in the event of failure.
     * @return {void}
     */
    _getDataFromCache: function(preSets, ajaxData, callBack, errorCallBack) {
        // Try to get the data from cache.
        if (preSets.cache) {
            // In case the device is not connected, we prefer expired cache than nothing.
            var omitExpires = !MM.deviceConnected() || preSets.omitExpires;

            var data = MM.cache.getWSCall(preSets.siteurl, ajaxData, omitExpires);

            if (data !== false) {
                callBack(data);
                return true;
            } else if (!MM.deviceConnected()) {
                if (errorCallBack) {
                    errorCallBack();
                } else {
                    MM.popErrorMessage(MM.lang.s('networkerrormsg'));
                }
                return true;
            }
        }

        return false;
    },

    /**
     * Converts an objects values to strings where appropriate.
     * Arrays (associative or otherwise) will be maintained.
     *
     * @param {Object} data The data that needs all the non-object values set
     *                      to strings.
     *
     * @return {Object} The cleaned object, with multilevel array and objects
     *                  preserved.
     */
    _convertValuesToString: function(data) {
        var result = [];
        if (!_.isArray(data) && _.isObject(data)) {
            result = {};
        }
        for (var el in data) {
            if (_.isObject(data[el])) {
                result[el] = MM._convertValuesToString(data[el])
            } else {
                result[el] = data[el] + '';
            }
        }
        return result;
    },

    /**
     * A wrapper function for a moodle WebService call.
     *
     * @param {string} method The WebService method to be called.
     * @param {Object} data Arguments to pass to the method.
     * @param {Object} callBack Function to be called in success.
     * @param {Object} preSets Extra settings
     *      cache For avoid using caching
     *      sync For indicate that is a call in a sync process
     *      silently For not raising erronors.
     */
    moodleWSCall: function(method, data, callBack, preSets, errorCallBack, backgroundTask) {

        // Optional arg if true, moodleWSCall won't call MM.closeModalDialog on success
        backgroundTask = (typeof backgroundTask === "undefined") ? false : backgroundTask;

        var data = MM._convertValuesToString(data);
        preSets = MM._verifyPresets(preSets);

        data.wsfunction = method;
        data.wstoken = preSets.wstoken;

        preSets.siteurl += '/webservice/rest/server.php?moodlewsrestformat=json';
        var ajaxData = data;

        // Check if the device is Online, if not add operation to queue.
        if (preSets.sync) {
            if (!MM.deviceConnected()) {
                var el = {
                    id: hex_md5(preSets.siteurl + JSON.stringify(ajaxData)),
                    url: preSets.siteurl,
                    data: ajaxData,
                    syncData: preSets.syncData,
                    siteid: MM.config.current_site.id,
                    type: 'ws'
                };
                MM.db.insert('sync', el);
                MM.popMessage(MM.lang.s('addedtoqueue'), {title: preSets.syncData.name});
                return true;
            }
        }

        if (MM._getDataFromCache(preSets, ajaxData, callBack, errorCallBack)) {
            return true;
        }

        // If we arrive here, and we are not connected, thrown a network error message.
        if (!MM.deviceConnected()) {
            if (errorCallBack) {
                errorCallBack();
            } else {
                MM.popErrorMessage(MM.lang.s('networkerrormsg'));
            }
            return true;
        }

        if (!preSets.silently && preSets.showModalLoading) {
            MM.showModalLoading(MM.lang.s("loading"));
        }

        // Main jQuery Ajax call, returns in json format.
        $.ajax({
            type: 'POST',
            url: preSets.siteurl,
            data: ajaxData,
            dataType: 'json',

            success: function(data) {
                // Some moodle web services return null.
                // If the responseExpected value is set then so long as no data
                // is returned, we create a blank object.
                if (!data && !preSets.responseExpected) {
			        data = {};
                }

                if (!data) {
                    if (errorCallBack) {
                        errorCallBack();
                    }
                    return;
                }

                if (typeof(data.exception) != 'undefined') {
                    MM.closeModalLoading();
                    if (data.errorcode == "invalidtoken" || data.errorcode == "accessexception") {
                        MM.popMessage(MM.lang.s("lostconnection"));

                        // TODO: Rewrite setTimeout to work off an event call instead.
                        return;
                    } else {
                        if (errorCallBack) {
                            errorCallBack(MM.lang.s("error") + ": " + data.message);
                        } else {
                            MM.popErrorMessage(MM.lang.s("error") + ": " + data.message);
                        }
                        return;
                    }
                }

                if (typeof(data.debuginfo) != 'undefined') {
                    MM.closeModalLoading();
                    if (errorCallBack) {
                        errorCallBack(MM.lang.s("error") + ": " + data.message);
                    } else {
                        MM.popErrorMessage(MM.lang.s("error") + ": " + data.message);
                    }
                    return;
                }

                MM.log('WS: Data received from WS '+ typeof(data));

                if (typeof(data) == 'object' && typeof(data.length) != 'undefined') {
                    MM.log('WS: Data number of elements '+ data.length);
                }

                if (preSets.cache) {
                    MM.cache.addWSCall(preSets.siteurl, ajaxData, data);
                }

                if (!backgroundTask) {
                    MM.closeModalLoading();
                }

                // We pass back a clone of the original object, this may
                // prevent errors if in the callback the object is modified.
                callBack(JSON.parse(JSON.stringify(data)));
            },
            error: function(xhr, ajaxOptions, thrownError) {
                MM.closeModalLoading();

                var error = MM.lang.s('cannotconnect');
                if (xhr.status == 404) {
                    error = MM.lang.s('invalidscheme');
                }
                if (!preSets.silently) {
                    MM.popErrorMessage(error);
                } else {
                    MM.log('WS: error on ' + method + ' error: ' + error);
                }
                if (errorCallBack) {
                    errorCallBack();
                }
            }
        });
    },

    /**
     * Uploads a file to Moodle using Cordova File API
     *
     * @param {Object} data Arguments to pass to the method.
     * @param {Object} fileOptions File settings.
     * @param {Object} successCallBack Function to be called on success.
     * @param {Object} errorCallBack Function to be called on error.
     * @param {Object} preSets Extra settings.
     */
    moodleUploadFile: function(data, fileOptions, successCallBack, errorCallBack, presets) {
        MM.log('Trying to upload file ('+ data.length + ' chars)', 'Sync');
        if (!MM.deviceConnected()) MM.handleDisconnectedFileUpload(data, fileOptions);

        MM.log('Initializing uploader');
        var options = MM._wsGetFileUploadOptions();
        options.fileKey = fileOptions.fileKey;
        options.fileName = fileOptions.fileName;
        options.mimeType = fileOptions.mimeType;
        options.params = {
            token:MM.config.current_token
        };

        MM.log('Uploading');
        MM.showModalLoading(MM.lang.s("uploading"), MM.lang.s('uploadingtoprivatefiles'));
        var ft = MM._wsGetFileTransfer();
        ft.upload(
            data,
            MM.config.current_site.siteurl + '/webservice/upload.php',
            function() {
                MM.closeModalLoading();
                successCallBack();
            },
            function() {
                MM.closeModalLoading();
                errorCallBack();
            },
            options
        );
    },

    /**
     * Handle disconnected file uploads (user tries to upload while device is
     * disconnected). Log the sync attempt, and pop up a message for theuser.
     * @param {object} json The JSON response.
     */
    handleDisconnectedFileUpload: function(data, fileOptions) {
        var el = {
            id: hex_md5(MM.config.current_site.siteurl + JSON.stringify(fileOptions)),
            data: data,
            options: fileOptions,
            syncData: {
                name: MM.lang.s('upload'),
                description: fileOptions.fileName
            },
            siteid: MM.config.current_site.id,
            type: 'upload'
        };
        MM.db.insert('sync', el);
        MM.popMessage(MM.lang.s('addedtoqueue'), {title: el.syncData.name});
        return true;
    },

    /**
     * Downloads a file from Moodle using Cordova File API
     *
     * @param {string} url Download url.
     * @param {Object} path Object with file path under the 'file' key
     * @param {Object} successCallBack Function to be called on success.
     * @param {Object} errorCallBack Function to be called on error.
     */
    moodleDownloadFile: function(url, path, successCallBack, errorCallBack) {

        // Set the Root in the persistent file system.
        path = MM.fs.getRoot() + '/' + path.file;

        var ft = MM._wsGetFileTransfer();
        ft.download(url, path,
            function() {
                successCallBack(path);
            },
            function() {
                errorCallBack(path);
            }
        );
    },

    /**
     * Launches the WS sync process for operations done offline
     * There is a queue of tasks performed when the device was offline.
     */
    wsSync: function() {
        MM.log('Executing WS sync process', 'Sync');
        var syncWsOn = MM.getConfig('sync_ws_on');
        if (!syncWsOn) {
            MM.log('WS sync process is disabled', 'Sync');
        }
        if (MM.deviceConnected() && syncWsOn) {
            MM.db.each('sync', MM._wsSyncType);
        }
    },

    /**
     * Function called from MM.wsSync, called for each possible sync type
     * Separated for ease of testing.
     * @param {Object} Backbone Object specifying what to sync based on type of
     *                 the underlying object
     */
    _wsSyncType: function(sync) {
        sync = sync.toJSON();
        switch (sync.type) {
            case 'ws':
                MM.syncWebService(sync);
                break;
            case 'upload':
                MM.syncUpload(sync);
                break;
            case 'content':
                MM.syncDownload(sync);
                break;
        }
    },

    /**
     * Performs a web service sync.
     */
    wsSyncWebService: function(sync) {
        MM.log('Executing WS sync operation:' + JSON.stringify(sync.syncData) + ' url:' + sync.url, 'Sync');
        MM.moodleWSCall(sync.data.wsfunction, sync.data, function(d) {
            MM.log('Executing WS sync operation FINISHED:' + sync.data.wsfunction, 'Sync');
            MM.db.remove('sync', sync.id);
        }, {cache: 0, silently: true});
    },

    /**
     * Returns a FileTransfer object used by wsSyncUpload
     * Function created for ease of testing.
     * @return {Object} FileTransfer Object
     */
    _wsGetFileTransfer: function() {
        return new FileTransfer();
    },

    /**
     * Returns a FileUploadOptions object used by wsSyncUpload
     * Function created for ease of testing.
     * @return {Object} FileUploadOptions Object
     */
    _wsGetFileUploadOptions: function() {
        return new FileUploadOptions();
    },

    /*
     * Performs a file upload sync.
     */
    wsSyncUpload: function(sync) {
        MM.log('Starting upload', 'Sync');
        var ft = MM._wsGetFileTransfer();
        var params = {token: MM.config.current_token};
        var options = MM._wsGetFileUploadOptions();
        options.fileKey = sync.options.fileKey;
        options.fileName = sync.options.fileName;
        options.mimeType = sync.options.mimeType;
        options.params = params;
        ft.upload(
            sync.data,
            MM.config.current_site.siteurl + '/webservice/upload.php',
            function() {
                MM.log('Executing Upload sync operation FINISHED:' + sync.options.filename, 'Sync');
                MM.db.remove('sync', sync.id);
            },
            function() {
                MM.log('Error uploading', 'Sync');
            },
            options
        );
    },

    /*
     * Performs a file download sync.
     */
    wsSyncDownload: function(sync) {
        // Only sync files of current site, mainly for performance.
        if (sync.siteid == MM.config.current_site.id) {
            // Append the token for safe download of files.
            sync.url = sync.url + '&token=' + MM.config.current_token;
            MM.log('Sync: Starting download of ' + sync.url + ' to ' + sync.newfile);
            MM.fs.createDir(sync.path, function() {
                MM.moodleDownloadFile(sync.url, sync.newfile, function(fullpath) {
                    MM.log('Download of content finished ' + sync.newfile + ' URL: ' + sync.url, 'Sync');
                    var content = MM.db.get('contents', sync.contentid).toJSON();
                    content.contents[sync.index].localpath = sync.newfile;
                    MM.log('Storing local path in content', 'Sync');
                    MM.db.insert('contents', content);
                    MM.db.remove('sync', sync.id);
                }, function(fullpath) {
                    MM.log('Error downloading ' + sync.newfile + ' URL: ' + sync.url, 'Sync');
                });
            });
        }
    },

    /**
     * Loads the settings panel
     */
    displaySettings: function() {

        // Settings plugins.
        var plugins = [];
        for (var el in MM.plugins) {
            var plugin = MM.plugins[el];
            if (plugin.settings.type == 'setting') {
                plugins.push(plugin.settings);
            }
        }

        var html = MM.tpl.render($('#settings_template').html(), {plugins: plugins});
        MM.panels.show('center', html);
    },

    /**
     * Generic function for adding the wstoken to Moodle urls and for pointing to the correct script.
     * For download remote files from Moodle we need to use the special /webservice/pluginfile passing the ws token as a get parameter.
     *
     * @param {string} url The url to be fixed.
     */
    fixPluginfile: function(url) {
        var token = MM.config.current_token;
        url += '?token=' + token;
        url = url.replace('/pluginfile', '/webservice/pluginfile');
        return url;
    },

    /**
     * Generic logging function which is only active if dev_debug is true
     *
     * @param {string} text      The text to be logged.
     * @param {string} component The component the text is relevant to.
     */
    log: function(text, component) {
        if (!MM.getConfig('dev_debug')) {
            return;
        }
        if (!component) {
            component = 'Core';
        }

        var d = new Date();
        text = d.toLocaleString() + ' ' + component + ': ' + text;

        if (window.console) {
            console.log(text);
        }
        var length = MM.logData.unshift(text);

        if (length > MM.config.log_length) {
            MM.logData.pop();
        }
    },

    /**
     * Error logging function which is only active if dev_debug is true.
     * Gives the text and a stack trace for each error.
     * Does not save the details to logData.
     *
     * @param {string} text      The text to be logged
     * @param {string} component The component the text is relevant to.
     */
    errorLog: function(text, component) {
        if (!MM.getConfig('dev_debug')) {
            return;
        }
        var d = new Date();
        text = d.toLocaleString() + ' ' + component + ': ' + text;

        if (typeof(window.console.trace) == 'function') {
            console.trace(text);
        } else {
            console.log(text);
        }
    },

    getFormattedLog: function(filter) {
        if (!MM.getConfig('dev_debug')) {
            return "";
        }

        if (typeof(filter) != 'string') {
            filter = "";
        }

        var logInfo = '';
        var last = '';

        for (var el in MM.logData) {
            if(filter && MM.logData[el].indexOf(filter) == -1) {
                continue;
            }

            var info = MM.logData[el].split(": ");

            if (last.indexOf(info[1]) == -1) {
                logInfo += MM.logData[el] + "<br />";
            }
            last = MM.logData[el];
        }

        return logInfo;
    },

    /**
     * Generic function for displaying error messages in the app
     *
     * @this {MM}
     * @param {string} text The text to be displayed inside the popup.
     */
    popErrorMessage: function(text) {

        if(!text) {
            return;
        }
        // Reset routing to avoid leave the user stuck, see MOBILE-307
        MM.Router.navigate("");

        var options = {
            title: MM.lang.s('error'),
            autoclose: 5000
        };
        this.popMessage(text, options);
    },

    /**
     * Generic function for displaying messages in the app
     *
     * @param {string} text The text to be displayed inside the popup.
     * @param {Object} options Extra options regarding the popup layout.
     */
    popMessage: function(text, options) {
        if (typeof options == 'undefined') {
            options = {};
        }

        MM.widgets.dialog(text, options);
    },

    /**
     * Generic pop up confirm window
     *
     * @param {string} text The text to be displayed.
     * @param {object} callBack The function to be called when user confirms.
     */
    popConfirm: function(text, callBack) {
        var options = {
            buttons: {}
        };
        options.buttons[MM.lang.s('yes')] = callBack;
        options.buttons[MM.lang.s('no')] = MM.widgets.dialogClose;

        MM.popMessage(text, options);
    },

    /**
     * Function for opening external links in a new browser
     *
     * @param {string} selector A selector for handling the links
     */
    handleExternalLinks: function(selector) {
        MM.setExternalLinksHREF(selector);
        $(selector).bind(MM.clickType, MM.externalLinkClickHandler);
    },

    /**
     * This is an ugly hack for preventing in any case opening the link using the default action.
     * We store the actual link in a data-link attribute and replace the href with a #
     * Using # prevents opening any page in the webview browser
     *
     * @param {string} selector Selector for the links
     */
    setExternalLinksHREF: function(selector) {
        if (MM.clickType != 'click') {
            $(selector).bind('click touchstart', function(e) {
                // This is an ugly hack for preventing in any case opening the link using the default action.
                // This prevent also problems related to bubbling an stopping the propagation on touch move events
                // We store the actual link in a data-link attribute and replace the href with a #
                // Using # prevents opening any page in the webview browser
                var href = $(this).attr('href');
                if (href != "#") {
                    MM.Router.navigate("");
                    $(this).attr('data-link', href);
                    $(this).attr('href', '#');
                    $(this).attr('target', '_self');
                }
            });
        }
    },

    /**
     * Returns whether the current window supports child browsers.
     * Created for ease of testing
     * @return {Bool} TRUE if window.plugins && window.plugins.childBrowser
     *                FALSE otherwise
     */
    _canUseChildBrowser: function() {
        return window.plugins && window.plugins.childBrowser;
    },

    /**
     * Handle external link click events
     *
     * @param {object} e The event
     */
    externalLinkClickHandler: function(e) {
        e.preventDefault();
        // This prevents open the link when we are scrolling.
        if (!MM.touchMoving) {
            var link = ($(this).attr('href') == '#')? $(this).attr('data-link') : $(this).attr('href');
            if (MM._canUseChildBrowser()) {
                MM.log('Launching childBrowser');
                try {
                    window.plugins.childBrowser.showWebPage(
                        link,
                        {
                            showLocationBar: true ,
                            showAddress: false
                        }
                    );
                } catch(e) {
                    MM.log('Launching childBrowser failed!, opening as standard link');
                    window.open(link, '_blank');
                }
            }
            else if(typeof(navigator.app) != "undefined" && typeof(navigator.app.loadUrl) != "undefined") {
                MM.log('Opening external link using navigator.app');
                navigator.app.loadUrl(link, { openExternal:true } );
            } else {
                MM.log('Opening external link using window.open');
                window.open(link, '_blank');
            }
        }
        if (typeof(MM.plugins.contents.infoBox) != "undefined") {
            MM.plugins.contents.infoBox.remove();
        }
    },

    /**
     * Function for opening external files.
     *
     * @param {string} selector A selector for handling the links to files
     */
    handleFiles: function(selector) {
        MM.setFileLinksHREF(selector);
        $(selector).bind(MM.clickType, MM.fileLinkClickHandler);
    },

    /**
     * This is an ugly hack for preventing in any case opening the link using the default action.
     * This prevent also problems related to bubbling an stopping the propagation on touch move events
     * We store the actual link in a data-link attribute and replace the href with a #
     * Using # prevents opening any page in the webview browser
     *
     * @param {string} selector Selector for the links
     */
    setFileLinksHREF: function(selector) {
        if (MM.clickType != 'click') {
            $(selector).bind('click touchstart', function(e) {
                // This is an ugly hack for preventing in any case opening the link using the default action.
                // This prevent also problems related to bubbling an stopping the propagation on touch move events
                // We store the actual link in a data-link attribute and replace the href with a #
                // Using # prevents opening any page in the webview browser
                var href = $(this).attr('href');
                if (href != "#") {
                    MM.Router.navigate("");
                    $(this).attr('data-link', href);
                    $(this).attr('href', '#');
                    $(this).attr('target', '_self');
                }
            });
        }
    },

    /**
     * Handle file link click events
     *
     * @param {object} e The event
     */
    fileLinkClickHandler: function(e) {
        e.preventDefault();
        MM.setFileLinksHREF(e.currentTarget);
        // This prevents open the link when we are scrolling.
        if (!MM.touchMoving) {
            var link = $(this).attr('href');
            if (link === '#') {
                link = $(this).attr('data-link');
            }
            if(window.plugins) {
                var extension = link.substr(link.lastIndexOf(".") + 1);
                var mimetype = '';
                if (typeof(MM.plugins.contents.templates.mimetypes[extension])!= "undefined") {
                    mimetype = MM.plugins.contents.templates.mimetypes[extension];
                }
                if (window.plugins.webintent) {
                        var iParams = {
                            action: "android.intent.action.VIEW",
                            url: link,
                            type: mimetype['type']
                        };

                        window.plugins.webintent.startActivity(
                            iParams,
                            function() {
                                MM.log('Intent launched');
                            },
                            function() {
                                MM.log('Intent launching failed');
                                MM.log('action: ' + iParams.action);
                                MM.log('url: ' + iParams.url);
                                MM.log('type: ' + iParams.type);
                                // This may work in cordova 2.4 and onwards
                                window.open(link, '_blank');
                            }
                        );
                } else if (MM._canUseChildBrowser()) {
                    MM.log('Launching childBrowser');
                    try {
                        window.plugins.childBrowser.showWebPage(
                            link,
                            {
                                showLocationBar: true ,
                                showAddress: false
                            }
                        );
                    } catch(e) {
                        MM.log('Launching childBrowser failed!, opening as standard link');
                        window.open(link, '_blank');
                    }
                } else {
                    // Changing _blank for _system may work in cordova 2.4 and onwards
                    MM.log('Open external file using window.open');
                    window.open(link, '_blank');
                }
            }
        }
        if (typeof(MM.plugins.contents.infoBox) != "undefined") {
            MM.plugins.contents.infoBox.remove();
        }
    },

    /**
     * Loads additional JS files presents in the config.json file
     * See MOBILE-239
     *
     */
    loadExtraJs: function() {
        if (MM.deviceConnected()) {
            if (MM.config.extra_js && MM.config.extra_js.length > 0) {
                $.each(MM.config.extra_js, function(index, fileurl) {
                    MM.log("MM: Loading additional javascript file " + fileurl);
                    $.ajax({
                        url: fileurl,
                        dataType: "script",
                        timeout: "10000",
                        success: function() {
                            MM.log("MM: Loaded additional javascript file " + fileurl);
                        }
                    });
                });
            }
        }
    },

    /**
     * Detects the current device OS at runtime.
     *
     * @returns {string} The device OS name in lower case
     */
    getOS: function() {
        var os = MM.deviceOS;
        // We rely on phonegap information.
        // TODO - Check in Kindle
        if (window.device && window.device.platform) {
            os = window.device.platform;
        }
        return os.toLowerCase();
    },

    /**
     * Displays a loading modal window
     *
     * @param {string} title The title of the modal window
     * @param {string} title The text of the modal window
     */
    showModalLoading: function (title, text) {
        if (!title) {
            title = '';
        }
        if (!text) {
            text = '';
        }

        var options = {
            title: title
        };
        var body = '<div class="centered loading-icon"><img src="img/loadingblack.gif"><br />' +text+ '</div>';

        MM.widgets.dialog(body, options);
    },

    /**
     * Close a modal loading window
     */
    closeModalLoading: function() {
        MM.widgets.dialogClose();
    },

    /**
     * Refresh the curren site, purging all WS caches and reloading the app basic layout
     */
    refresh: function() {
        MM.Router.navigate("");
        MM.cache.purge();
        MM.loadSite(MM.config.current_site.id);
    },

    /**
     * Log outs current user
     *
     */
    logoutUser: function() {
        var remember = MM.config.current_site.remember;
        if (remember === false) {
            MM.db.update(
                'sites', MM.config.current_site.id, {'token':undefined}
            );
        }

        // Setting config of current_token requires details of current_site.
        MM.setConfig("current_token", null);
        MM.setConfig("current_site", null);
        MM.config.current_token = null;
        MM.config.current_site = null;

        location.href = "index.html";
    },


    /**
     * Requires a user to log into the main site before calling the callback
     */
    requireMainSiteLogin: function(callback) {
        var url = MM.config.current_site.siteurl + "/local/totaramobile/login.php";
        var data = {checkloggedin: MM.config.current_site.username}
        $.post(url, data, function(response) {
            if (response.data.logged_in) {
                callback();
            } else {
                MM.logInToMainSite(callback);
            }
        }, "json");
    },


    /**
     * Logs a user into the main site
     */
    logInToMainSite: function(callback, error) {
        MM.mainSiteLoginCallback = callback;
        var template = $("#main-site-login-template");
        var context = {error: error};
        var html = MM.tpl.render(template.html(), context);
        MM.panels.html('center', html);
        $("#main-site-login-form").submit(MM.handleMainSiteLoginForm);
    },

    /**
     * Handle main site login form
     */
    handleMainSiteLoginForm: function(ev) {
        ev.preventDefault();
        var username = MM.config.current_site.username;
        var password = $(this).find("#main-site-login-form-password").val();
        var siteurl = MM.config.current_site.siteurl;
        MM.processMainSiteLogin(siteurl, username, password, function() {
            MM.mainSiteLoginCallback();
        }, function() {
            MM.logInToMainSite(MM.mainSiteLoginCallback, response.error);
        });
    },

    /**
     * Sends a username and password to /login/index.php which logs the user in.
     */
    processMainSiteLogin: function(siteurl, username, password, successCallback, failureCallback) {
        var url = siteurl + "/local/totaramobile/login.php";
        var data = {
            username: username,
            password: password
        }
        $.post(url, data, function(response) {
            if (response.success) {
                if (typeof(successCallback) !== "undefined") {
                    successCallback();
                }
            } else {
                if (typeof(failureCallback) !== "undefined") {
                    failureCallback();
                }
            }
        }, "json");
    }
};
