var templates = [
    "root/externallib/text!root/plugins/scorm/scorm.html",
    "root/externallib/text!root/plugins/scorm/scorm_launch.html",
];

define(templates, function(scormTpl, scormLaunchTpl) {
    var plugin = {
        settings: {
            name: "scorm",
            type: "general",
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
            $("#panel-right").hide();
        },

        cleanUp: function() {
            $("#panel-center").html("");
            $("#panel-right").show();
        },

        currentCourseInfo: null,

        scorm: function(cmid) {
            MM.assignCurrentPlugin(MM.plugins.label);
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
            var template = MM.plugins.scorm.templates.scorm;
            var context = { scorm: scorm };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            $("#scorm-form").submit(MM.plugins.scorm.scormFormSubmitHandler);
        },

        scormFormSubmitHandler: function(ev) {
            ev.preventDefault();
            MM.panels.showLoading("center");
            var cmid = $(this).find("#cmid").val();
            var mode = $(this).find("input[name='mode']:checked").val();
            var newAttempt =  $(this).find("#new-attempt").is(":checked");
            var url = "scorm/" + cmid + "/launch/" + mode;
            if (newAttempt) url += "/new-attempt";
            MM.Router.navigate(url);
        },

        scormLaunch: function(cmid, mode, newAttempt) {
            MM.assignCurrentPlugin(MM.plugins.label);
            MM.panels.showLoading("center");
            var template = MM.plugins.scorm.templates.scormLaunch;
            var context = {
                cmid: cmid,
                mode: mode,
                newAttempt: newAttempt ? "on" : "off"
            };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
        },

        errorCallback: function(error) {
            MM.log(error);
        }
    }

    MM.registerPlugin(plugin);
});
