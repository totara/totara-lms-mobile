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
            ["scorm/:cmid/launch", "scormLaunch", "scormLaunch"],
        ],

        currentCourseInfo: null,

        scorm: function(cmid) {
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
            console.log(scorm);
            var template = MM.plugins.scorm.templates.scorm;
            var context = { scorm: scorm };
            var html = MM.tpl.render(template.html, context);
            MM.panels.show("center", html);
            $("#scorm-form").submit(MM.plugins.scorm.scormFormSubmitHandler);
        },

        scormFormSubmitHandler: function(ev) {
            ev.preventDefault();
            var scormid = $(this).find('#scormid').val();
            MM.Router.navigate('scorm/2/launch');
            MM.panels.showLoading("center");
            var template = MM.plugins.scorm.templates.scormLaunch;
            var context = {
                cmid: $(this).find("#cmid").val(),
                mode: $(this).find("input[name='mode']:checked").val(),
                newAttempt: $(this).find("#new-attempt").is(":checked") ? "on" : "off"
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
