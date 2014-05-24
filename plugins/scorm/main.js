var templates = [
    "root/externallib/text!root/plugins/scorm/scorm.html",
    "root/externallib/text!root/plugins/scorm/scorm_launch.html",
];

define(templates, function(scormTpl, scormLaunchTpl) {
    var plugin = {
        settings: {
            name: "scorm",
            type: "general-scorm",
            lang: {
                component: "core"
            }
        },

        templates: {
            scorm: { html: scormTpl },
            scormLaunch: { html: scormLaunchTpl },
        },

        routes: [,
            ["scorm/:cmid", "scorm", "scorm"],
            ["scorm/:cmid/launch/:mode(/:newAttempt)", "scormLaunch", "scormLaunch"]
        ],

        sizes: undefined,

        _getSizes: function() {
            // Default tablet
            MM.plugins.scorm.sizes = {
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
                MM.plugins.scorm.sizes = {
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
            if (MM.plugins.scorm.sizes == undefined) {
                MM.plugins.scorm._getSizes();
            }

            if (MM.navigation.visible === true) {
                $("#panel-center").css({
                    'width':MM.plugins.scorm.sizes.withSideBar.center,
                    'left':MM.plugins.scorm.sizes.withSideBar.left
                });
            } else {
                $("#panel-center").css({
                    'width':MM.plugins.scorm.sizes.withoutSideBar.center,
                    'left':MM.plugins.scorm.sizes.withoutSideBar.left
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
            $("#panel-right").show();
        },

        currentScorm:undefined,

        scorm: function(cmid) {
            MM.assignCurrentPlugin(MM.plugins.label);
            MM.Router.navigate("scorm/" + cmid);
            MM.panels.showLoading("center");
            var method = "mod_scorm_get_attempt_status";
            var data = {cmid: cmid};
            var callback = MM.plugins.scorm.scormCallback;
            var presets = { omitExpires: true, cache: false };
            var errorCallback = MM.plugins.course.errorCallback;
            MM.moodleWSCall(method, data, callback, presets, errorCallback);
        },

        scormCallback: function(response) {
            var scorm = response;

            // Record what the current scorm is for later use.
            MM.plugins.scorm.currentScorm = scorm;

            var template = MM.plugins.scorm.templates.scorm;
            var context = { scorm: scorm };
            var html = MM.tpl.render(template.html, context);

            MM.panels.show("center", html);
            MM.util.setupBackButton();
            $(document).find("#submitter").on('click', function(ev) {
                ev.preventDefault();
                var element = $(ev.target);
                var form = element.closest("form")
                MM.plugins.scorm.scormFormSubmitHandler(form);
                return false;
            });
            $(document).find("#cancel").on(
                'click', MM.plugins.scorm.cancelClicked
            );
        },

        scormFormSubmitHandler: function(form) {
            MM.panels.showLoading("center");
            var cmid = $(form).find("#cmid").val();
            var mode = $(form).find("input[name='mode']:checked").val();
            var newAttempt =  $(form).find("#new-attempt").is(":checked");
            var url = "scorm/" + cmid + "/launch/" + mode;
            if (newAttempt) url += "/new-attempt";
            MM.Router.navigate(url, true);

            return false;
        },

        cancelClicked: function(ev) {
            ev.preventDefault();
            var back = $(document).find("#back");
            if (back.length === 0) {
                window.history.back();
            } else {
                back.click();
            }

            return false;
        },

        /**
         * Launches a SCORM with the specified cmid and mode either redirecting
         * directly to the site ( because there's no offline ) option for SCORM
         * or going via a login page.
         *
         * @param int    cmid       Course Module ID
         * @param int    mode       The mode the scorm is played in.
         *                          Popup, inline, normal
         * @param string newAttempt 'new-attemp' or blank string.
         */
        scormLaunch: function(cmid, mode, newAttempt) {
            MM.assignCurrentPlugin(MM.plugins.label);
            MM.panels.showLoading("center");
            MM.requireMainSiteLogin(function() {
                MM.plugins.scorm._launch(cmid, mode, newAttempt);
            });
        },

        _launch: function(cmid, mode, newAttempt) {
            var scorm = MM.plugins.scorm.currentScorm;
            var template = MM.plugins.scorm.templates.scormLaunch;
            var context = {
                cmid: cmid,
                mode: mode,
                newAttempt: (newAttempt === "new-attempt") ? "on" : "off",
                title: scorm === undefined ? 'SCORM NAME' : scorm.scorm_name
            };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            MM.util.setupBackButton();
            $(document).find("#loadinpopup").on(
                'click', MM.plugins.scorm._loadInPopup
            );
        },

        _loadInPopup: function(ev) {
            ev.preventDefault();
            var src = $(document).find("iframe").attr('src');
            window.open(src);

            return false;
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
