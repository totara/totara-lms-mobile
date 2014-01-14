var templates = [
    "root/externallib/text!root/plugins/settings/deviceInfoTemplate.html",
    "root/externallib/text!root/plugins/settings/showReportBug.html",
    "root/externallib/text!root/plugins/settings/showLog.html",
    "root/externallib/text!root/plugins/settings/showDeviceInfo.html",
    "root/externallib/text!root/plugins/settings/development.html",
    "root/externallib/text!root/plugins/settings/addSiteForm.html",
    "root/externallib/text!root/plugins/settings/showSites.html",
    "root/externallib/text!root/plugins/settings/showSync.html",
    "root/externallib/text!root/plugins/settings/showSite.html",
    "root/externallib/text!root/plugins/settings/main.html"
];

require(templates, function(deviceInfoTpl, showReportBug, showLog, showDeviceInfo, showDevelopment, addSiteForm, showSites, showSync, showSite, main) {
    var plugin = {
        settings:{
            name: "settings",
            type: "general",
            menuURL: "#settings",
            title: "Settings",
            lang: {
                component: "core"
            },
            icon: ""
        },

        templates:{
            main:main,
            addSiteForm:addSiteForm,
            showSites:showSites,
            showSync:showSync,
            showSite:showSite,
            showDevelopment: showDevelopment,
            showDeviceInfo: showDeviceInfo,
            showLog: showLog,
            showReportBug: showReportBug,
            mailBody: deviceInfoTpl
        },

        routes:[
            ['settings', 'settings', "display"],
            ['settings/:section/', 'settings_section', "showSection"],
            ['settings/sites/:siteid', 'settings_sites_show_site', "showSite"],
            ['settings/sites/add', 'settings_sites_add_site', "addSite"],
            ['settings/sites/delete/:siteid', 'settings_sites_delete_site', "deleteSite"],
            ['settings/general/purgecaches', 'settings_general_purgecaches', MM.cache.purge],
            ['settings/sync/lang', 'settings_sync_lang', function() { MM.lang.sync(true); }],
            ['settings/sync/css', 'settings_sync_css', function() { MM.sync.css(true); }],
            ['settings/development/', 'showDevelopment', "showDevelopment"],
            ['settings/development/device', 'show_device_info', "showDeviceInfo"],
            ['settings/development/log/:filter', 'settings_show_log', "showLog"],
            ['settings/development/reportbug', 'settings_report_bug', "showReportBug"]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet.
            MM.plugins.settings.sizes = {
                withSideBar: {
                    center:$(document).innerWidth() - MM.navigation.getWidth(),
                    left:MM.navigation.getWidth()
                },
                withoutSideBar: {
                    center:$(document).innerWidth(),
                    left:0
                }
            };

            if (MM.deviceType === "phone") {
                MM.plugins.settings.sizes = {
                    withSideBar: {
                        center:0,
                        left:0
                    },
                    withoutSideBar: {
                        center:"100%",
                        left:0
                    }
                };
            }

        },

        resize: function() {
            if (MM.plugins.settings.sizes == undefined) {
                MM.plugins.settings._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.settings.sizes.withSideBar.center,
                    'left':MM.plugins.settings.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.settings.sizes.withoutSideBar.center,
                    'left':MM.plugins.settings.sizes.withoutSideBar.left
                });
            }

            if (MM.deviceType === "phone") {
                $("#panel-center").css({
                    'width':'100%',
                    'left':0
                });
            }

            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").html("").hide();
        },

        showSection: function(section) {
            // We call the function dynamically.
            MM.plugins.settings[
                'show' + section.charAt(0).toUpperCase() + section.slice(1)
            ]();
        },

        showSite: function(siteId) {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var site = MM.db.get('sites', siteId);
            var options = {
                title: site.get('sitename'),
                buttons: {}
            };

            if (siteId != MM.config.current_site.id) {
                options.buttons[MM.lang.s('select')] = function() {
                    MM.widgets.dialogClose();
                    MM.loadSite(siteId);
                };
            }
            /*
            options.buttons[MM.lang.s("delete")] = function() {
                MM.Router.navigate("settings/sites/delete/" + siteId, {trigger: true, replace: true});
            };*/
            options.buttons[MM.lang.s('cancel')] = function() {
                MM.widgets.dialogClose();
                MM.Router.navigate('settings/sites/');
            };

            $("panel-center").hide();

            var text = MM.tpl.render(MM.plugins.settings.templates.showSite, {
                siteurllabel:MM.lang.s('siteurllabel'),
                siteurl:site.get('siteurl'),
                fullname:MM.lang.s('fullname')
            });

            //$("panel-right").show();

            MM.widgets.dialog(text, options);
        },

        addSite: function(e, setting) {
            var html = '';

            var options = {
                title: MM.lang.s('addsite'),
                buttons: {}
            };
            options.buttons[MM.lang.s('add')] = function() {
                var siteurl = $.trim($('#new-url').val());
                var username = $.trim($('#new-username').val());
                var password = $.trim($('#new-password').val());

                $('form span.error').css('display', 'block').html('');

                // Delete the last / if present.
                if (siteurl.charAt(siteurl.length - 1) == '/') {
                    siteurl = siteurl.substring(0, siteurl.length - 1);
                }

                // Convert siteurl to lower case for avoid validation problems. See MOBILE-294
                siteurl = siteurl.toLowerCase();

                var stop = false;

                if (siteurl.indexOf('http://localhost') == -1 && !MM.validateURL(siteurl)) {
                    stop = true;
                    $('#new-url').next().html(MM.lang.s('siteurlrequired'));
                }

                if (MM.db.get('sites', hex_md5(siteurl + username))) {
                    // We must allow overrride sites
                    //stop = true;
                    //$('#new-url').next().html(MM.lang.s('siteexists'));
                }

                if (!username) {
                    stop = true;
                    $('#new-username').next().html(MM.lang.s('usernamerequired'));
                }
                if (!password) {
                    stop = true;
                    $('#new-password').next().html(MM.lang.s('passwordrequired'));
                }

                if (!stop) {
                    MM.widgets.dialogClose();
                    MM.saveSite(username, password, siteurl);
                    if (MM.deviceType == 'phone') {
                        location.href = "index.html";
                    }
                }
            };

            // Reset the route.
            options.buttons[MM.lang.s('cancel')] = function() {
                MM.widgets.dialogClose();
                window.history.back();
            };

            html = MM.tpl.render(MM.plugins.settings.templates.addSiteForm, {
                siteurl:MM.lang.s('siteurl'),
                username:MM.lang.s('username'),
                password:MM.lang.s('password')
            });

            MM.widgets.dialog(html, options);
            e.preventDefault();
        },

        deleteSite: function(siteId) {
            var site = MM.db.get('sites', siteId);
            MM.popConfirm(MM.lang.s('deletesite'), function() {
                var count = MM.db.length('sites');
                if (count == 1) {
                    MM.db.remove('sites', siteId);
                    setTimeout(function() {
                        MM.logoutUser();
                    }, 1000);
                } else {
                    MM.db.remove('sites', siteId);
                    setTimeout(function() {
                        MM.Router.navigate('settings/sites/');
                    }, 1000);
                }
            });
        },

        display: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            // Settings plugins.
            var plugins = [];
            for (var el in MM.plugins) {
                var plugin = MM.plugins[el];
                if (plugin.settings.type == 'setting') {
                    plugins.push(plugin.settings);
                }
            }

            var pageTitle = MM.lang.s("settings");
            var html = MM.tpl.render(
                MM.plugins.settings.templates.main,
                {plugins: plugins, title: MM.plugins.settings.settings.title}
            );
            MM.panels.show('center', html, {title: pageTitle});
            MM.util.setupBackButton();
            /*if (MM.deviceType == 'tablet') {
                $("#panel-center li:eq(0)").addClass("selected-row");
                MM.plugins.settings.showSites();
                MM.Router.navigate("#settings");
            }*/
        },

        showSites: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var sites = [];

            MM.db.each('sites', function(el) {
                sites.push(el.toJSON());
            });

            MM.collections.sites.fetch();

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showSites, {
                    sites: sites,
                    current_site: MM.config.current_site.id,
                    title: MM.lang.s("settings") + " - " + MM.lang.s("sites")
                }
            );

            MM.panels.show('center', html);

            MM.util.setupBackButton();
            $("#panel-center").show();

        },

        resetApp: function(e) {

            MM.popConfirm(MM.lang.s('areyousurereset'), function() {
                // Delete all the entries in local storage
                for (var el in localStorage) {
                    localStorage.removeItem(el);
                }

                // Redirect to main page
                location.href = 'index.html';
            });

            e.preventDefault();

        },

        showSync: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var settings = [
                {
                    id: 'sync_ws_on',
                    type: 'checkbox',
                    label: MM.lang.s('enableautosyncws'),
                    checked: true,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'sync_lang_on',
                    type: 'checkbox',
                    label: MM.lang.s('enableautosynccss'),
                    checked: true,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'sync_css_on',
                    type: 'checkbox',
                    label: MM.lang.s('enableautosynclang'),
                    checked: true,
                    handler: MM.plugins.settings.checkboxHandler
                }
            ];

            // Load default values
            $.each(settings, function(index, setting) {
                if (setting.type == 'checkbox') {
                    if (typeof(MM.getConfig(setting.id)) != 'undefined') {
                        settings[index].checked = MM.getConfig(setting.id);
                    }
                }
            });

            var syncFilter = MM.db.where('sync', {siteid: MM.config.current_site.id});
            var syncTasks = [];

            $.each(syncFilter, function(index, el) {
                syncTasks.push(el.toJSON());
            });

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showSync, {
                    tasks: syncTasks,
                    settingsList: settings,
                    title: MM.lang.s("settings") + " - " + MM.lang.s("synchronization")
                }
            );

            MM.panels.show('center', html);

            MM.util.setupBackButton();

            // Once the html is rendered, we pretify the widgets.
            MM.widgets.enhance(settings);
            MM.widgets.addHandlers(settings);
        },

        showDevelopment: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var settingsC = [
                {
                    id: 'dev_debug',
                    type: 'checkbox',
                    label: MM.lang.s('enabledebugging'),
                    checked: false,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'dev_offline',
                    type: 'checkbox',
                    label: MM.lang.s('forceofflinemode'),
                    checked: false,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'dev_css3transitions',
                    type: 'checkbox',
                    label: MM.lang.s('enablecss3transitions'),
                    checked: false,
                    handler: MM.plugins.settings.checkboxHandler
                },
                {
                    id: 'cache_expiration_time',
                    type: 'spinner',
                    label: MM.lang.s('cacheexpirationtime'),
                    config: {
                        clickPlus: function() {
                            var el = $("#cache_expiration_time-text");
                            var val = parseInt(el.val()) + 25000;
                            el.val(val);
                            MM.setConfig("cache_expiration_time", val);
                        },
                        clickMinus: function() {
                            var el = $("#cache_expiration_time-text");
                            var val = parseInt(el.val()) - 25000;
                            if (val < 0) {
                                val = 0;
                            }
                            el.val(val);
                            MM.setConfig("cache_expiration_time", val);
                        }
                    }
                }
            ];

            // Load default values
            $.each(settingsC, function(index, setting) {
                if (setting.type == 'checkbox') {
                    if (typeof(MM.getConfig(setting.id)) != 'undefined') {
                        settingsC[index].checked = MM.getConfig(setting.id);
                    }
                }
            });

            var settingsB = [
                {
                    id: 'dev_purgecaches',
                    type: 'button',
                    label: MM.lang.s('purgecaches'),
                    handler: function(e) {
                        MM.cache.purge();
                        e.preventDefault();
                    }
                },
                {
                    id: 'dev_deviceinfo',
                    type: 'button',
                    label: MM.lang.s('deviceinfo'),
                    handler: MM.plugins.settings.showDeviceInfo
                },
                //{id: 'dev_fakenotifications', type: 'button', label: MM.lang.s('addfakenotifications'), handler: MM.plugins.settings.addFakeNotifications},
                {
                    id: 'dev_showlog',
                    type: 'button',
                    label: MM.lang.s('showlog'),
                    handler: MM.plugins.settings.showLog
                },
                {
                    id: 'dev_resetapp',
                    type: 'button',
                    label: MM.lang.s('resetapp'),
                    handler: MM.plugins.settings.resetApp
                }
            ];

            /*
            if (!MM.rdebugger.enabled) {
                settingsB.push({id: 'dev_rdebugging', type: 'button', label: MM.lang.s('enablerdebugger'), handler: MM.rdebugger.start});
            } else {
                settingsB.push({id: 'dev_rdebugging', type: 'button', label: MM.lang.s('disablerdebugger'), handler: MM.rdebugger.finish});
            }
            */

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showDevelopment, {
                    settingsListB: settingsB,
                    settingsListC: settingsC,
                    title: MM.lang.s("settings") + " - " + MM.lang.s("development")
                }
            );

            MM.panels.show('center', html);

            MM.util.setupBackButton();

            // Once the html is rendered, we prettify the widgets.
            MM.widgets.enhance(settingsC);
            MM.widgets.addHandlers(settingsC);
            MM.widgets.enhance(settingsB);
            MM.widgets.addHandlers(settingsB);
        },

        checkboxHandler: function(e, setting) {
            setTimeout(function() {
                var val = false;
                if ($('#' + setting.id).is(':checked')) {
                    val = true;
                }

                MM.setConfig(setting.id, val);
            }, 500);
        },

        addFakeNotifications: function(e, setting) {
            var notification = {
                userfrom: 'Component or user from',
                date: 'yesterday',
                id: '123456',
                type: 'calendar',
                urlparams: 'additional data',
                aps: {alert: 'Fake notification'}
            };
            if (MM.plugins.notifications) {
                MM.plugins.notifications.saveAndDisplay({
                    notification: notification
                });
            }
            // This is for preserving the Backbone hash navigation.
            e.preventDefault();
        },

        _getDeviceInfo: function() {
            // Default data.
            // Quoted fields are reserved keywords in JS.
            var x = {
                versionName :MM.config.versionname,
                versionCode : MM.config.versioncode,
                'navigator' : {},
                location : location.href,
                currentLang : MM.lang.current,
                deviceConnected : MM.deviceConnected(),
                overflowScrollingSupported : MM.util.overflowScrollingSupported(),
                'document' : {
                    'innerWidth':$(document).innerWidth(),
                    'innerHeight':$(document).innerHeight(),
                    'width':$(document).width(),
                    'height':$(document).height()
                },
                'window' : {
                    'width':$(window).width(),
                    'height':$(window).height()
                },
                svgSupport : false,
                properties : {},
                phonegap : {},
                phonegapLoaded: (typeof(window.device) != "undefined"),
                pluginsLoaded: true
            };

            // Navigator
            var data = ["userAgent", "platform", "appName", "appVersion", "language"];
            for (var i in data) {
                var el = data[i];
                if (typeof(navigator[el]) != "undefined") {
                    x['navigator'][el] = navigator[el];
                }
            }

            // MM properties
            data = [
                "deviceReady", "deviceType", "deviceOS", "inComputer", "webApp",
                "clickType", "scrollType"
            ];
            for (var i in data) {
                el = data[i];
                if (typeof(MM[el]) != "undefined") {
                    // Default to assuming it's a property of MM.
                    // Then if it's actually a boolean change to 1 or 0 as appropriate.
                    var val = MM[el];
                    if (typeof(MM[el]) == "boolean") {
                        val = (MM[el])? "1" : "0";
                    }
                    x.properties[el] = val;
                }
            }

            var svgsupport = false;
            if ((!!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect) ||
                 !!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
                svgsupport = true;
            }
            x.svgSupport = svgsupport;

            // x.phonegapLoaded = false means phonegap.cordova wasn't loaded
            // x.pluginsLoaded = false if no plugins are available
            if (typeof(window.device) != "undefined") {
                data = ["name", "phonegap", "cordova", "platform", "uuid", "version", "model"];
                for (var i in data) {
                    var el = data[i];
                    if (typeof(device[el]) != "undefined") {
                        x.phonegap[el] = device[el];
                    }
                }
                x.phonegap.rootFS = MM.fs.getRoot();

                if (window.plugins) {
                    x.phonegap.plugins = [];
                    for (var el in window.plugins) {
                        x.phonegap.plugins.push(el);
                    }
                } else {
                    x.pluginsLoaded = false;
                }
            }

            return x;
        },

        /**
         * Converts all closing p tags to a new line
         * Removes all other tags.
         */
        _stripHTMLTags: function(text) {
            return text.replace(/<\/p>/ig,"\n").replace(/(<([^>]+)>)/ig,"");
        },

        showDeviceInfo: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            var info = MM.plugins.settings._getDeviceInfo();
            var mailBody = MM.tpl.render(
                MM.plugins.settings.templates.mailBody, {'info':info}
            );

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showDeviceInfo, {
                    info: info,
                    title: MM.lang.s("settings") + " - " + MM.lang.s("development"),
                    mailBody: mailBody
                }
            );

            MM.panels.show('center', html);

            MM.util.setupBackButton();
        },

        // Moved out of mm.js
        showLog: function(filter) {

            var logInfo = MM.getFormattedLog(filter);

            var mailBody = encodeURIComponent(
                logInfo.replace(/<br \/>/ig,"\n").replace(/(<([^>]+)>)/ig,"")
            );

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showLog, {
                    mailToSubject: MM.config.current_site.username + '?subject=MMLog&body=' + mailBody,
                    loginfo: logInfo,
                    title: MM.lang.s("settings") + " - " + MM.lang.s("development")
                }
            );

            MM.panels.show('center', html);

            MM.util.setupBackButton();

            $("#logfilter").keyup(function(e) {
                if(e.keyCode == 13) {
                    MM.plugins.settings.showLog($("#logfilter").val());
                }
            });
            $("#clear").on('click', MM.plugins.settings.showLog);
        },

        showReportbug: function() {
            MM.assignCurrentPlugin(MM.plugins.settings);

            info = MM.plugins.settings._getDeviceInfo();

            // Some space for the user.
            var mailInfo = MM.lang.s("writeherethebug") + "\n\n\n\n";
            mailInfo += MM.tpl.render(
                MM.plugins.settings.templates.mailBody, {'info':info}
            );
            mailInfo += "==========================\n\n";
            mailInfo += MM.getFormattedLog();

            var html = MM.tpl.render(
                MM.plugins.settings.templates.showReportBug, {
                    title: MM.lang.s("settings") + " - " + MM.lang.s("development"),
                    mailInfo: mailInfo
                }
            );

            MM.panels.show('center', html);

            MM.util.setupBackButton();
        }
    };

    MM.registerPlugin(plugin);
});
